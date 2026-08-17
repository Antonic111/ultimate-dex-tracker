Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$l2Path = Join-Path $baseDir "public\Logo_Layer2.png"
$img2 = [System.Drawing.Bitmap]::FromFile($l2Path)

$iconsDir = Join-Path $baseDir "public\email-icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$themes = @{
    "yellow"   = @{ R = 255; G = 231; B = 106 }
    "orange"   = @{ R = 249; G = 115; B = 22 }
    "lavender" = @{ R = 192; G = 132; B = 252 }
    "blue"     = @{ R = 59;  G = 130; B = 246 }
    "red"      = @{ R = 239; G = 68;  B = 68 }
}

# 1. Generate Themed Pokeball Badges (with top sparkle and subtle ring)
# Pokeball is at (790, 20) in Logo_Layer2.png with size approx 230x230
$pokeballCrop = [System.Drawing.Rectangle]::new(780, 15, 250, 250)

foreach ($themeName in $themes.Keys) {
    $rgb = $themes[$themeName]
    $outPath = Join-Path $iconsDir "pokeball_$themeName.png"

    $size = 64
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Draw Pokéball directly into badge area
    $destRect = [System.Drawing.Rectangle]::new(2, 2, 60, 60)
    $g.DrawImage($img2, $destRect, $pokeballCrop, [System.Drawing.GraphicsUnit]::Pixel)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Generated pokeball_$themeName.png"

    $g.Dispose(); $bmp.Dispose()
}

$img2.Dispose()
