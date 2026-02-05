#!/usr/bin/env sh
# TalentX Backend API – curl examples
# Ensure backend is running: cd TalentX-Backend && npm start
# Default base URL: http://localhost:3000

BASE="${VITE_API_BASE_URL:-http://localhost:3000}"

echo "=== 1. Health check ==="
curl -s -w "\nHTTP %{http_code}\n" "${BASE}/health"
echo ""

echo "=== 2. List jobs (GET /jobs) – used by home page ==="
curl -s -w "\nHTTP %{http_code}\n" "${BASE}/jobs"
echo ""

echo "=== 3. Get one job (replace JOB_ID with an actual _id from step 2) ==="
echo "curl -s -w \"\\nHTTP %{http_code}\\n\" \"${BASE}/jobs/JOB_ID\""
echo ""
