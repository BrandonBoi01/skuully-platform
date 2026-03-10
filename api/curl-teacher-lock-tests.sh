#!/usr/bin/env bash
set -euo pipefail

# ----------------------------
# CONFIG (override via env)
# ----------------------------
BASE_URL="${BASE_URL:-http://localhost:3000}"
SCHOOL_ID="${SCHOOL_ID:-cmlr031cd0001s0ouhaz12u3w}"
PROGRAM_ID="${PROGRAM_ID:-cmltwjdqb0001s0mvx4zwyf77}"
CLASS_ID="${CLASS_ID:-cmltx9yfz0000s0wqw4z9kjj1}"
STUDENT_ID="${STUDENT_ID:-cmlv2kmvo0001s09nln7rvfbx}"

INVITE_CODE="${INVITE_CODE:-135e7f1ac455e24a30848d3f1822eca8}"
TEACHER_EMAIL="${TEACHER_EMAIL:-teacher1@test.com}"
TEACHER_FULLNAME="${TEACHER_FULLNAME:-Teacher One}"
TEACHER_PASSWORD="${TEACHER_PASSWORD:-Pass1234!}"

TEST_DATE="${TEST_DATE:-2026-02-23}"
PERIOD_NAME="${PERIOD_NAME:-TeacherLock-$(date +%s)}"

ENV_OUT="${ENV_OUT:-.teacher.env}"

# ----------------------------
# HELPERS
# ----------------------------
title() {
  echo
  echo "=============================="
  echo "$1"
  echo "=============================="
}

require_token() {
  local name="$1"
  local token="$2"
  if [[ -z "${token}" || "${token}" == "null" ]]; then
    echo "❌ $name is empty/null. Stop."
    exit 1
  fi
  echo "$name length: ${#token}"
}

# ----------------------------
# START
# ----------------------------
echo "BASE_URL=$BASE_URL"
echo "SCHOOL_ID=$SCHOOL_ID"
echo "PROGRAM_ID=$PROGRAM_ID"
echo "CLASS_ID=$CLASS_ID"
echo "STUDENT_ID=$STUDENT_ID"
echo "INVITE_CODE=$INVITE_CODE"
echo "TEACHER_EMAIL=$TEACHER_EMAIL"
echo "TEST_DATE=$TEST_DATE"
echo "PERIOD_NAME=$PERIOD_NAME"

title "0) STATUS"
curl -s "$BASE_URL/status" | jq

# ----------------------------
# 1) Get TEACHER_USER_TOKEN (accept invite OR login)
# ----------------------------
title "1) ACCEPT INVITE (PUBLIC) OR LOGIN"

ACCEPT_RES="$(curl -s -X POST "$BASE_URL/schools/accept-invite" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$INVITE_CODE\",\"fullName\":\"$TEACHER_FULLNAME\",\"password\":\"$TEACHER_PASSWORD\"}")"

# If invite accepted, it returns { token: ... }. If not, might be 403 etc.
ACCEPT_TOKEN="$(echo "$ACCEPT_RES" | jq -r '.token // empty' 2>/dev/null || true)"

if [[ -n "$ACCEPT_TOKEN" ]]; then
  echo "$ACCEPT_RES" | jq
  TEACHER_USER_TOKEN="$ACCEPT_TOKEN"
  echo "✅ Invite accepted → using TEACHER_USER_TOKEN"
else
  # Show the accept response (useful when it’s "Invite not active")
  echo "$ACCEPT_RES" | jq || true
  echo "ℹ️ Invite not usable. Falling back to LOGIN as $TEACHER_EMAIL"

  LOGIN_RES="$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}")"

  echo "$LOGIN_RES" | jq || true
  TEACHER_USER_TOKEN="$(echo "$LOGIN_RES" | jq -r '.token // empty' 2>/dev/null || true)"
fi

require_token "TEACHER_USER_TOKEN" "$TEACHER_USER_TOKEN"

# ----------------------------
# 2) Switch school
# ----------------------------
title "2) SWITCH SCHOOL"
SCHOOL_RES="$(curl -s -X POST "$BASE_URL/schools/switch/$SCHOOL_ID" \
  -H "Authorization: Bearer $TEACHER_USER_TOKEN")"
