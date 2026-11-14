param(
  [string]$Url = "http://localhost:8150/?demo=fight",
  [string]$Out = "C:\Users\HP\fightkaro\shots\shot.png",
  [string]$Size = "1440,900",
  [int]$Wait = 14000
)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tmp = Join-Path $env:TEMP ("chrome-prof-" + [guid]::NewGuid().ToString('N'))
$args = @(
  "--headless=new",
  "--disable-gpu-sandbox",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--force-device-scale-factor=1",
  "--window-size=$Size",
  "--user-data-dir=$tmp",
  "--virtual-time-budget=$Wait",
  "--screenshot=$Out",
  $Url
)
& $chrome @args 2>$null | Out-Null
Start-Sleep -Milliseconds 600
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
if (Test-Path $Out) {
  $len = (Get-Item $Out).Length
  "OK $Out  ($([math]::round($len/1KB,1)) KB)"
} else {
  "FAIL no screenshot"
}
