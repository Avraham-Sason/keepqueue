$ErrorActionPreference = "Stop"

$versionFilePath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) "package.json"
if (!(Test-Path $versionFilePath)) { Write-Error "package.json not found at $versionFilePath"; exit 1 }
$versionJson = Get-Content $versionFilePath | ConvertFrom-Json
$version = $versionJson.version
if (-not $version) { Write-Error "version is missing in package.json"; exit 1 }
$imageName = "docker.io/avi12435/keepqueue-server"
docker build -t "${imageName}:${version}" .
docker tag "${imageName}:${version}" "${imageName}:latest"
docker push "${imageName}:${version}"
docker push "${imageName}:latest"