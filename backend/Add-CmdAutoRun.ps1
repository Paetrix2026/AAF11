# Healynx - Add venv auto-activation for CMD (cmd.exe)
# Called automatically by setup.ps1 - no need to run directly.

$autorunBat = Join-Path $env:USERPROFILE 'cmd_venv_autorun.bat'
$regKey     = 'HKCU:\Software\Microsoft\Command Processor'
$regValue   = 'AutoRun'

# Write the autorun bat file
$batLines = @(
    '@echo off',
    ':: Auto-activate Python venv if current folder has backend\.venv',
    ':: Added by Healynx setup.ps1 - works for any project path',
    'if exist "%CD%\backend\.venv\Scripts\activate.bat" (',
    '    call "%CD%\backend\.venv\Scripts\activate.bat"',
    '    echo   [venv] %CD%',
    ')'
)
Set-Content -Path $autorunBat -Value ($batLines -join "`r`n") -Encoding ASCII

# Check registry
$existing = (Get-ItemProperty -Path $regKey -Name $regValue -ErrorAction SilentlyContinue).$regValue

if ($existing -and ($existing -like '*cmd_venv_autorun*')) {
    Write-Host '  CMD AutoRun already configured - skipping.' -ForegroundColor DarkYellow
    return
}

# Build registry value using [char]34 for double-quote
$dq = [char]34
$quoted = $dq + $autorunBat + $dq

if ($existing) {
    $newValue = $existing + ' & ' + $quoted
} else {
    $newValue = $quoted
}

if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force | Out-Null
}
Set-ItemProperty -Path $regKey -Name $regValue -Value $newValue
Write-Host ('  CMD AutoRun registered: ' + $autorunBat) -ForegroundColor DarkCyan
