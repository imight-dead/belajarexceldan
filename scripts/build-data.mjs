// Membaca 2 CSV di data-src/ lalu menulis src/data/datasets.json.
// Data sintetis dibuat dengan seed tetap, jadi hasilnya selalu sama.
// Jalankan: node scripts/build-data.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readCsv = (f) =>
  readFileSync(join(root, 'data-src', f), 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.split(';'))

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261114)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const int = (a, b) => a + Math.floor(rand() * (b - a + 1))

// ---------- Link Penting ----------
const lp = readCsv('link-penting.csv')
const asprak = []
for (const r of lp) {
  const no = Number(r[3])
  if (r[3] && Number.isInteger(no) && r[4]) asprak.push([no, Number(r[4]), r[5].trim(), r[6].trim()])
}
const kelasList = lp.map((r) => (r[9] || '').trim()).filter((v) => /^IF-/.test(v))
const aslab = []
let inAslab = false
for (const r of lp) {
  if (r[0] === 'Kode') { inAslab = true; continue }
  if (inAslab) {
    if (!r[0]) break
    aslab.push([r[0].trim(), r[1].trim()])
  }
}
const modul = lp
  .filter((r) => /^MODUL \d+$/.test(r[0]))
  .map((r) => [Number(r[0].replace('MODUL ', '')), r[0], r[1].trim()])

// ---------- Presensi ----------
const pr = readCsv('presensi-asprak.csv').slice(1).filter((r) => r[0] && r[0].trim())
const presensiRaw = pr.map((r) => ({ nama: r[0].trim(), kode: r[1].trim(), kelasSparse: r[2].trim(), sesi: Number(r[3]), kelas: r[5].trim() }))

// tanda "V" = asprak sudah input nilai modul itu. Modul 1-8 sudah berjalan.
const marks = presensiRaw.map(() => Array.from({ length: 16 }, (_, i) => (i < 8 && rand() < 0.8 ? 'V' : '')))
const presensi = presensiRaw.map((p, i) => [p.nama, p.kode, p.kelas, p.sesi, ...marks[i]])

// versi kotor: kelas hanya di baris pertama + kolom REF teks seperti aslinya
const firstRowOfKelas = {}
presensiRaw.forEach((p, i) => { if (!(p.kelas in firstRowOfKelas)) firstRowOfKelas[p.kelas] = i + 2 })
const presensiKotor = presensiRaw.map((p, i) => [
  p.nama, p.kode, firstRowOfKelas[p.kelas] === i + 2 ? p.kelas : '', p.sesi, `$C$${firstRowOfKelas[p.kelas]}`, ...marks[i],
])

// ---------- Kelas (kolom HARI/JAM/RUANG sintetis) ----------
const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const jam = ['06.30-09.30', '09.30-12.30', '12.30-15.30', '15.30-18.30']
const kelas = kelasList.map((k, i) => [
  k, k.includes('PJJ') ? 'S1 IF PJJ' : 'S1 IF', hari[i % 5], jam[Math.floor(i / 5) % 4], `LAB ${'ABCDE'[i % 5]}`,
])

// ---------- Asprak kotor ----------
const messName = (n, mode) => {
  if (mode === 0) return '  ' + n
  if (mode === 1) return n.replace(' ', '   ')
  if (mode === 2) return n + ' '
  if (mode === 3) return n.toLowerCase()
  if (mode === 4) return n.split(' ').map((w, j) => (j % 2 ? w.toLowerCase() : w)).join(' ')
  return n
}
const asprakKotor = asprak.map(([no, nim, nama, kode], i) => {
  const m = i % 7 === 1 ? 0 : i % 7 === 3 ? 1 : i % 7 === 5 ? 2 : i % 9 === 0 ? 3 : i % 11 === 4 ? 4 : -1
  const kd = i % 6 === 2 ? kode.toLowerCase() : i % 8 === 7 ? kode + ' ' : kode
  const nimTxt = i % 10 === 6 ? ' ' + String(nim) : String(nim)
  return [no, nimTxt, messName(nama, m), kd]
})
asprakKotor.splice(20, 0, [...asprakKotor[19]])
asprakKotor.splice(41, 0, [...asprakKotor[40]])

