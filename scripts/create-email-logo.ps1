Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$l1Path = Join-Path $baseDir "public\Logo_Layer1.png"
$l2Path = Join-Path $baseDir "public\Logo_Layer2.png"
$l3Path = Join-Path $baseDir "public\Logo_Layer3.png"
$outPath = Join-Path $baseDir "public\Email_Logo.png"

$img1 = [System.Drawing.Bitmap]::FromFile($l1Path)
$img2 = [System.Drawing.Bitmap]::FromFile($l2Path)
$img3 = [System.Drawing.Bitmap]::FromFile($l3Path)

$w = $img1.Width
$h = $img1.Height

# Composite on full canvas
$composite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($composite)
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Layer 1: Base text (White)
$graphics.DrawImage($img1, 0, 0, $w, $h)

# Layer 2: Pokeball
$graphics.DrawImage($img2, 0, 0, $w, $h)

# Layer 3: Tinted ULTIMATE & sparkles (Yellow #ffe76a)
$tintedL3 = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $img3.GetPixel($x, $y)
        if ($p.A -gt 0) {
            $newColor = [System.Drawing.Color]::FromArgb($p.A, 255, 231, 106)
            $tintedL3.SetPixel($x, $y, $newColor)
        }
    }
}
$graphics.DrawImage($tintedL3, 0, 0, $w, $h)

# Find content bounds to crop tightly
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $composite.GetPixel($x, $y)
        if ($p.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$pad = 12
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + ($pad * 2))
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + ($pad * 2))

$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cropG = [System.Drawing.Graphics]::FromImage($cropped)
$cropG.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$cropG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cropG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$srcRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
$destRect = [System.Drawing.Rectangle]::new(0, 0, $cropW, $cropH)
$cropG.DrawImage($composite, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Cropped Email_Logo saved: $($cropW)x$($cropH) to $outPath"

$cropG.Dispose(); $cropped.Dispose(); $graphics.Dispose(); $composite.Dispose()
$tintedL3.Dispose(); $img1.Dispose(); $img2.Dispose(); $img3.Dispose()
