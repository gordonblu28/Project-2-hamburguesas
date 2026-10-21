# Servidor local para ver el sitio en la computadora (Windows, sin instalar nada).
# Lo abre "ABRIR-SITIO-Windows.bat". Solo escucha en esta computadora (localhost).
$ErrorActionPreference = 'Stop'
$raiz = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'sitio'))

$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json'; '.xml' = 'application/xml'; '.txt' = 'text/plain; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'
  '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'; '.woff' = 'font/woff'
}

# Primer puerto libre entre 8080 y 8099.
$servidor = $null
foreach ($p in 8080..8099) {
  try {
    $s = New-Object System.Net.HttpListener
    $s.Prefixes.Add("http://localhost:$p/")
    $s.Start()
    $servidor = $s
    $puerto = $p
    break
  } catch { }
}
if (-not $servidor) { Write-Host 'No hay un puerto libre entre 8080 y 8099.'; Read-Host 'Enter para salir'; exit 1 }

$url = "http://localhost:$puerto/"
Write-Host ''
Write-Host "  The Rodeo Bar And Grill: $url"
Write-Host '  Para detener el sitio, cierre esta ventana.'
Write-Host ''
if (-not $env:RODEO_SIN_NAVEGADOR) { Start-Process $url }

while ($servidor.IsListening) {
  $ctx = $servidor.GetContext()
  $res = $ctx.Response
  try {
    $sep = [IO.Path]::DirectorySeparatorChar
    $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/').Replace('/', $sep)
    # Combine (no Join-Path): admite la ruta vacía de "/" en Windows PowerShell 5.1.
    $archivo = [IO.Path]::GetFullPath([IO.Path]::Combine($raiz, $ruta))
    $estado = 200
    # Nunca fuera de la carpeta del sitio.
    $dentro = ($archivo -eq $raiz) -or $archivo.StartsWith($raiz + $sep, [StringComparison]::OrdinalIgnoreCase)
    if (-not $dentro) { $archivo = '' }
    elseif (Test-Path -LiteralPath $archivo -PathType Container) { $archivo = Join-Path $archivo 'index.html' }
    if (-not $archivo -or -not (Test-Path -LiteralPath $archivo -PathType Leaf)) {
      $archivo = Join-Path $raiz '404.html'
      $estado = 404
    }
    $tipo = $tipos[[IO.Path]::GetExtension($archivo).ToLower()]
    if (-not $tipo) { $tipo = 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($archivo)
    $res.StatusCode = $estado
    $res.ContentType = $tipo
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
