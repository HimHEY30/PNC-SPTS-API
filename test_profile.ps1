# Test script for PNC SPTS API
# Registers a demo user (if not existing), logs in, and fetches the user profile

# Register a demo user (ignore errors if already exists)
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/register `
    -Headers @{ 'Content-Type' = 'application/json' } `
    -Body '{"email":"demo@example.com","password":"Password123"}'
} catch { }

# Login and capture JWT
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login `
    -Headers @{ 'Content-Type' = 'application/json' } `
    -Body '{"email":"demo@example.com","password":"Password123"}'
$token = $login.access_token
Write-Host "Token: $token"

# Call the protected profile endpoint
$profile = Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/user/profile `
    -Headers @{ Authorization = "Bearer $token" }
Write-Host "Profile response:"
$profile | ConvertTo-Json -Depth 5
