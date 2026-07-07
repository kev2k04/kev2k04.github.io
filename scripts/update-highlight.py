#!/usr/bin/env python3
"""Refresh assets/data/latest-highlight.json with the newest Bagwork video.

Scrapes the Roundball BC channel's videos tab (newest-first), picks the first
video whose title mentions the team, and writes the JSON the basketball page
reads as its static fallback. Run weekly by .github/workflows/highlight.yml;
also fine to run locally: python3 scripts/update-highlight.py
"""
import json
import re
import sys
import urllib.request
from datetime import date, timezone, datetime
from pathlib import Path

CHANNEL_VIDEOS_URL = "https://www.youtube.com/@RoundballBC/videos"
TEAM_PATTERN = re.compile(r"bagwork", re.IGNORECASE)
OUT_PATH = Path(__file__).resolve().parent.parent / "assets/data/latest-highlight.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8", "replace")


def channel_videos(html):
    """Yield (videoId, title) in page order (newest first) from ytInitialData."""
    m = re.search(r"var ytInitialData = ({.*?});</script>", html, re.S)
    if not m:
        return
    data = json.loads(m.group(1))
    seen = set()

    def title_text(title):
        """Read a title out of either the legacy or the lockup markup."""
        if not isinstance(title, dict):
            return ""
        if title.get("simpleText"):
            return title["simpleText"]
        if title.get("runs"):
            return "".join(run.get("text", "") for run in title["runs"])
        return title.get("content", "")  # lockupMetadataViewModel style

    def walk(node):
        if isinstance(node, dict):
            # Legacy: {video,gridVideo}Renderer with videoId + title runs.
            vid = node.get("videoId")
            text = title_text(node.get("title"))
            # Current (2025+): lockupViewModel with contentId + nested metadata.
            if not (vid and text) and node.get("contentId"):
                meta = (node.get("metadata") or {}).get(
                    "lockupMetadataViewModel") or {}
                lockup_title = title_text(meta.get("title"))
                if lockup_title:
                    vid, text = node["contentId"], lockup_title
            if vid and text and vid not in seen:
                seen.add(vid)
                yield vid, text
            for value in node.values():
                yield from walk(value)
        elif isinstance(node, list):
            for value in node:
                yield from walk(value)

    yield from walk(data)


def main():
    html = fetch(CHANNEL_VIDEOS_URL)
    match = None
    for vid, title in channel_videos(html):
        if TEAM_PATTERN.search(title):
            match = {"videoId": vid, "title": title}
            break

    if not match:
        print("No Bagwork video found on the channel — leaving JSON untouched.")
        return 0

    payload = {
        "_comment": ("Latest Bagwork highlight — written weekly by "
                     "scripts/update-highlight.py (see the highlight workflow). "
                     "The basketball page reads this when no /api/ functions exist."),
        "found": True,
        "videoId": match["videoId"],
        "title": match["title"],
        "lastUpdated": datetime.now(timezone.utc).date().isoformat(),
    }

    if OUT_PATH.exists():
        try:
            current = json.loads(OUT_PATH.read_text())
        except ValueError:
            current = {}
        if (current.get("videoId"), current.get("title")) == (
                payload["videoId"], payload["title"]):
            print("Already up to date: %s — %s" % (match["videoId"], match["title"]))
            return 0

    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print("Updated: %s — %s" % (match["videoId"], match["title"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
