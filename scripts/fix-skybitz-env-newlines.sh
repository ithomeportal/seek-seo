#!/usr/bin/env bash
#
# Strip the trailing newline from the three SKYBITZ_* vars in Vercel production.
#
# Background: they were stored on 2026-04-02 with a trailing "\n" (echo instead
# of printf). SkyBitz takes credentials as URL query params, so the newline was
# encoded as %0A INTO the credential and the API answered "Invalid login
# credentials" on every call for four months.
#
# This is currently cosmetic — src/lib/skybitz.ts trims every env read, so the
# feed works either way. Cleaning it removes the trap so that trim is no longer
# the only thing standing between us and another outage.
#
# Source of truth is .env.local, whose values were verified byte-identical to
# production once stripped.
#
# Run from anywhere:  bash site/scripts/fix-skybitz-env-newlines.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."   # -> site/, where .vercel/project.json lives

export PATH="$HOME/.npm-global/bin:$PATH"

if [ ! -f .vercel/project.json ]; then
  echo "ERROR: no .vercel/project.json here ($(pwd))." >&2
  echo "That is why 'vercel env add' said the codebase isn't linked." >&2
  exit 1
fi
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found in $(pwd)" >&2
  exit 1
fi

for KEY in SKYBITZ_API_URL SKYBITZ_XML_USERNAME SKYBITZ_XML_PASSWORD; do
  # cut -f2- keeps any '=' inside the value; xargs-free so no quoting surprises.
  VALUE="$(grep -m1 "^${KEY}=" .env.local | cut -d= -f2-)"
  VALUE="${VALUE%$'\r'}"          # strip a stray CR if the file was ever CRLF
  VALUE="$(printf '%s' "$VALUE" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

  # THE GUARD. Writing an empty value here would take GPS down, which is the
  # exact failure mode of running this with an unset shell variable.
  if [ -z "$VALUE" ]; then
    echo "REFUSING: $KEY resolved to an empty value — aborting before write." >&2
    exit 1
  fi

  echo "→ $KEY (${#VALUE} chars, no trailing whitespace)"
  printf '%s' "$VALUE" | vercel env add "$KEY" production --force --yes >/dev/null
done

echo
echo "Written. Vercel snapshots env at BUILD time, so redeploy before verifying:"
echo "    vercel --prod --cwd \"$(pwd)\""
echo
echo "Then confirm the feed end to end (expect updatedUnits: 48):"
echo "    curl -s -X POST https://www.seekequipment.com/api/admin/gps/skybitz"
