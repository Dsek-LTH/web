#!/usr/bin/env bash

set -euo pipefail

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

jq --raw-output 'keys[]' src/translations/en.json >"$tmp/en-keys"
jq --raw-output 'keys[]' src/translations/sv.json >"$tmp/sv-keys"

if cmp --quiet "$tmp/en-keys" "$tmp/sv-keys"; then
    exit 0
fi

only_en_keys="$(comm -23 "$tmp/en-keys" "$tmp/sv-keys")"
only_sv_keys="$(comm -13 "$tmp/en-keys" "$tmp/sv-keys")"

if [[ -n "$only_en_keys" ]]; then
    printf 'The following translation keys are only set in English:\n\n%s\n\n' "$only_en_keys"
fi

if [[ -n "$only_sv_keys" ]]; then
    printf 'The following translation keys are only set in Swedish:\n\n%s\n\n' "$only_sv_keys"
fi

exit 1
