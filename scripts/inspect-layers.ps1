Add-Type -AssemblyName System.Drawing
$b1 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer1.png"))
$b2 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer2.png"))
$b3 = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Logo_Layer3.png"))

# Sample non-transparent pixels in b1
$b1Samples = @()
for ($y=0; $y -lt $b1.Height; $y+=5) {
    for ($x=0; $x -lt $b1.Width; $x+=5) {
        $p = $b1.GetPixel($x, $y)
        if ($p.A -gt 100) {
            $b1Samples += "b1 at ($x,$y): A=$($p.A) R=$($p.R) G=$($p.G) B=$($p.B)"
            if ($b1Samples.Count -ge 5) { break }
        }
    }
    if ($b1Samples.Count -ge 5) { break }
}
$b1Samples | ForEach-Object { Write-Output $_ }

# Sample non-transparent pixels in b3
$b3Samples = @()
for ($y=0; $y -lt $b3.Height; $y+=5) {
    for ($x=0; $x -lt $b3.Width; $x+=5) {
        $p = $b3.GetPixel($x, $y)
        if ($p.A -gt 100) {
            $b3Samples += "b3 at ($x,$y): A=$($p.A) R=$($p.R) G=$($p.G) B=$($p.B)"
            if ($b3Samples.Count -ge 5) { break }
        }
    }
    if ($b3Samples.Count -ge 5) { break }
}
$b3Samples | ForEach-Object { Write-Output $_ }

$b1.Dispose()
$b2.Dispose()
$b3.Dispose()
