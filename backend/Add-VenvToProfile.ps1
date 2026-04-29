# Healynx - Add auto-venv activation to PowerShell profile
# Called automatically by setup.ps1 - no need to run this directly.
#
# What it adds to $PROFILE:
#   - Overrides 'cd' so venv activates whenever you enter a folder
#     that contains backend\.venv (works for ANY path, ANY teammate)
#   - Checks on shell startup too

$profilePath = "$env:USERPROFILE\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

# The snippet uses Get-Location at runtime, so no paths are hardcoded
$lines = @(
    "",
    "# ===========================================================",
    "# Auto-activate Python venv when entering a project folder",
    "# that contains backend\.venv  (added by Healynx setup.ps1)",
    "# ===========================================================",
    "function global:Set-LocationWithVenv {",
    "    param([string]`$Path)",
    "    if (`$Path) { Set-Location `$Path }",
    "    `$venv = Join-Path (Get-Location) 'backend\.venv\Scripts\Activate.ps1'",
    "    if (Test-Path `$venv) {",
    "        & `$venv",
    "        Write-Host ('  [venv] ' + (Split-Path (Get-Location) -Leaf)) -ForegroundColor DarkCyan",
    "    }",
    "}",
    "Set-Alias -Name cd -Value Set-LocationWithVenv -Option AllScope -Force",
    "",
    "# Also check on shell startup (catches opening terminal directly in folder)",
    "`$_startVenv = Join-Path (Get-Location) 'backend\.venv\Scripts\Activate.ps1'",
    "if (Test-Path `$_startVenv) {",
    "    & `$_startVenv",
    "    Write-Host ('  [venv] ' + (Split-Path (Get-Location) -Leaf)) -ForegroundColor DarkCyan",
    "}",
    "# ==========================================================="
)

# Ensure profile directory exists
$profileDir = Split-Path $profilePath
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Guard: skip if already added
if (Test-Path $profilePath) {
    $existing = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
    if ($existing -and $existing.Contains("Auto-activate Python venv")) {
        Write-Host "  Profile already configured — skipping." -ForegroundColor DarkYellow
        return
    }
}

# Append
foreach ($line in $lines) {
    Add-Content -Path $profilePath -Value $line
}

Write-Host "  Profile updated: $profilePath" -ForegroundColor DarkCyan
