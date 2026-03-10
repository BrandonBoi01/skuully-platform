#!/usr/bin/env bash
set -euo pipefail

# ==============================
# Config (edit if needed)
# ==============================
BASE_URL="${BASE_URL:-http://localhost:3000}"
CLASS_ID="${CLASS_ID:-cmltx9yfz0000s0wqw4z9kjj1}"
STUDENT_ID="${STUDENT_ID:-cmlv2kmvo0001s09nln7rvfbx}"

# If PROGRAM_TOKEN is not set, we login + switch school + switch program
EMAIL="${EMAIL:-brandon@test.com}"
PASSWORD="${PASSWORD:-Pass1234!}"
SCHOOL_ID="${SCHOOL_ID:-cmlr031cd0001s0ouhaz12u3w}"
PROGRAM_ID="${PROGRAM_ID:-cmltwqfkp002ls0mvqzgjc6q3}"

line() { echo "=============================="; }
title() { line; echo "$1"; line; }

# ==============================
# 0) Health
# ==============================
title "STATUS"
curl -s "$BASE_URL/status" | jq

# ==============================
# 1) Ensure PROGRAM_TOKEN
# ==============================
PROGRAM_TOKEN_EXISTING="${PROGRAM_TOKEN:-}"
PROGRAM_TOKEN_LEN=0
if [[ -n "$PROGRAM_TOKEN_EXISTING" ]]; then
  PROGRAM_TOKEN_LEN=${#PROGRAM_TOKEN_EXISTING}
fi

if [[ -z "$PROGRAM_TOKEN_EXISTING" || "$PROGRAM_TOKEN_LEN" -lt 20 ]]; then
  title "LOGIN → USER_TOKEN"
  USER_TOKEN="$(curl -s -X POST "$BASE_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')"

  if [[ -z "$USER_TOKEN" || "$USER_TOKEN" == "null" ]]; then
    echo "❌ Failed to login (USER_TOKEN empty)."
    exit 1
  fi
  echo "USER_TOKEN length: ${#USER_TOKEN}"

  title "SWITCH SCHOOL → SCHOOL_TOKEN"
  SCHOOL_TOKEN="$(curl -s -X POST "$BASE_URL/schools/switch/$SCHOOL_ID" \
    -H "Authorization: Bearer $USER_TOKEN" | jq -r '.token')"

  if [[ -z "$SCHOOL_TOKEN" || "$SCHOOL_TOKEN" == "null" ]]; then
    echo "❌ Failed to switch school (SCHOOL_TOKEN empty)."
    exit 1
  fi
  echo "SCHOOL_TOKEN length: ${#SCHOOL_TOKEN}"

  title "SWITCH PROGRAM → PROGRAM_TOKEN"
  PROGRAM_TOKEN="$(curl -s -X POST "$BASE_URL/programs/switch/$PROGRAM_ID" \
    -H "Authorization: Bearer $SCHOOL_TOKEN" | jq -r '.token')"

  if [[ -z "$PROGRAM_TOKEN" || "$PROGRAM_TOKEN" == "null" ]]; then
    echo "❌ Failed to switch program (PROGRAM_TOKEN empty)."
    exit 1
  fi
  echo "PROGRAM_TOKEN length: ${#PROGRAM_TOKEN}"
else
  title "PROGRAM_TOKEN already set"
  PROGRAM_TOKEN="$PROGRAM_TOKEN_EXISTING"
  echo "PROGRAM_TOKEN length: ${#PROGRAM_TOKEN}"
fi

echo "BASE_URL=$BASE_URL"
echo "CLASS_ID=$CLASS_ID"
echo "STUDENT_ID=$STUDENT_ID"

# ==============================
# 2) Pick a test date + unique period name
# (unique constraint: classId+date+periodName)
# ==============================
TEST_DATE="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"))
PY
)"
PERIOD_NAME="Morning-$(date +%s)"

title "TEST DATE + PERIOD"
echo "TEST_DATE=$TEST_DATE"
echo "PERIOD_NAME=$PERIOD_NAME"

# ==============================
# 3) Create session (must succeed)
# ==============================
title "1) Create session (new one)"
CREATE_RESP="$(curl -s -X POST "$BASE_URL/attendance/sessions" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"classId\": \"$CLASS_ID\",
    \"date\": \"$TEST_DATE\",
    \"periodName\": \"$PERIOD_NAME\"
  }")"

echo "$CREATE_RESP" | jq

SESSION_ID="$(echo "$CREATE_RESP" | jq -r '.session.id // empty')"
if [[ -z "$SESSION_ID" ]]; then
  echo "❌ Could not create session (SESSION_ID empty). Response didn’t include .session.id"
  exit 1
fi
echo "SESSION_ID=$SESSION_ID"

# ==============================
# 4) Event CHECK_IN (smart declare)
# ==============================
title "2) Event CHECK_IN (smart declare)"
curl -s -X POST "$BASE_URL/attendance/events" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"personType\":\"STUDENT\",
    \"personId\":\"$STUDENT_ID\",
    \"eventType\":\"CHECK_IN\",
    \"source\":\"GATE_SCANNER\",
    \"occurredAt\":\"${TEST_DATE}T06:45:00.000Z\"
  }" | jq

# ==============================
# 5) Mark session PRESENT
# ==============================
title "3) Mark session PRESENT (expect 400 if already PRESENT by events)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"PRESENT\"}]}" | jq || true

# ==============================
# 6) Mark session ABSENT (correction)
# ==============================
title "4) Mark session ABSENT (correction)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"ABSENT\"}]}" | jq || true

# ==============================
# 7) Mark session LATE (should be blocked for TEACHER; OWNER may pass)
# ==============================
title "5) Mark session LATE (should be blocked for TEACHER; OWNER may pass)"
curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"marks\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"LATE\"}]}" | jq || true

# ==============================
# 8) Read daily attendance
# ==============================
title "6) Read daily attendance"
curl -s "$BASE_URL/attendance/daily/person/STUDENT/$STUDENT_ID?date=$TEST_DATE" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" | jq

title "DONE ✅"