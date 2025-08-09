# Exit on any error
$ErrorActionPreference = "Stop"

# Fetch OpenAPI JSON
Write-Host "Fetching OpenAPI schema..."
Invoke-WebRequest -Uri "http://127.0.0.1:8000/openapi.json" -OutFile "openapi.json"

# Check if openapi-typescript is installed
Write-Host "Checking for openapi-typescript..."
$openapiTypescriptPath = (Get-Command openapi-typescript -ErrorAction SilentlyContinue).Source
if (-not $openapiTypescriptPath) {
    Write-Host "openapi-typescript not found, installing globally..."
    npm install -g openapi-typescript
}

# Generate TypeScript types
Write-Host "Generating TypeScript types..."
openapi-typescript openapi.json -o client/src/types/types.ts --enum --root-types

Write-Host "TypeScript types generated in client/src/types/types.ts"
Write-Host "Cleaning up openapi.json..."
del openapi.json


