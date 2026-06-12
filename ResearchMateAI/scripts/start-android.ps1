$ErrorActionPreference = "Stop"

$sdkPath = $env:ANDROID_HOME
if ([string]::IsNullOrWhiteSpace($sdkPath)) {
  $sdkPath = $env:ANDROID_SDK_ROOT
}
if ([string]::IsNullOrWhiteSpace($sdkPath)) {
  $sdkPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$adbPath = Join-Path $sdkPath "platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
  Write-Error "Android SDK platform tools were not found at $adbPath. Install Android Studio SDK tools or set ANDROID_HOME."
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:PATH = "$(Join-Path $sdkPath "platform-tools");$(Join-Path $sdkPath "emulator");$env:PATH"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "10.0.2.2"

function Test-PortInUse {
  param([int]$Port)

  $pattern = ":$Port\s+.*LISTENING"
  return [bool](netstat -ano | Select-String -Pattern $pattern)
}

$port = 8081
while (Test-PortInUse -Port $port) {
  Write-Host "Port $port is already in use. Trying $($port + 1)..."
  $port += 1
}

& $adbPath start-server | Out-Null

$devices = & $adbPath devices
if ($devices -match "`tdevice") {
  & $adbPath reverse "tcp:$port" "tcp:$port" | Out-Null
  Write-Host "ADB reverse configured for tcp:$port."
} else {
  Write-Host "No running emulator detected yet. Expo will try to open one."
}

Write-Host "Starting Expo Android on exp://10.0.2.2:$port"
npx expo start --android --clear --offline --port $port
