Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile((Join-Path (Split-Path -Parent $PSScriptRoot) "public\Email_Logo.png"))

$minX = $b.Width; $minY = $b.Height; $maxX = 0; $maxY = 0

for ($y = 0; $y -lt $b.Height; $y++) {
    for ($x = 0; $x -lt $b.Width; $x++) {
        $p = $b.GetPixel($x, $y)
        if ($p.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Image Size: $($b.Width)x$($b.Height)"
Write-Output "Bounding Box: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY"
Write-Output "Content Size: $( $maxX - $minX + 1 )x$( $maxY - $minY + 1 )"

$b.Dispose()
