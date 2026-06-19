#!/usr/bin/env bash
#
# env.sh: Recreate the local Bundler/Jekyll environment for this site.
#
# Why this exists:
#   * On many systems the default gem dir (e.g. /var/lib/gems) is root-owned,
#     so `bundle install` fails with a permission error. We install gems into
#     a project-local `vendor/bundle` instead.
#   * The `bundle` executable installed via `gem install --user-install` often
#     isn't on PATH. We add the user gem bin dir so `bundle` is found.
#
# Usage:
#   ./env.sh            # set up the environment, then install gems
#   source ./env.sh     # same, but also keeps the PATH change in your shell
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]:-$0}")"

# --- 1. Sanity check: Ruby must be present -----------------------------------
if ! command -v ruby >/dev/null 2>&1; then
  echo "Error: ruby is not installed. Install Ruby (>= 3.0) and retry." >&2
  echo "  Debian/Ubuntu: sudo apt install ruby-full" >&2
  echo "  macOS:         brew install ruby" >&2
  exit 1
fi
echo "Using $(ruby -v)"

# --- 2. Put the user gem bin dir on PATH (so `bundle` is found) ---------------
# Works regardless of username, home dir, or Ruby version.
GEM_USER_BIN="$(ruby -e 'print File.join(Gem.user_dir, "bin")')"
case ":$PATH:" in
  *":$GEM_USER_BIN:"*) ;;                 # already present
  *) export PATH="$GEM_USER_BIN:$PATH" ;;
esac

# --- 3. Ensure Bundler is installed ------------------------------------------
if ! command -v bundle >/dev/null 2>&1; then
  echo "Bundler not found; installing into your user gem dir..."
  gem install --user-install bundler
fi
echo "Using bundler $(bundle -v)"

# --- 4. Configure project-local gem install path (avoids permission errors) --
# Writes .bundle/config in this project. vendor/ should be gitignored.
bundle config set --local path 'vendor/bundle'

# --- 5. Install the gems ------------------------------------------------------
bundle install

cat <<EOF

Environment ready.

Add the gem bin dir to your PATH permanently by appending this line to your
shell rc file (~/.bashrc or ~/.zshrc):

    export PATH="$GEM_USER_BIN:\$PATH"

Then build/serve the site with:

    bundle exec jekyll serve   # http://localhost:4000

Tip: \`source ./env.sh\` (instead of \`./env.sh\`) keeps the PATH change in your
current shell session.
EOF
