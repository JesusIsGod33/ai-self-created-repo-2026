$lnkPath = "C:\Users\Admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Brahma Sol.lnk"
$launcherScript = "C:\Users\Admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Brahma Sol Launcher.cmd"
$projectRoot = "/home/Woken/career-orchestrator-stack"

$cmdLines = @(
  "@echo off",
  "setlocal",
  "wsl.exe -- bash -lc 'cd $projectRoot && ./scripts/ensure-ollama.sh && ./scripts/sol-assistant.sh start && ./scripts/sol-assistant.sh heal'",
  'start "" "http://127.0.0.1:4080/"',
  "endlocal"
)
Set-Content -Path $launcherScript -Value ($cmdLines -join "`r`n") -Encoding ASCII

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $launcherScript
$shortcut.WorkingDirectory = "C:\Users\Admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs"
$shortcut.IconLocation = "C:\Windows\System32\imageres.dll,15"
$shortcut.Description = "Brahma Sol Local Self-Healing Workspace Assistant"
$shortcut.Save()

Write-Output "Updated shortcut: $lnkPath -> $launcherScript"
