Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$l1Path = Join-Path $baseDir "public\Logo_Layer1.png"
$l2Path = Join-Path $baseDir "public\Logo_Layer2.png"
$l3Path = Join-Path $baseDir "public\Logo_Layer3.png"

$img1 = [System.Drawing.Bitmap]::FromFile($l1Path)
$img2 = [System.Drawing.Bitmap]::FromFile($l2Path)
$img3 = [System.Drawing.Bitmap]::FromFile($l3Path)

$w = $img1.Width
$h = $img1.Height

$themes = @{
    "yellow"   = @{ R = 255; G = 231; B = 106 }
    "orange"   = @{ R = 249; G = 115; B = 22 }
    "lavender" = @{ R = 192; G = 132; B = 252 }
    "blue"     = @{ R = 59;  G = 130; B = 246 }
    "red"      = @{ R = 239; G = 68;  B = 68 }
}

$iconsDir = Join-Path $baseDir "public\email-icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

function Create-Themed-Icon($filename, $r, $g, $b, [scriptblock]$drawAction) {
    # 48x48 icon for ultra-compact 2KB base64
    $bmp = New-Object System.Drawing.Bitmap(48, 48, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    & $drawAction $graphics $r $g $b
    
    $filePath = Join-Path $iconsDir $filename
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
}

# 1. Generate Compact Optimized Retina Themed Logos (460px width, ~6KB)
foreach ($themeName in $themes.Keys) {
    $rgb = $themes[$themeName]
    $outPath = Join-Path $baseDir "public\Email_Logo_$themeName.png"

    $composite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($composite)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $graphics.DrawImage($img1, 0, 0, $w, $h)
    $graphics.DrawImage($img2, 0, 0, $w, $h)

    $tintedL3 = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $img3.GetPixel($x, $y)
            if ($p.A -gt 0) {
                $newColor = [System.Drawing.Color]::FromArgb($p.A, $rgb.R, $rgb.G, $rgb.B)
                $tintedL3.SetPixel($x, $y, $newColor)
            }
        }
    }
    $graphics.DrawImage($tintedL3, 0, 0, $w, $h)

    # Crop bounds
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

    $pad = 10
    $cropX = [Math]::Max(0, $minX - $pad)
    $cropY = [Math]::Max(0, $minY - $pad)
    $cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + ($pad * 2))
    $cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + ($pad * 2))

    # Resize to exact crisp 460px width for email
    $targetW = 460
    $targetH = [int][Math]::Round($cropH * ($targetW / $cropW))

    $resized = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $resG = [System.Drawing.Graphics]::FromImage($resized)
    $resG.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $resG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $resG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $srcRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
    $destRect = [System.Drawing.Rectangle]::new(0, 0, $targetW, $targetH)
    $resG.DrawImage($composite, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Generated compact Email_Logo_$themeName.png ($targetWx$targetH)"

    $resG.Dispose(); $resized.Dispose(); $graphics.Dispose(); $composite.Dispose(); $tintedL3.Dispose()
}

# 2. Generate Themed Icons (Clock, Lock, Shield)
foreach ($themeName in $themes.Keys) {
    $rgb = $themes[$themeName]
    
    # Clock
    Create-Themed-Icon "clock_$themeName.png" $rgb.R $rgb.G $rgb.B {
        param($g, $r, $gr, $b)
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, $r, $gr, $b))
        $g.FillEllipse($bgBrush, 2, 2, 44, 44)
        $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, $r, $gr, $b), 1.5)
        $g.DrawEllipse($borderPen, 2, 2, 44, 44)
        
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, $r, $gr, $b), 3)
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        
        $g.DrawEllipse($pen, 12, 12, 24, 24)
        $g.DrawLine($pen, 24, 17, 24, 24)
        $g.DrawLine($pen, 24, 24, 30, 27)
        
        $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
    }

    # Lock
    Create-Themed-Icon "lock_$themeName.png" $rgb.R $rgb.G $rgb.B {
        param($g, $r, $gr, $b)
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, $r, $gr, $b))
        $g.FillEllipse($bgBrush, 2, 2, 44, 44)
        $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, $r, $gr, $b), 1.5)
        $g.DrawEllipse($borderPen, 2, 2, 44, 44)
        
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, $r, $gr, $b), 3)
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        
        $g.DrawRectangle($pen, 13, 20, 22, 16)
        $g.DrawArc($pen, 17, 10, 14, 18, 180, 180)
        
        $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
    }

    # Shield
    Create-Themed-Icon "shield_$themeName.png" $rgb.R $rgb.G $rgb.B {
        param($g, $r, $gr, $b)
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, $r, $gr, $b))
        $g.FillRectangle($bgBrush, 2, 2, 44, 44)
        $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, $r, $gr, $b), 1.5)
        $g.DrawRectangle($borderPen, 2, 2, 44, 44)
        
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, $r, $gr, $b), 2.8)
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        
        $pts = @(
            [System.Drawing.Point]::new(24, 10),
            [System.Drawing.Point]::new(35, 14),
            [System.Drawing.Point]::new(35, 24),
            [System.Drawing.Point]::new(24, 37),
            [System.Drawing.Point]::new(13, 24),
            [System.Drawing.Point]::new(13, 14)
        )
        $g.DrawPolygon($pen, $pts)
        $g.DrawLine($pen, 19, 23, 23, 27)
        $g.DrawLine($pen, 23, 27, 29, 19)
        
        $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
    }
}

$img1.Dispose(); $img2.Dispose(); $img3.Dispose()
Write-Output "All optimized email assets generated successfully."
