param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$OPENCV_TAG = "4.10.0"
$EMSDK_VERSION = "3.1.64"
$PYTHON_VERSION = "3.12.10"
$PYTHON_SHA256 = "4acbed6dd1c744b0376e3b1cf57ce906f9dc9e95e68824584c8099a63025a3c3"
$CMAKE_VERSION = "3.31.6"
$NINJA_VERSION = "1.12.1"

$CACHE = "C:\Users\Public\AJNPDF_SCAN_BUILD_CACHE"
$OPENCV = Join-Path $CACHE "opencv"
$EMSDK = Join-Path $CACHE "emsdk"
$BUILD = Join-Path $CACHE "opencv-build"
$DEST = Join-Path $ProjectRoot "public\ajn-scan\opencv-4.10.0"
$CONFIG = Join-Path $ProjectRoot "public\ajn-scan\opencv_minimal.config.py"

function Download-VerifiedFile {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Destination,
    [string]$Sha256 = ""
  )

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
  $temp = "$Destination.download"
  Remove-Item $temp -Force -ErrorAction SilentlyContinue

  Write-Host "Downloading: $Url" -ForegroundColor DarkCyan
  if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    & curl.exe -fL --retry 4 --retry-delay 2 --connect-timeout 30 -o $temp $Url
    if ($LASTEXITCODE -ne 0) { throw "Download failed: $Url" }
  } else {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $Url -OutFile $temp -UseBasicParsing
  }

  if (!(Test-Path $temp) -or (Get-Item $temp).Length -lt 1024) {
    throw "Downloaded file is missing or unexpectedly small: $Url"
  }

  if ($Sha256) {
    $actual = (Get-FileHash $temp -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $Sha256.ToLowerInvariant()) {
      Remove-Item $temp -Force -ErrorAction SilentlyContinue
      throw "SHA-256 verification failed for $Url. Expected $Sha256, got $actual"
    }
  }

  Move-Item $temp $Destination -Force
}

