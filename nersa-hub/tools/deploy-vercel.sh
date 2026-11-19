#!/usr/bin/env bash
# Deploy the prototype to Vercel as a static site.
#   VERCEL_TOKEN   required: a token from vercel.com/account/tokens
#   VERCEL_SCOPE   optional: team slug, when the project lives in a team
#   VERCEL_PROJECT optional: project name (default nersa-ntell → nersa-ntell.vercel.app)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN to a Vercel access token}"
project="${VERCEL_PROJECT:-nersa-ntell}"
scope=(); [ -n "${VERCEL_SCOPE:-}" ] && scope=(--scope "$VERCEL_SCOPE")
npx --yes vercel@latest link --yes --project "$project" --token "$VERCEL_TOKEN" "${scope[@]}"
npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN" "${scope[@]}"
