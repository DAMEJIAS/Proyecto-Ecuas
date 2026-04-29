Add-Type -AssemblyName System.Drawing

$size = 256
$bitmap = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(11, 19, 38))

$backgroundRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
$backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.Color]::FromArgb(18, 33, 68),
    [System.Drawing.Color]::FromArgb(77, 142, 255),
    45
)
$graphics.FillRectangle($backgroundBrush, $backgroundRect)

$glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 78, 222, 163))
$graphics.FillEllipse($glowBrush, 28, 24, 200, 200)

$panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(210, 9, 18, 36))
$graphics.FillRectangle($panelBrush, 22, 22, 212, 212)

$penSpring = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(173, 198, 255)), 10
$penSpring.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penSpring.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

$points = New-Object System.Collections.Generic.List[System.Drawing.Point]
$points.Add([System.Drawing.Point]::new(128, 34))
$points.Add([System.Drawing.Point]::new(128, 56))
$points.Add([System.Drawing.Point]::new(88, 72))
$points.Add([System.Drawing.Point]::new(168, 92))
$points.Add([System.Drawing.Point]::new(88, 112))
$points.Add([System.Drawing.Point]::new(168, 132))
$points.Add([System.Drawing.Point]::new(88, 152))
$points.Add([System.Drawing.Point]::new(168, 172))
$points.Add([System.Drawing.Point]::new(128, 190))
$graphics.DrawLines($penSpring, $points.ToArray())

$massBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.Rectangle]::new(76, 186, 104, 50)),
    [System.Drawing.Color]::FromArgb(216, 226, 255),
    [System.Drawing.Color]::FromArgb(77, 142, 255),
    90
)
$graphics.FillRectangle($massBrush, 76, 186, 104, 50)

$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(1, 43, 102)), 6
$graphics.DrawRectangle($borderPen, 76, 186, 104, 50)

$chartPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(78, 222, 163)), 6
$chartPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$chartPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$chartPoints = @(
    [System.Drawing.Point]::new(38, 198),
    [System.Drawing.Point]::new(64, 168),
    [System.Drawing.Point]::new(90, 188),
    [System.Drawing.Point]::new(116, 150),
    [System.Drawing.Point]::new(142, 178),
    [System.Drawing.Point]::new(168, 160),
    [System.Drawing.Point]::new(194, 170),
    [System.Drawing.Point]::new(220, 164)
)
$graphics.DrawCurve($chartPen, $chartPoints)

$font = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$stringBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("E", $font, $stringBrush, ([System.Drawing.RectangleF]::new(84, 88, 88, 64)), $format)

$iconPath = Join-Path $PSScriptRoot "..\icon.ico"
$stream = [System.IO.File]::Create($iconPath)
$writer = New-Object System.IO.BinaryWriter($stream)

$memory = New-Object System.IO.MemoryStream
$bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $memory.ToArray()

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Close()
$stream.Close()
$memory.Close()

$graphics.Dispose()
$bitmap.Dispose()
$backgroundBrush.Dispose()
$glowBrush.Dispose()
$panelBrush.Dispose()
$penSpring.Dispose()
$massBrush.Dispose()
$borderPen.Dispose()
$chartPen.Dispose()
$font.Dispose()
$stringBrush.Dispose()
$format.Dispose()
Write-Output "Icon generated at $iconPath"
