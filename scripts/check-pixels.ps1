Add-Type -AssemblyName System.Drawing
$b1 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer1.png"))
$b2 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer2.png"))
$b3 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer3.png"))

Write-Output "b1 (0,0): A=$($b1.GetPixel(0,0).A) R=$($b1.GetPixel(0,0).R) G=$($b1.GetPixel(0,0).G) B=$($b1.GetPixel(0,0).B)"
Write-Output "b2 (0,0): A=$($b2.GetPixel(0,0).A) R=$($b2.GetPixel(0,0).R) G=$($b2.GetPixel(0,0).G) B=$($b2.GetPixel(0,0).B)"
Write-Output "b3 (0,0): A=$($b3.GetPixel(0,0).A) R=$($b3.GetPixel(0,0).R) G=$($b3.GetPixel(0,0).G) B=$($b3.GetPixel(0,0).B)"

$b1.Dispose()
$b2.Dispose()
$b3.Dispose()