// ---------- Praktikan (fiktif) ----------
const depan = ['Adit', 'Bima', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hana', 'Indra', 'Joko', 'Kirana', 'Laras', 'Made', 'Nadia', 'Oki', 'Putri', 'Raka', 'Sinta', 'Tegar', 'Umi', 'Vino', 'Wulan', 'Yoga', 'Zahra', 'Bayu', 'Dimas', 'Farah', 'Galih', 'Intan', 'Kevin']
const belakang = ['Pratama', 'Saputra', 'Lestari', 'Wijaya', 'Kusuma', 'Hidayat', 'Nugroho', 'Anggraini', 'Santoso', 'Permata', 'Siregar', 'Utami', 'Firmansyah', 'Maharani', 'Setiawan']
const praktikanKelas = ['IF-49-01', 'IF-49-02', 'IF-49-03', 'IF-49-04']
const usedNames = new Set()
const praktikan = []
for (let i = 0; i < 40; i++) {
  let nama
  do nama = `${pick(depan)} ${pick(belakang)}`.toUpperCase()
  while (usedNames.has(nama))
  usedNames.add(nama)
  const kls = praktikanKelas[i % 4]
  const asprakDiKelas = presensiRaw.filter((p) => p.kelas === kls).map((p) => p.kode)
  const nilai = Array.from({ length: 8 }, () => (rand() < 0.08 ? '' : int(45, 100)))
  praktikan.push([103012500000 + int(100, 999) * 10 + (i % 10), nama, kls, pick(asprakDiKelas), ...nilai])
}
// pastikan NIM unik
const seen = new Set()
for (const p of praktikan) { while (seen.has(p[0])) p[0] += 1; seen.add(p[0]) }

// ---------- Inventaris PC (fiktif) ----------
const cpus = [['i3-10100', 4800000], ['i5-10400', 6500000], ['i5-12400', 8200000], ['i7-12700', 11500000], ['Ryzen 5 5600', 7600000]]
const inventaris = []
const ruangs = ['LAB A', 'LAB B', 'LAB C', 'LAB D', 'LAB E']
for (let i = 0; i < 30; i++) {
  const ruang = ruangs[Math.floor(i / 6)]
  const [cpu, base] = pick(cpus)
  const ram = pick([8, 8, 16, 16, 32])
  const sto = pick([256, 512, 512, 1000])
  const tahun = int(2019, 2024)
  const s = rand()
  const status = s < 0.7 ? 'Baik' : s < 0.85 ? 'Perbaikan' : 'Rusak'
  const harga = Math.round((base + ram * 150000 + sto * 1200 - (2024 - tahun) * 250000) / 10000) * 10000
  inventaris.push([`${ruang.slice(-1)}-${String((i % 6) + 1).padStart(2, '0')}`, ruang, cpu, ram, sto, tahun, status, harga])
}

const grade = [[0, 'E'], [40, 'D'], [50, 'C'], [60, 'BC'], [65, 'B'], [70, 'AB'], [80, 'A']]
const bobot = [['KOMPONEN', 'TP', 'TA', 'JURNAL', 'TAKHIR'], ['BOBOT', 0.15, 0.15, 0.5, 0.2]]

const M16 = Array.from({ length: 16 }, (_, i) => `Modul ${i + 1}`)
const out = {
  Asprak: { headers: ['NO', 'NIM', 'NAMA', 'KODE'], rows: asprak },
  Aslab: { headers: ['KODE', 'NAMA'], rows: aslab },
  Kelas: { headers: ['KELAS', 'PROGRAM', 'HARI', 'JAM', 'RUANG'], rows: kelas },
  Modul: { headers: ['NO', 'MODUL', 'MATERI'], rows: modul },
  Presensi: { headers: ['NAMA', 'KODE', 'KELAS', 'SESI', ...M16], rows: presensi },
  PresensiKotor: { headers: ['NAMA', 'KODE', 'KELAS', 'SESI', 'REF', ...M16], rows: presensiKotor },
  AsprakKotor: { headers: ['NO', 'NIM', 'NAMA', 'KODE'], rows: asprakKotor },
  Praktikan: { headers: ['NIM', 'NAMA', 'KELAS', 'ASPRAK', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'], rows: praktikan },
  Inventaris: { headers: ['KODE', 'RUANG', 'CPU', 'RAM', 'STORAGE', 'TAHUN', 'STATUS', 'HARGA'], rows: inventaris },
  Grade: { headers: ['BATAS', 'HURUF'], rows: grade },
  Bobot: { headers: bobot[0], rows: [bobot[1]] },
}
writeFileSync(join(root, 'src/data/datasets.json'), JSON.stringify(out))
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(14), v.rows.length, 'baris')