function Ensure-Python312 {
  $pythonDir = Join-Path $CACHE "python-$PYTHON_VERSION-embed-amd64"
  $pythonExe = Join-Path $pythonDir "python.exe"
  if (!(Test-Path $pythonExe)) {
    $zip = Join-Path $CACHE "python-$PYTHON_VERSION-embed-amd64.zip"
    if (!(Test-Path $zip) -or ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $PYTHON_SHA256)) {
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      Download-VerifiedFile `
        -Url "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-embed-amd64.zip" `
        -Destination $zip `
        -Sha256 $PYTHON_SHA256
    }
    Remove-Item $pythonDir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $pythonDir | Out-Null
    Expand-Archive -Path $zip -DestinationPath $pythonDir -Force
  }

  $version = (& $pythonExe -c "import sys; print('.'.join(map(str, sys.version_info[:3])))").Trim()
  if ($LASTEXITCODE -ne 0) { throw "Pinned Python runtime could not start." }
  $parts = $version.Split(".")
  if ([int]$parts[0] -lt 3 -or ([int]$parts[0] -eq 3 -and [int]$parts[1] -lt 10)) {
    throw "Pinned Python must be 3.10+. Found $version"
  }

  $env:PATH = "$pythonDir;$env:PATH"
  Write-Host "PASS: Python $version selected for Emscripten/OpenCV" -ForegroundColor Green
  return $pythonExe
}

function Ensure-CMake {
  $existing = Get-Command cmake.exe -ErrorAction SilentlyContinue
  if ($existing) {
    try {
      $line = (& $existing.Source --version | Select-Object -First 1)
      Write-Host "PASS: using existing $line" -ForegroundColor Green
      return $existing.Source
    } catch {}
  }

  $cmakeRoot = Join-Path $CACHE "cmake-$CMAKE_VERSION-windows-x86_64"
  $cmakeExe = Join-Path $cmakeRoot "bin\cmake.exe"
  if (!(Test-Path $cmakeExe)) {
    $zip = Join-Path $CACHE "cmake-$CMAKE_VERSION-windows-x86_64.zip"
    if (!(Test-Path $zip)) {
      Download-VerifiedFile `
        -Url "https://github.com/Kitware/CMake/releases/download/v$CMAKE_VERSION/cmake-$CMAKE_VERSION-windows-x86_64.zip" `
        -Destination $zip
    }
    Remove-Item $cmakeRoot -Recurse -Force -ErrorAction SilentlyContinue
    Expand-Archive -Path $zip -DestinationPath $CACHE -Force
  }
  if (!(Test-Path $cmakeExe)) { throw "Portable CMake provisioning failed: $cmakeExe" }
  $env:PATH = "$(Split-Path -Parent $cmakeExe);$env:PATH"
  $line = (& $cmakeExe --version | Select-Object -First 1)
  Write-Host "PASS: provisioned $line" -ForegroundColor Green
  return $cmakeExe
}

function Ensure-Ninja {
  $existing = Get-Command ninja.exe -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "PASS: using existing Ninja $(& $existing.Source --version)" -ForegroundColor Green
    return $existing.Source
  }

  $ninjaRoot = Join-Path $CACHE "ninja-$NINJA_VERSION"
  $ninjaExe = Join-Path $ninjaRoot "ninja.exe"
  if (!(Test-Path $ninjaExe)) {
    $zip = Join-Path $CACHE "ninja-win-$NINJA_VERSION.zip"
    if (!(Test-Path $zip)) {
      Download-VerifiedFile `
        -Url "https://github.com/ninja-build/ninja/releases/download/v$NINJA_VERSION/ninja-win.zip" `
        -Destination $zip
    }
    Remove-Item $ninjaRoot -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $ninjaRoot | Out-Null
    Expand-Archive -Path $zip -DestinationPath $ninjaRoot -Force
  }
  if (!(Test-Path $ninjaExe)) { throw "Portable Ninja provisioning failed: $ninjaExe" }
  $env:PATH = "$ninjaRoot;$env:PATH"
  Write-Host "PASS: provisioned Ninja $(& $ninjaExe --version)" -ForegroundColor Green
  return $ninjaExe
}

function Import-EmsdkEnvironment {
  param([Parameter(Mandatory=$true)][string]$EmsdkRoot)

  $envScript = Join-Path $EmsdkRoot "emsdk_env.bat"
  if (!(Test-Path $envScript)) { throw "emsdk_env.bat not found: $envScript" }

  # A .bat file cannot mutate its parent PowerShell process directly.
  # Capture its resulting environment and import it line by line.
  $cmdLine = 'call "' + $envScript + '" >nul && set'
  $lines = & $env:ComSpec /d /s /c $cmdLine
  if ($LASTEXITCODE -ne 0) { throw "emsdk_env.bat failed to produce an environment." }

  foreach ($line in $lines) {
    if ($line -notmatch '^([^=]+)=(.*)$') { continue }
    $name = $Matches[1]
    $value = $Matches[2]
    if ($name.StartsWith("=")) { continue }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }

  $emscriptenDir = Join-Path $EmsdkRoot "upstream\emscripten"
  $env:EMSDK = $EmsdkRoot
  $env:EMSCRIPTEN = $emscriptenDir

  # Make emcc.py's "tools" package resolvable even if CMake launches emcc.bat
  # from a directory outside the Emscripten tree.
  if ($env:PYTHONPATH) {
    $env:PYTHONPATH = "$emscriptenDir;$env:PYTHONPATH"
  } else {
    $env:PYTHONPATH = $emscriptenDir
  }

  if (!$env:EMSDK_NODE -or !(Test-Path $env:EMSDK_NODE)) {
    throw "EMSDK_NODE was not imported correctly."
  }
  if (!$env:EMSDK_PYTHON -or !(Test-Path $env:EMSDK_PYTHON)) {
    throw "EMSDK_PYTHON was not imported correctly."
  }

  Write-Host "PASS: emsdk_env.bat imported into current PowerShell process" -ForegroundColor Green
  Write-Host "EMSDK        : $env:EMSDK"
  Write-Host "EMSDK_NODE   : $env:EMSDK_NODE"
  Write-Host "EMSDK_PYTHON : $env:EMSDK_PYTHON"
  Write-Host "EMSCRIPTEN   : $env:EMSCRIPTEN"
}

Write-Host "AJN PDF :: building minimal same-origin OpenCV.js" -ForegroundColor Cyan
Write-Host "This build is self-contained and ignores the machine's old Python 3.8." -ForegroundColor DarkGray

if (!(Get-Command git.exe -ErrorAction SilentlyContinue)) { throw "Git is required to build the scanner runtime." }

New-Item -ItemType Directory -Force -Path $CACHE,$DEST | Out-Null

function Test-CspSafeRuntimeMetadata {
  param([string]$RuntimeJsonPath)
  if (!(Test-Path $RuntimeJsonPath)) { return $false }
  try {
    $meta = Get-Content $RuntimeJsonPath -Raw | ConvertFrom-Json
    return ($meta.dynamicExecution -eq 0 -and $meta.cspUnsafeEvalRequired -eq $false)
  } catch {
    return $false
  }
}

# Fast resume path: V5 may already have built the final OpenCV runtime before a later
# source-verification failure. Validate and reuse it before touching Python/Emscripten.
$existingJsEarly = Join-Path $DEST "opencv.js"
$existingWasmEarly = Join-Path $DEST "opencv_js.wasm"
if ((Test-Path $existingJsEarly) -and (Test-Path $existingWasmEarly)) {
  $existingJsTextEarly = Get-Content $existingJsEarly -Raw
  $wasmBytesEarly = [IO.File]::ReadAllBytes($existingWasmEarly)
  $wasmMagicOk = $wasmBytesEarly.Length -gt 4 -and
                 $wasmBytesEarly[0] -eq 0 -and
                 $wasmBytesEarly[1] -eq 97 -and
                 $wasmBytesEarly[2] -eq 115 -and
                 $wasmBytesEarly[3] -eq 109

  $runtimeJsonEarly = Join-Path $DEST "runtime.json"
  $cspSafeEarly = Test-CspSafeRuntimeMetadata $runtimeJsonEarly

  if ($existingJsTextEarly -notmatch "data:application/wasm;base64" -and
      (Get-Item $existingJsEarly).Length -gt 100000 -and
      (Get-Item $existingWasmEarly).Length -gt 100000 -and
      $wasmMagicOk -and
      $cspSafeEarly) {
    $runtime = [ordered]@{
      runtime = "AJN PDF Scan to PDF OpenCV"
      opencv = $OPENCV_TAG
      emsdk = $EMSDK_VERSION
      modules = @("core","imgproc")
      buildBindings = "js"
      singleFile = $false
      sameOrigin = $true
      resumed = $true
      jsBytes = (Get-Item $existingJsEarly).Length
      wasmBytes = (Get-Item $existingWasmEarly).Length
      jsSha256 = (Get-FileHash $existingJsEarly -Algorithm SHA256).Hash.ToLowerInvariant()
      wasmSha256 = (Get-FileHash $existingWasmEarly -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $runtime | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $DEST "runtime.json") -Encoding UTF8
    Write-Host "PASS: completed OpenCV.js/WASM runtime already exists" -ForegroundColor Green
    Write-Host "PASS: WASM magic/header verified" -ForegroundColor Green
    Write-Host "PASS: native scanner build skipped on resume" -ForegroundColor Green
    return
  }
}

$PYTHON_EXE = Ensure-Python312
$CMAKE_EXE = Ensure-CMake
$NINJA_EXE = Ensure-Ninja
$env:CMAKE_GENERATOR = "Ninja"

if (!(Test-Path (Join-Path $OPENCV ".git"))) {
  git clone --depth 1 --branch $OPENCV_TAG https://github.com/opencv/opencv.git $OPENCV
  if ($LASTEXITCODE -ne 0) { throw "OpenCV source download failed." }
} else {
  Write-Host "PASS: reusing cached OpenCV source" -ForegroundColor Green
}

if (!(Test-Path (Join-Path $EMSDK ".git"))) {
  git clone --depth 1 https://github.com/emscripten-core/emsdk.git $EMSDK
  if ($LASTEXITCODE -ne 0) { throw "Emscripten SDK download failed." }
} else {
  Write-Host "PASS: reusing cached Emscripten source" -ForegroundColor Green
}

# Force emsdk.bat and all child Python invocations to use our pinned Python.
$pythonDir = Split-Path -Parent $PYTHON_EXE
$env:PATH = "$pythonDir;$env:PATH"

Push-Location $EMSDK
try {
  Write-Host "Installing Emscripten $EMSDK_VERSION with Python $(& $PYTHON_EXE --version 2>&1)..." -ForegroundColor Cyan
  & ".\emsdk.bat" install $EMSDK_VERSION
  if ($LASTEXITCODE -ne 0) { throw "Emscripten install failed." }
  & ".\emsdk.bat" activate $EMSDK_VERSION
  if ($LASTEXITCODE -ne 0) { throw "Emscripten activation failed." }
} finally {
  Pop-Location
}

# "emsdk activate" ran in a child cmd.exe process. Import the environment it
# generates into this PowerShell process before running OpenCV's build script.
Import-EmsdkEnvironment -EmsdkRoot $EMSDK

$EMSCRIPTEN_DIR = Join-Path $EMSDK "upstream\emscripten"
if (!(Test-Path $EMSCRIPTEN_DIR)) { throw "Emscripten directory not found: $EMSCRIPTEN_DIR" }

$EMCC_BAT = Join-Path $EMSCRIPTEN_DIR "emcc.bat"
if (!(Test-Path $EMCC_BAT)) { throw "emcc.bat not found: $EMCC_BAT" }

Push-Location $EMSCRIPTEN_DIR
try {
  & $EMCC_BAT -v
  if ($LASTEXITCODE -ne 0) { throw "Emscripten compiler preflight failed." }
} finally {
  Pop-Location
}
Write-Host "PASS: Emscripten compiler preflight" -ForegroundColor Green

$env:CMAKE_GENERATOR = "Ninja"
$env:CMAKE_MAKE_PROGRAM = $NINJA_EXE

if (Test-Path (Join-Path $BUILD "CMakeCache.txt")) {
  Write-Host "PASS: interrupted OpenCV configure cache found; resuming instead of restarting" -ForegroundColor Green
} elseif (Test-Path $BUILD) {
  # No usable CMake cache exists, so only then clear the partial directory.
  Remove-Item $BUILD -Recurse -Force
}

$existingJs = Join-Path $DEST "opencv.js"
$existingWasm = Join-Path $DEST "opencv_js.wasm"
if ((Test-Path $existingJs) -and (Test-Path $existingWasm)) {
  $existingJsText = Get-Content $existingJs -Raw
  $runtimeJson = Join-Path $DEST "runtime.json"
  $cspSafe = Test-CspSafeRuntimeMetadata $runtimeJson

  if ($existingJsText -notmatch "data:application/wasm;base64" -and
      (Get-Item $existingJs).Length -gt 100000 -and
      (Get-Item $existingWasm).Length -gt 100000 -and
      $cspSafe) {
    Write-Host "PASS: completed OpenCV runtime already exists; build step can be skipped" -ForegroundColor Green
    $runtime = [ordered]@{
      runtime = "AJN PDF Scan to PDF OpenCV"
      opencv = $OPENCV_TAG
      emsdk = $EMSDK_VERSION
      modules = @("core","imgproc")
  buildBindings = "js"
      singleFile = $false
      sameOrigin = $true
      jsBytes = (Get-Item $existingJs).Length
      wasmBytes = (Get-Item $existingWasm).Length
      jsSha256 = (Get-FileHash $existingJs -Algorithm SHA256).Hash.ToLowerInvariant()
      wasmSha256 = (Get-FileHash $existingWasm -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $runtime | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $DEST "runtime.json") -Encoding UTF8
    Write-Host "PASS: existing same-origin OpenCV.js/WASM runtime verified" -ForegroundColor Green
    return
  }
}

$BUILD_JS = Join-Path $OPENCV "platforms\js\build_js.py"
if (!(Test-Path $BUILD_JS)) { throw "OpenCV build_js.py not found: $BUILD_JS" }

$pyArgs = @(
  $BUILD_JS,
  $BUILD,
  "--opencv_dir", $OPENCV,
  "--emscripten_dir", $EMSCRIPTEN_DIR,
  "--build_wasm",
  "--disable_single_file",
  "--config", $CONFIG,
  "--cmake_option=-DBUILD_LIST=core,imgproc,js",
  "--cmake_option=-DBUILD_TESTS=OFF",
  "--cmake_option=-DBUILD_PERF_TESTS=OFF",
  "--cmake_option=-DBUILD_DOCS=OFF",
  "--cmake_option=-DBUILD_EXAMPLES=OFF"
)

$BUILD_PYTHON = $env:EMSDK_PYTHON
if (!$BUILD_PYTHON -or !(Test-Path $BUILD_PYTHON)) { throw "Activated emsdk Python is unavailable." }

# Remove generator ambiguity on Windows by passing Ninja's exact path to CMake.
$pyArgs += "--cmake_option=-DCMAKE_MAKE_PROGRAM=$NINJA_EXE"
$pyArgs += "--cmake_option=-DCMAKE_EXE_LINKER_FLAGS=-sDYNAMIC_EXECUTION=0"

# OpenCV 4.10 platform/js/build_js.py still invokes the Unix command `make`
# for its build phase, even when CMake generated Ninja files on Windows.
# Use build_js.py only for configuration, then invoke the generated build
# through CMake so the configured Ninja generator is honored.
if ($pyArgs -notcontains "--config_only") {
  $pyArgs += "--config_only"
}

Write-Host "Configuring CSP-safe minimal OpenCV.js/WASM (DYNAMIC_EXECUTION=0)..." -ForegroundColor Cyan
Write-Host "Build Python : $BUILD_PYTHON"
Write-Host "CMake        : $CMAKE_EXE"
Write-Host "Ninja        : $NINJA_EXE"
Write-Host "Build list   : core,imgproc,js"
& $BUILD_PYTHON @pyArgs
if ($LASTEXITCODE -ne 0) { throw "OpenCV.js configuration failed." }

$buildNinja = Join-Path $BUILD "build.ninja"
if (!(Test-Path $buildNinja)) {
  throw "Ninja build file was not generated: $buildNinja"
}

$targets = & $NINJA_EXE -C $BUILD -t targets all 2>&1
if ($LASTEXITCODE -ne 0) { throw "Could not enumerate Ninja targets." }
if (($targets -join "`n") -notmatch "(^|\s)opencv\.js:") {
  Write-Host ($targets | Select-String -Pattern "opencv|js" | Select-Object -First 30) -ForegroundColor Yellow
  throw "OpenCV.js target is missing. The JS binding module was not configured."
}

$jobs = [Math]::Max(2, [Math]::Min(16, [Environment]::ProcessorCount))
Write-Host "PASS: opencv.js Ninja target exists" -ForegroundColor Green
Write-Host "Compiling OpenCV.js/WASM with Ninja ($jobs parallel jobs)..." -ForegroundColor Cyan

& $CMAKE_EXE --build $BUILD --target opencv.js --config Release --parallel $jobs
if ($LASTEXITCODE -ne 0) {
  throw "OpenCV.js Ninja build failed."
}

$js = Get-ChildItem -Path $BUILD -Recurse -File -Filter "opencv.js" | Select-Object -First 1
$wasm = Get-ChildItem -Path $BUILD -Recurse -File -Filter "*.wasm" |
  Where-Object { $_.Name -match "opencv|opencv_js" } |
  Select-Object -First 1

if (!$js) { throw "Built opencv.js was not found." }
if (!$wasm) { throw "Built OpenCV WASM file was not found." }

Copy-Item $js.FullName (Join-Path $DEST "opencv.js") -Force
Copy-Item $wasm.FullName (Join-Path $DEST "opencv_js.wasm") -Force
if (Test-Path (Join-Path $OPENCV "LICENSE")) {
  Copy-Item (Join-Path $OPENCV "LICENSE") (Join-Path $DEST "LICENSE-OpenCV.txt") -Force
}

$jsText = Get-Content (Join-Path $DEST "opencv.js") -Raw
if ($jsText -match "data:application/wasm;base64") {
  throw "OpenCV build unexpectedly inlined WASM. --disable_single_file did not take effect."
}

$runtime = [ordered]@{
  runtime = "AJN PDF Scan to PDF OpenCV"
  opencv = $OPENCV_TAG
  emsdk = $EMSDK_VERSION
  pythonBootstrap = $PYTHON_VERSION
  pythonBuild = (& $BUILD_PYTHON -c "import sys; print('.'.join(map(str, sys.version_info[:3])))").Trim()
  cmake = $CMAKE_VERSION
  ninja = $NINJA_VERSION
  modules = @("core","imgproc")
  buildBindings = "js"
  singleFile = $false
  sameOrigin = $true
  dynamicExecution = 0
  cspUnsafeEvalRequired = $false
  jsBytes = (Get-Item (Join-Path $DEST "opencv.js")).Length
  wasmBytes = (Get-Item (Join-Path $DEST "opencv_js.wasm")).Length
  jsSha256 = (Get-FileHash (Join-Path $DEST "opencv.js") -Algorithm SHA256).Hash.ToLowerInvariant()
  wasmSha256 = (Get-FileHash (Join-Path $DEST "opencv_js.wasm") -Algorithm SHA256).Hash.ToLowerInvariant()
}
$runtime | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $DEST "runtime.json") -Encoding UTF8

Write-Host "PASS: CSP-safe minimal OpenCV.js runtime built" -ForegroundColor Green
Write-Host "Python: $PYTHON_VERSION"
Write-Host "JS    : $($runtime.jsBytes) bytes"
Write-Host "WASM  : $($runtime.wasmBytes) bytes"
