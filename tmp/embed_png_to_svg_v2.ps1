$sourcePath = "c:\workspace\daypoo\frontend\public\favicon.png"
$targetPath = "c:\workspace\daypoo\frontend\public\icons\icon.svg"

$bytes = [IO.File]::ReadAllBytes($sourcePath)
$base64 = [Convert]::ToBase64String($bytes)

# JPG 헤더(FF D8) 확인 후 MIME 타입 결정
$mimeType = "image/png"
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) {
    $mimeType = "image/jpeg"
}

$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <image xlink:href="data:$mimeType;base64,$base64" x="0" y="0" width="512" height="512" />
</svg>
"@

[IO.File]::WriteAllText($targetPath, $svg)
Write-Host "Self-contained SVG generated successfully with MIME type: $mimeType"
