source "https://rubygems.org"

# Use the github-pages gem so your local build matches what GitHub Pages
# runs in production. This pins Jekyll and all supported plugins to the
# exact versions GitHub Pages uses.
gem "github-pages", group: :jekyll_plugins

# Plugins explicitly enabled in _config.yml
group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Ruby 3.4+/4.0 removed these from the default gems, but Jekyll 3.9 (and its
# WEBrick dev server) still require them. Needed for local `jekyll serve`.
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"
gem "webrick"

# Windows and JRuby do not include zoneinfo files, so bundle the tzinfo-data
# gem and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
