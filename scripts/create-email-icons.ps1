Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $baseDir "public\email-icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

function Create-Icon($filename, [scriptblock]$drawAction) {
    $bmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    & $drawAction $g
    
    $filePath = Join-Path $iconsDir $filename
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $filePath"
}

# Clock Icon (Purple/Lavender #c084fc on circular badge)
Create-Icon "clock.png" {
    param($g)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 192, 132, 252))
    $g.FillEllipse($bgBrush, 2, 2, 60, 60)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 192, 132, 252), 2)
    $g.DrawEllipse($borderPen, 2, 2, 60, 60)
    
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 132, 252), 4)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    
    $g.DrawEllipse($pen, 16, 16, 32, 32)
    $g.DrawLine($pen, 32, 23, 32, 32)
    $g.DrawLine($pen, 32, 32, 40, 36)
    
    $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
}

# Lock Icon (Purple/Lavender #c084fc on circular badge)
Create-Icon "lock.png" {
    param($g)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 192, 132, 252))
    $g.FillEllipse($bgBrush, 2, 2, 60, 60)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 192, 132, 252), 2)
    $g.DrawEllipse($borderPen, 2, 2, 60, 60)
    
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 132, 252), 4)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    # Body
    $g.DrawRectangle($pen, 18, 27, 28, 20)
    # Shackle
    $g.DrawArc($pen, 23, 15, 18, 22, 180, 180)
    
    $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
}

# Shield Icon (Purple/Lavender #c084fc on rounded square badge)
Create-Icon "shield.png" {
    param($g)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 192, 132, 252))
    $g.FillRectangle($bgBrush, 4, 4, 56, 56)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 192, 132, 252), 2)
    $g.DrawRectangle($borderPen, 4, 4, 56, 56)
    
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 132, 252), 3.5)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    
    # Shield path
    $pts = @(
        [System.Drawing.Point]::new(32, 14),
        [System.Drawing.Point]::new(46, 19),
        [System.Drawing.Point]::new(46, 32),
        [System.Drawing.Point]::new(32, 49),
        [System.Drawing.Point]::new(18, 32),
        [System.Drawing.Point]::new(18, 19)
    )
    $g.DrawPolygon($pen, $pts)
    
    # Checkmark inside
    $g.DrawLine($pen, 26, 31, 30, 35)
    $g.DrawLine($pen, 30, 35, 38, 25)
    
    $bgBrush.Dispose(); $borderPen.Dispose(); $pen.Dispose()
}

Write-Output "All email icons created successfully."
