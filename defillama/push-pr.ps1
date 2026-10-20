# PowerShell script to push your branch to your DefiLlama-Adapters fork
param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubUsername = "kellycryptos"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Pushing Syn DAO adapter to your fork..." -ForegroundColor Cyan
Write-Host "GitHub Username: $GitHubUsername" -ForegroundColor Yellow
Write-Host "========================================="

$adapterDir = Join-Path (Get-Location) "..\DefiLlama-Adapters"
if (-not (Test-Path $adapterDir)) {
    $adapterDir = Join-Path (Get-Location) "DefiLlama-Adapters"
}

if (-not (Test-Path $adapterDir)) {
    Write-Error "Could not find DefiLlama-Adapters folder."
    exit 1
}

Push-Location $adapterDir
try {
    $forkUrl = "https://github.com/$GitHubUsername/DefiLlama-Adapters.git"
    git remote remove myfork 2>$null
    git remote add myfork $forkUrl
    Write-Host "Configured remote 'myfork' -> $forkUrl" -ForegroundColor Green
    
    Write-Host "Pushing 'add-syndao' branch..." -ForegroundColor Cyan
    git push myfork add-syndao -u

    Write-Host "`nBranch pushed successfully!" -ForegroundColor Green
    Write-Host "Now visit: https://github.com/DefiLlama/DefiLlama-Adapters/compare/main...$GitHubUsername:DefiLlama-Adapters:add-syndao" -ForegroundColor Magenta
    Write-Host "Paste the contents of defillama/PULL_REQUEST.md into the PR description!" -ForegroundColor Green
} finally {
    Pop-Location
}
