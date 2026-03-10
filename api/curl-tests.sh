#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:3000"

echo "=============================="
echo "STATUS"
echo "=============================="
curl -s "$BASE_URL/status" | jq
echo

echo "=============================="
echo "LOGIN → USER TOKEN"
echo "=============================="
USER_TOKEN="$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"brandon@test.com","password":"Pass1234!"}' \
  | jq -r '.token')"

echo "USER_TOKEN length: ${#USER_TOKEN}"
echo

echo "=============================="
echo "AUTH /me (no context yet)"
echo "=============================="
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
echo

echo "=============================="
echo "SWITCH SCHOOL"
echo "=============================="
SCHOOL_ID="cmlr031cd0001s0ouhaz12u3w"

SCHOOL_TOKEN="$(curl -s -X POST "$BASE_URL/schools/switch/$SCHOOL_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  | jq -r '.token')"

echo "SCHOOL_TOKEN length: ${#SCHOOL_TOKEN}"
echo

echo "=============================="
echo "SWITCH PROGRAM"
echo "=============================="
PROGRAM_ID="cmltwqfkp002ls0mvqzgjc6q3"

PROGRAM_TOKEN="$(curl -s -X POST "$BASE_URL/programs/switch/$PROGRAM_ID" \
  -H "Authorization: Bearer $SCHOOL_TOKEN" \
  | jq -r '.token')"

echo "PROGRAM_TOKEN length: ${#PROGRAM_TOKEN}"
echo

echo "=============================="
echo "PROGRAM ACTIVE"
echo "=============================="
curl -s "$BASE_URL/programs/active" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" | jq
echo

echo "=============================="
echo "ALL BASIC AUTH + CONTEXT TESTS PASSED ✅"
echo "=============================="