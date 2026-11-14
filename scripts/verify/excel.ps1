# Tahap 2 verifikasi: buka workbook di Excel asli (COM), uji setiap rumus kunci,
# lalu simpan versi "filled" yang berisi campuran jawaban benar/salah.
# Jalankan dari root proyek: powershell -ExecutionPolicy Bypass -File scripts/verify/excel.ps1
$ErrorActionPreference = 'Stop'
$out = Join-Path (Get-Location) 'verify-out'
$xl = New-Object -ComObject Excel.Application
$xl.DisplayAlerts = $false
$xl.Visible = $false
try {
  foreach ($keysFile in Get-ChildItem $out -Filter 'level*.keys.json') {
    $n = $keysFile.BaseName -replace '\.keys$', ''
    $items = Get-Content $keysFile.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    $wb = $xl.Workbooks.Open((Join-Path $out "$n.xlsx"))
    $soal = $wb.Worksheets.Item('Soal')

    foreach ($it in $items) {
      if ($it.setup -and $it.setup.table) {
        $t = $it.setup.table
        $ws = $wb.Worksheets.Item($t.sheet)
        $lo = $ws.ListObjects.Add(1, $ws.Range($t.range), $null, 1)
        $lo.Name = $t.name
      }
      if ($it.setup -and $it.setup.name) {
        # Names.Add menolak LAMBDA secara langsung; buat dulu lalu set RefersTo
        $nm = $wb.Names.Add($it.setup.name.name, '=1')
        $nm.RefersTo = $it.setup.name.ref
      }
    }

    $results = @()
    foreach ($it in $items) {
      $cell = $soal.Range("E$($it.row)")
      $evals = @()
      foreach ($k in $it.keys) {
        $cell.Formula2 = $k
        $xl.Calculate()
        $v = $cell.Value2
        $isErr = ($v -is [int]) -and ($cell.Text -like '#*')
        $evals += [pscustomobject]@{ formula = $k; value = $(if ($isErr) { $null } else { $v }); text = $cell.Text; error = $isErr }
      }
      $results += [pscustomobject]@{ id = $it.id; evals = $evals }

      $cell.ClearContents()
      switch ($it.fill) {
        'key'    { $cell.Formula2 = $it.keys[0] }
        'alt'    { $cell.Formula2 = $(if ($it.keys.Count -gt 1) { $it.keys[1] } else { $it.keys[0] }) }
        'manual' {
          $e = $it.expected
          if ($e -is [ValueType] -and -not ($e -is [bool])) { $cell.Value2 = [double]$e }
          else { $cell.Value2 = [string]$e }
        }
        'wrong'  { $cell.Formula2 = '=1+1' }
        'empty'  { }
      }
    }
    $xl.Calculate()
    $wb.SaveAs((Join-Path $out "$n.filled.xlsx"), 51)
    $wb.Close($false)
    $results | ConvertTo-Json -Depth 6 | Out-File (Join-Path $out "$n.excel.json") -Encoding utf8
    Write-Output "$n : $($items.Count) soal diuji di Excel"
  }
} finally {
  $xl.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}