echo "$SCHOOL_RES" | jq || true
TEACHER_SCHOOL_TOKEN="$(echo "$SCHOOL_RES" | jq -r '.token // empty' 2>/dev/null || true)"
require_token "TEACHER_SCHOOL_TOKEN" "$TEACHER_SCHOOL_TOKEN"

# ----------------------------
# 3) Switch program
# ----------------------------
title "3) SWITCH PROGRAM"
PROG_RES="$(curl -s -X POST "$BASE_URL/programs/switch/$PROGRAM_ID" \
  -H "Authorization: Bearer $TEACHER_SCHOOL_TOKEN")"
echo "$PROG_RES" | jq || true
TEACHER_PROGRAM_TOKEN="$(echo "$PROG_RES" | jq -r '.token // empty' 2>/dev/null || true)"
require_token "TEACHER_PROGRAM_TOKEN" "$TEACHER_PROGRAM_TOKEN"

# ----------------------------
# 4) Write tokens to file
# ----------------------------
title "4) WRITE TOKENS TO FILE (so terminal can reuse them)"
cat > "$ENV_OUT" <<EOF
export BASE_URL='$BASE_URL'
export SCHOOL_ID='$SCHOOL_ID'
export PROGRAM_ID='$PROGRAM_ID'
export CLASS_ID='$CLASS_ID'
export STUDENT_ID='$STUDENT_ID'
export TEST_DATE='$TEST_DATE'

export TEACHER_EMAIL='$TEACHER_EMAIL'
export TEACHER_USER_TOKEN='$TEACHER_USER_TOKEN'
export TEACHER_SCHOOL_TOKEN='$TEACHER_SCHOOL_TOKEN'
export TEACHER_PROGRAM_TOKEN='$TEACHER_PROGRAM_TOKEN'
EOF

echo "✅ Wrote: $ENV_OUT"
echo "Now run: source $ENV_OUT"

# ----------------------------
# 5) Confirm active
# ----------------------------
title "5) PROGRAM ACTIVE (ROLE SHOULD BE TEACHER)"
curl -s "$BASE_URL/programs/active" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" | jq

# ----------------------------
# 6) Create session
# ----------------------------
title "6) CREATE SESSION"
SESSION_RES="$(curl -s -X POST "$BASE_URL/attendance/sessions" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"classId\":\"$CLASS_ID\",\"date\":\"$TEST_DATE\",\"periodName\":\"$PERIOD_NAME\"}")"
echo "$SESSION_RES" | jq || true
SESSION_ID="$(echo "$SESSION_RES" | jq -r '.session.id // empty' 2>/dev/null || true)"
require_token "SESSION_ID" "$SESSION_ID"
echo "SESSION_ID=$SESSION_ID"

# ----------------------------
# 7) Smart event check-in
# ----------------------------
title "7) Smart declare PRESENT via event (CHECK_IN)"
curl -s -X POST "$BASE_URL/attendance/events" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"personType\":\"STUDENT\",\"personId\":\"$STUDENT_ID\",\"eventType\":\"CHECK_IN\",\"source\":\"GATE_SCANNER\",\"occurredAt\":\"${TEST_DATE}T06:45:00.000Z\"}" | jq

# ----------------------------
# 8-10) Mark attempts
# ----------------------------
title "8) Teacher tries to set PRESENT (expect 400 if already PRESENT)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"PRESENT\"}]}" | jq || true

title "9) Teacher correction to ABSENT (should be allowed once)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"ABSENT\"}]}" | jq

title "10) Teacher tries 3rd change to LATE (should be BLOCKED)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"LATE\"}]}" | jq || true

# ----------------------------
# 11) Read daily
# ----------------------------
title "11) Read daily"
curl -s "$BASE_URL/attendance/daily/person/STUDENT/$STUDENT_ID?date=$TEST_DATE" \
  -H "Authorization: Bearer $TEACHER_PROGRAM_TOKEN" | jq

title "DONE ✅"
