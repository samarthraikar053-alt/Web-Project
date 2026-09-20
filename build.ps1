$html = Get-Content 'index.html' -Raw

$css1 = Get-Content 'css\style.css' -Raw
$css2 = Get-Content 'css\layout.css' -Raw
$css3 = Get-Content 'css\components.css' -Raw

$js1 = Get-Content 'js\store.js' -Raw
$js2 = Get-Content 'js\components\habitTracker.js' -Raw
$js3 = Get-Content 'js\components\taskManager.js' -Raw
$js4 = Get-Content 'js\components\dashboard.js' -Raw
$js5 = Get-Content 'js\components\analytics.js' -Raw
$js6 = Get-Content 'js\app.js' -Raw

$styleBlock = "<style>`n$css1`n$css2`n$css3`n</style>"
$html = $html -replace '(?s)<link rel="stylesheet" href="css/style\.css">.*?<link rel="stylesheet" href="css/components\.css">', $styleBlock

$scriptBlock = "<script>`n$js1`n$js2`n$js3`n$js4`n$js5`n$js6`n</script>"
$html = $html -replace '(?s)<script src="js/store\.js"></script>.*?<script src="js/app\.js"></script>', $scriptBlock

Set-Content 'track-well-standalone.html' -Value $html
