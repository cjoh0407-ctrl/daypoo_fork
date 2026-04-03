$sourcePath = "c:\workspace\daypoo\frontend\public\favicon.png"
$targetPath = "c:\workspace\daypoo\frontend\public\icons\icon.svg"

$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePath))

$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <image xlink:href="data:image/png;base64,$base64" x="0" y="0" width="512" height="512" />
</svg>
"@

[IO.File]::WriteAllText($targetPath, $svg)
Write-Host "Self-contained SVG generated successfully"
