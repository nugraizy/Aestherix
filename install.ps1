function Test-ProgramInstalled($program) {
    $result = Get-Command -Name $program -ErrorAction SilentlyContinue
    return $result -ne $null
}

if (Test-ProgramInstalled "ffmpeg") {
    Write-Host "FFMPEG is already installed."
} else {
    $ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

    $ffmpegDir = "C:\ffmpeg"

    Invoke-WebRequest -Uri $ffmpegUrl -OutFile "ffmpeg.zip"
    Expand-Archive -Path "ffmpeg.zip" -DestinationPath $ffmpegDir
    Remove-Item "ffmpeg.zip"

    $envPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    if ($envPath -notlike "*$ffmpegDir*") {
        $envPath += ";$ffmpegDir\bin"
    }
    [Environment]::SetEnvironmentVariable("Path", $envPath, [System.EnvironmentVariableTarget]::Machine)

    Write-Host "FFMPEG installation and path setup complete. Please restart any open terminal sessions for the changes to take effect."
}

if (Test-ProgramInstalled "cwebp") {
    Write-Host "LIBWEBP is already installed."
} else {
    $libwebpUrl = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-windows-x64.zip"

    $libwebpDir = "C:\libwebp"

    Invoke-WebRequest -Uri $libwebpUrl -OutFile "libwebp.zip"
    Expand-Archive -Path "libwebp.zip" -DestinationPath $libwebpDir
    Remove-Item "libwebp.zip"

    $envPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    if ($envPath -notlike "*$libwebpDir*") {
        $envPath += ";$libwebpDir\bin"
    }
    [Environment]::SetEnvironmentVariable("Path", $envPath, [System.EnvironmentVariableTarget]::Machine)

    Write-Host "LIBWEBP installation and path setup complete. Please restart any open terminal sessions for the changes to take effect."
}
