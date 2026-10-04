# Genera exercises-es.json: los ejercicios de wger (https://wger.de) que tienen nombre en
# español e imagen. La app usa ese archivo en vez de llamar a la API cada vez.
#
# Uso (desde la carpeta del proyecto):  powershell -File tools/actualizar-catalogo.ps1

$ErrorActionPreference = "Stop"
$SPANISH = 4 # id del idioma español en wger

$response = Invoke-WebRequest "https://wger.de/api/v2/exerciseinfo/?limit=2000" -UseBasicParsing
$json = [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
$licenses = @{}
(Invoke-RestMethod "https://wger.de/api/v2/license/").results | ForEach-Object { $licenses[$_.id] = $_.short_name.Trim() }

$catalog = foreach ($exercise in ($json | ConvertFrom-Json).results) {
  $translation = $exercise.translations | Where-Object language -eq $SPANISH | Select-Object -First 1
  if (-not $translation -or $exercise.images.Count -eq 0) { continue }

  # La imagen principal, o la primera si ninguna está marcada como principal
  $image = $exercise.images | Where-Object is_main | Select-Object -First 1
  if (-not $image) { $image = $exercise.images[0] }

  $author = $image.license_author
  if (-not $author) { $author = $image.author_history | Select-Object -First 1 }

  [ordered]@{
    name    = $translation.name.Trim()
    aliases = @($translation.aliases | ForEach-Object { $_.alias.Trim() } | Where-Object { $_ })
    image   = $image.thumbnails.medium
    author  = "$author"
    license = $licenses[[int]$image.license]
  }
}

# Ordenado por nombre y sin repetidos (wger tiene algunos ejercicios con el mismo nombre)
$catalog = $catalog | Sort-Object { $_.name } | Group-Object { $_.name.ToLower() } | ForEach-Object { $_.Group[0] }
$output = Join-Path $PSScriptRoot "..\exercises-es.json"
# Un ejercicio por línea: así en Git se ve fácil qué cambió al actualizar
$lines = $catalog | ForEach-Object { ConvertTo-Json $_ -Depth 4 -Compress }
$text = "[`n" + ($lines -join ",`n") + "`n]`n"
[System.IO.File]::WriteAllText($output, $text, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Listo: $(@($catalog).Count) ejercicios en exercises-es.json"
