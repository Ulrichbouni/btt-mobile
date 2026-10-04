$out = @()
$base = Join-Path $env:USERPROFILE '.gradle\caches\modules-2\files-2.1\com.android.tools.build\aapt2'
$exes = @()
if (Test-Path $base) {
  $exes = Get-ChildItem $base -Recurse -Filter 'aapt2.exe' -ErrorAction SilentlyContinue
}

if ($exes.Count -eq 0) {
  $out += 'AUCUN aapt2 AGP dans le cache Gradle : ' + $base
} else {
  foreach ($x in $exes) {
    $out += ('--- ' + $x.FullName)
    $out += ('version: ' + ((& $x.FullName version 2>&1) -join ' | '))
    foreach ($api in @('android-33','android-34','android-36')) {
      $jar = 'C:\Users\ulrich bouni\AppData\Local\Android\Sdk\platforms\' + $api + '\android.jar'
      if (Test-Path $jar) {
        & $x.FullName dump resources $jar 2>&1 | Out-Null
        $out += ($api + ' dump-resources exit=' + $LASTEXITCODE)
      } else {
        $out += ($api + ' -> jar absent')
      }
    }
  }
}

$out += ''
$out += '=== versions de build-tools installees ==='
$bt = 'C:\Users\ulrich bouni\AppData\Local\Android\Sdk\build-tools'
foreach ($d in Get-ChildItem $bt -Directory) {
  $a = Join-Path $d.FullName 'aapt2.exe'
  if (Test-Path $a) {
    $out += ($d.Name + ' -> ' + ((& $a version 2>&1) -join ' '))
  } else {
    $out += ($d.Name + ' -> pas de aapt2')
  }
}

$out | Out-File -Encoding utf8 'D:\agence-IA\gestion\mobile\_aapt2.txt'
Write-Output 'ok'