# Buka setiap *.raw.docx di Word asli, perbarui daftar isi, daftar gambar, dan field,
# simpan sebagai .docx (hasil Word), dan ekspor PDF target ke public/word.
# Lalu buat satu dokumen "berantakan" langsung di Word untuk menguji pemeriksa.
# Setiap file dikerjakan di instance Word sendiri dengan batas waktu, supaya satu dialog tersembunyi
# tidak membuat seluruh skrip macet.
# Jalankan dari root proyek: powershell -ExecutionPolicy Bypass -File scripts/word/word.ps1
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$dir = Join-Path $root 'verify-out\word'
$pub = Join-Path $root 'public\word'
New-Item -ItemType Directory -Force $pub | Out-Null

function Run-Word([string]$label, [scriptblock]$body, [object[]]$args2) {
  $job = Start-Job -ScriptBlock $body -ArgumentList $args2
  if (Wait-Job $job -Timeout 120) { Write-Output "$label : $(Receive-Job $job)" }
  else { Stop-Job $job; Write-Output "$label : TIMEOUT"; $script:failed = $true }
  Remove-Job $job -Force
}

$failed = $false
foreach ($f in Get-ChildItem $dir -Filter '*.raw.docx') {
  $name = $f.Name -replace '\.raw\.docx$', ''
  Run-Word $name {
    param($src, $docx, $pdf)
    $w = New-Object -ComObject Word.Application
    $w.DisplayAlerts = 0
    try {
      $d = $w.Documents.Open($src)
      for ($i = 0; $i -lt 2; $i++) {
        foreach ($t in $d.TablesOfContents) { $t.Update() }
        foreach ($t in $d.TablesOfFigures) { $t.Update() }
        $null = $d.Fields.Update()
      }
      $d.SaveAs2($docx, 16)
      $d.ExportAsFixedFormat($pdf, 17)
      $p = $d.ComputeStatistics(2)
      $d.Close(0)
      "$p halaman"
    } catch { "ERR $($_.Exception.Message)" } finally { try { $w.Quit() } catch {} }
  } @($f.FullName, (Join-Path $dir "$name.docx"), (Join-Path $pub "target-$name.pdf"))
}

# Versi berantakan: judul ditebalkan manual, Enter berkali-kali, nomor dan daftar isi diketik,
# spasi untuk merapikan. Disisipkan lewat Range (bukan Selection) supaya AutoFormat tidak mengubahnya.
Run-Word 'berantakan' {
  param($out)
  $w = New-Object -ComObject Word.Application
  $w.DisplayAlerts = 0
  try {
    $doc = $w.Documents.Add()
    function Line($t, $bold = $false, $size = 11) { $r = $doc.Content; $r.Collapse(0); $r.InsertAfter("$t`r"); $r.Font.Bold = [int]$bold; $r.Font.Size = $size }
    Line 'MODUL PRAKTIKUM SISTEM OPERASI' $true 20
    Line 'Modul 1: Pengenalan Xinu'
    1..12 | ForEach-Object { Line '' }
    Line 'Daftar Isi' $true 14
    Line '1. Pendahuluan ........................ 3'
    Line '2. Dasar Teori ........................ 3'
    1..6 | ForEach-Object { Line '' }
    Line '1. Pendahuluan' $true 14
    Line 'Modul ini mengenalkan sistem operasi Xinu yang dipakai sepanjang praktikum.'
    Line '1.1 Tujuan Praktikum' $true 12
    Line '- Memahami fungsi dasar sebuah sistem operasi.'
    Line '- Menyiapkan mesin virtual untuk menjalankan Xinu.'
    Line '2. Dasar Teori' $true 14
    Line 'Folder          Isi'
    Line 'system/         Kode inti'
    Line '3. Langkah Praktikum' $true 14
    Line '1. Buka VirtualBox, lalu pilih Import Appliance.'
    Line '2. Pilih berkas xinu-vm.ova dari folder praktikum.'
    $doc.SaveAs2($out, 16)
    $doc.Close(0)
    'dibuat di Word'
  } catch { "ERR $($_.Exception.Message)" } finally { try { $w.Quit() } catch {} }
} @((Join-Path $dir 'berantakan.docx'))

if ($failed) { exit 1 }
