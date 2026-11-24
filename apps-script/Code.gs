/* =========================================================================
   Application kit queue (Google Apps Script web app).

   The hidden /vault/ page on kevliu.ca posts a job description here. This
   script checks the password and a daily limit, then emails the request to
   you with the subject "[Application Kit] Request: ...". An hourly scheduled
   Claude task finds those emails, writes the tailored résumé and cover
   letter, emails them back as Word files, and labels the request
   "Application Kit/Done".

   No AI runs here and no API key is needed.

   Script Properties (Project Settings > Script Properties):
     VAULT_PASSWORD   required  (same password as the /vault/ page)
     TO_EMAIL         optional  (defaults to the Google account running this)
     DAILY_LIMIT      optional  (defaults to 15 requests per day)

   Deploy: Deploy > New deployment > Web app, Execute as: Me,
   Who has access: Anyone. Put the /exec URL in _config.yml as vault_endpoint.
   ========================================================================= */

var SUBJECT_PREFIX = '[Application Kit] Request: ';

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var props = PropertiesService.getScriptProperties();

    if (!props.getProperty('VAULT_PASSWORD') || req.password !== props.getProperty('VAULT_PASSWORD')) {
      Utilities.sleep(1500);   // slow down guessing
      return reply({ ok: false, code: 'auth', error: 'Wrong password.' });
    }

    var jd = clean(req.jobDescription, 20000);
    var company = clean(req.company, 120);
    var role = clean(req.role, 160);
    var outputs = (req.outputs || []).filter(function (o) { return o === 'resume' || o === 'coverLetter'; });

    if (jd.split(/\s+/).length < 40) return reply({ ok: false, error: 'The job description is too short.' });
    if (!outputs.length) return reply({ ok: false, error: 'Pick a résumé, a cover letter, or both.' });
    if (!underDailyLimit(props)) return reply({ ok: false, error: 'Daily limit reached. Try again tomorrow.' });

    var id = Utilities.getUuid().slice(0, 8);
    var label = [role || 'Role not given', company || 'company not given'].join(' at ');
    var body = [
      'APPLICATION-KIT-REQUEST v1',
      'Request ID: ' + id,
      'Outputs: ' + outputs.join(', '),
      'Company: ' + (company || '(take it from the posting)'),
      'Role: ' + (role || '(take it from the posting)'),
      '',
      '----- JOB DESCRIPTION START -----',
      jd,
      '----- JOB DESCRIPTION END -----'
    ].join('\n');

    var to = props.getProperty('TO_EMAIL') || Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(to, SUBJECT_PREFIX + label + ' #' + id, body, { name: 'Application Kit' });

    return reply({ ok: true, queued: true, id: id, company: company });
  } catch (err) {
    console.error(err && err.stack || err);
    return reply({ ok: false, error: 'The backend hit an error: ' + (err && err.message || err) });
  }
}

/* A GET on the /exec URL is a quick health check. */
function doGet() {
  return reply({ ok: true, service: 'application-kit-queue' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean(s, max) {
  return String(s || '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}

function underDailyLimit(props) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var key = 'count-' + Utilities.formatDate(new Date(), 'America/Vancouver', 'yyyy-MM-dd');
    var limit = parseInt(props.getProperty('DAILY_LIMIT') || '15', 10);
    var used = parseInt(props.getProperty(key) || '0', 10);
    if (used >= limit) return false;
    props.setProperty(key, String(used + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* Run once from the editor (select testQueue > Run) to approve permissions
   and send yourself a sample request without the website. */
function testQueue() {
  var props = PropertiesService.getScriptProperties();
  var res = doPost({ postData: { contents: JSON.stringify({
    password: props.getProperty('VAULT_PASSWORD'),
    company: 'Example Corp',
    role: 'FP&A Analyst Intern',
    jobDescription: 'We are hiring an FP&A Analyst Intern to support monthly forecasting, budget-to-actual variance analysis, and executive reporting. ' +
      'You will build and maintain Excel models, automate recurring reports with Power Query and Power BI, partner with department leaders on budgets, ' +
      'and help prepare month-end results for leadership. Requirements: pursuing a degree in finance, accounting or economics; strong Excel; ' +
      'clear communication; comfort working with large datasets and ERP systems such as Oracle or SAP.',
    outputs: ['resume', 'coverLetter']
  }) } });
  console.log(res.getContent());
}
