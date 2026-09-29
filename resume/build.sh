#!/usr/bin/env bash
# Print resume/resume.html to the PDF the site links to, using headless Edge (or Chrome).
set -e
cd "$(dirname "$0")/.."
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -f "$E" ] || E="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$E" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(cygpath -w "$PWD/src/assets/Sahilpreet-Singh-Sidhu-Resume.pdf")" \
  "file:///$(cygpath -m "$PWD/resume/resume.html")"
