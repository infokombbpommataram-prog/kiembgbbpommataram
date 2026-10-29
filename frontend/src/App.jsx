import { useEffect, useState } from 'react'
import FarmMap from './FarmMap'

const API = import.meta.env.VITE_GAS_URL || ''
const TABS = [
  { id: 'Lokus', label: '🌾 Lokus + Peta', icon: '🌾' },
  { id: 'Laporan', label: '📜 Catatan Edukasi', icon: '📜' },
  { id: 'Nilai', label: '⚖️ Timbangan Nilai', icon: '⚖️' },
  { id: 'Monev', label: '🔎 Patroli Monev', icon: '🔎' }
]

const FALLBACK_LOKUS = [
  { kode: 'SK-01', nama: 'SDN 1 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.732, lng: 116.115, kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-02', nama: 'SDN 2 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.735, lng: 116.118, kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-03', nama: 'MI NW Kediri', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.680, lng: 116.130, kader: 'Budi B', hp: '+628222', komitmen: 'ada' },
  { kode: 'SK-04', nama: 'SMPN 1 Narmada', kelompok: 'kontrol', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.620, lng: 116.200, kader: 'Budi B', hp: '+628222', komitmen: 'belum' },
  { kode: 'PS-01', nama: 'Posyandu Mawar Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.733, lng: 116.116, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-02', nama: 'Posyandu Melati Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.736, lng: 116.119, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-03', nama: 'Posyandu Kenanga Kediri', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.681, lng: 116.131, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-04', nama: 'Posyandu Anggrek Kediri', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.683, lng: 116.133, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-05', nama: 'Posyandu Cempaka Narmada', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.621, lng: 116.201, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-06', nama: 'Posyandu Dahlia Narmada', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.623, lng: 116.203, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-07', nama: 'Posyandu Flamboyan Lembar', kelompok: 'kontrol', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Lembar', lat: -8.750, lng: 116.070, kader: 'Dewi D', hp: '+628444', komitmen: 'belum' },
  { kode: 'PS-08', nama: 'Posyandu Kamboja Sekotong', kelompok: 'kontrol', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Sekotong', lat: -8.780, lng: 116.050, kader: 'Dewi D', hp: '+628444', komitmen: 'belum' }
]

async function callApi(fn, body = {}) {
  if (!API) return { ok: 0, offline: true, error: 'VITE_GAS_URL belum disetel.' }
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn, ...body }) })
    if (!r.ok) return { ok: 0, status: r.status, error: `HTTP ${r.status}` }
    return await r.json()
  } catch (err) { return { ok: 0, error: err.message } }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('Lokus')
  const [q, setQ] = useState('')
  const [head, setHead] = useState([])
  const [rows, setRows] = useState([])
  const [allLokus, setAllLokus] = useState(FALLBACK_LOKUS)
  const [loading, setLoading] = useState(false)
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  // detail lokus: kode terpilih + data terkait (laporan/nilai/monev)
  const [detail, setDetail] = useState(null)
  // edit nilai per lokus: {rowNum, kode, pre, post, n}
  const [editNilai, setEditNilai] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({})

  const totalLokus = allLokus.length
  const intervensiCount = allLokus.filter(x => String(x.kelompok || '').toLowerCase() === 'intervensi').length

  const parseLokus = rs => (rs || []).map(r => ({
    _row: r[0], kode: r[1], nama: r[2], kelompok: r[3], jenis: r[4],
    kab: r[5], kec: r[6], lat: parseFloat(r[7]), lng: parseFloat(r[8]), komitmen: r[9]
  }))

  const loadData = async () => {
    setLoading(true)
    const res = await callApi('read', { sheet: tab === 'Lokus' ? 'Lokus' : tab, q: tab === 'Lokus' ? '' : q })
    setLoading(false)
    if (res && res.head) {
      setHead(res.head); setRows(res.rows || [])
      if (tab === 'Lokus') { const pl = parseLokus(res.rows); if (pl.length) setAllLokus(pl) }
    } else if (tab === 'Lokus') {
      setHead(['_row', 'kode', 'nama', 'kelompok', 'jenis', 'kab', 'kec', 'lat', 'lng', 'komitmen'])
      const f = FALLBACK_LOKUS.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
      setRows(f.map((x, i) => [i + 2, x.kode, x.nama, x.kelompok, x.jenis, x.kab, x.kec, x.lat, x.lng, x.komitmen]))
    } else if (tab === 'Laporan') {
      setHead(['_row', 'id', 'kode_lokus', 'bulan', 'tgl_edukasi', 'peserta', 'link_foto', 'status', 'stempel'])
      setRows([[2, 'SK-01-B1', 'SK-01', 1, '2027-02-10', 45, '', 'disetujui', '2027-02-11']])
    } else if (tab === 'Nilai') {
      setHead(['_row', 'kode_lokus', 'kelompok', 'pre_mean', 'post_mean', 'n', 'g', 'meningkat'])
      setRows([[2, 'SK-01', 'intervensi', 55, 80, 100, 0.55, 'YA'], [3, 'SK-04', 'kontrol', 58, 62, 100, 0.09, '']])
    } else if (tab === 'Monev') {
      setHead(['_row', 'tgl', 'kode_lokus', 'temuan', 'tindak_lanjut', 'status'])
      setRows([[2, '2027-02-01', 'SK-01', 'Poster belum terpasang', 'Pasang sebelum B2', 'selesai']])
    }
  }

  useEffect(() => { if (user) { loadData(); refreshLokus() } }, [user, tab])
  useEffect(() => { if (!user) return; const t = setTimeout(() => loadData(), 350); return () => clearTimeout(t) }, [q])

  const refreshLokus = async () => {
    const res = await callApi('read', { sheet: 'Lokus', q: '' })
    if (res && res.rows && res.rows.length) setAllLokus(parseLokus(res.rows))
  }

  // Buka detail lokus: data + riwayat edukasi + nilai + monev
  const openDetail = async kode => {
    setLoading(true)
    const [lap, nil, mon] = await Promise.all([
      callApi('read', { sheet: 'Laporan', q: kode }),
      callApi('read', { sheet: 'Nilai', q: kode }),
      callApi('read', { sheet: 'Monev', q: kode })
    ])
    setLoading(false)
    const info = allLokus.find(x => x.kode === kode) || {}
    setDetail({ info, laporan: (lap.rows || []), nilai: (nil.rows || [])[0] || null, monev: (mon.rows || []) })
  }

  const handleLogin = async () => {
    setLoading(true)
    const r = await callApi('login', { u, p })
    setLoading(false)
    if (r && r.ok) setUser(r.role || 'admin')
    else alert('Username / password salah, atau backend belum terhubung.')
  }

  const handleDelete = async rowNum => {
    if (!confirm(`Hapus baris ${rowNum} di ${tab}?`)) return
    setLoading(true); await callApi('del', { sheet: tab, rowNum }); loadData()
  }

  // Simpan edit nilai per lokus -> update kolom pre/post/n lalu hitung ulang g
  const saveNilai = async e => {
    e.preventDefault()
    setLoading(true)
    const row = [editNilai.kode, editNilai.kel, +editNilai.pre, +editNilai.post, +editNilai.n, '', '']
    await callApi('upd', { sheet: 'Nilai', rowNum: editNilai.rowNum, row })
    await callApi('ikk')
    setEditNilai(null); loadData()
  }

  const handleAddSubmit = async e => {
    e.preventDefault()
    let rowValues = []
    if (tab === 'Lokus') rowValues = [formData.kode || `LK-${Date.now().toString().slice(-4)}`, formData.nama || '', formData.kelompok || 'intervensi', formData.jenis || 'sekolah', formData.kab || 'Lombok Barat', formData.kec || 'Gerung', parseFloat(formData.lat) || -8.732, parseFloat(formData.lng) || 116.115, formData.komitmen || 'ada']
    else if (tab === 'Laporan') rowValues = [formData.id || `${formData.kode_lokus || 'LK'}-B${formData.bulan || 1}`, formData.kode_lokus || '', parseInt(formData.bulan) || 1, formData.tgl_edukasi || new Date().toISOString().slice(0, 10), parseInt(formData.peserta) || 0, formData.link_foto || '', formData.status || 'belum', '']
    else if (tab === 'Monev') rowValues = [formData.tgl || new Date().toISOString().slice(0, 10), formData.kode_lokus || '', formData.temuan || '', formData.tindak_lanjut || '', formData.status || 'terbuka']
    else rowValues = Object.values(formData)
    setLoading(true); await callApi('add', { sheet: tab, row: rowValues })
    setShowAddModal(false); setFormData({}); loadData()
  }

  const Overlay = () => loading && (
    <div style={ovWrap}>
      <div style={ovBox}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#5D4037' }}>Menghubungkan ke Database...</div>
        <div style={{ fontSize: 13, color: '#8C6239' }}>Slow dulu bestie...</div>
      </div>
    </div>
  )

  // ---------- LOGIN ----------
  if (!user) return (
    <div style={{ maxWidth: 440, margin: '8vh auto', padding: 20 }}>
      <Overlay />
      <div className="wood-board" style={{ padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
        <img src="/bpom.png" alt="BPOM" style={{ height: 72, marginBottom: 10 }} />
        <h2 style={{ fontSize: 18, margin: '4px 0', color: '#FFFDF7', lineHeight: 1.4 }}>
          Sistem Monitoring dan Evaluasi KIE Penerima Manfaat MBG Balai Besar POM di Mataram
        </h2>
      </div>
      <div className="parchment-card" style={{ padding: 24 }}>
        <h3 style={{ color: '#5D4037', margin: '0 0 16px 0', fontSize: 16 }}>🌾 Masuk ke Lumbung Data</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lb}>Nama Petugas:</label>
            <input className="farm-input" style={{ width: '100%' }} placeholder="admin / verif / kader" value={u} onChange={e => setU(e.target.value)} />
          </div>
          <div>
            <label style={lb}>Password:</label>
            <input type="password" className="farm-input" style={{ width: '100%' }} value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <button onClick={handleLogin} className="btn-harvest btn-green" style={{ width: '100%', padding: '12px' }}>🌻 Masuk</button>
        </div>
      </div>
    </div>
  )

  // ---------- MAIN ----------
  return (
    <div>
      <Overlay />
      <div className="wood-board" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/bpom.png" alt="BPOM" style={{ height: 44 }} />
            <h1 style={{ fontSize: 16, margin: 0, color: '#FFFDF7', maxWidth: 480, lineHeight: 1.4 }}>
              Sistem Monitoring dan Evaluasi KIE Penerima Manfaat MBG Balai Besar POM di Mataram
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4E342E', padding: '6px 12px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#FFFDF7' }}>{String(user).toUpperCase()}</div>
            <button onClick={() => setUser(null)} className="btn-harvest btn-danger" style={{ padding: '4px 8px', fontSize: 10 }}>Keluar 🚪</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#8C6239' }}>LOKUS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037' }}>{totalLokus} Lokus</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700 }}>🌱 {intervensiCount} Intervensi</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setDetail(null) }} className={`farm-tab ${tab === t.id ? 'farm-tab-active' : 'farm-tab-inactive'}`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'Lokus' && !detail && (
        <div>
          <FarmMap lokusList={allLokus.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))} onPick={openDetail} />
          <div className="parchment-card" style={{ padding: 14, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input className="farm-input" style={{ flex: 1 }} placeholder="Cari lokus..." value={q} onChange={e => setQ(e.target.value)} />
              <button onClick={() => { setFormData({}); setShowAddModal(true) }} className="btn-harvest btn-wood">+ Lokus</button>
            </div>
            {allLokus.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).map(x => (
              <div key={x.kode} onClick={() => openDetail(x.kode)} style={lkRow}>
                <div><b>{x.nama}</b> <small>({x.kode})</small><div style={{ fontSize: 11, color: '#8C6239' }}>Kec. {x.kec} • {x.kelompok}</div></div>
                <span>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Lokus' && detail && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <button onClick={() => setDetail(null)} className="btn-harvest btn-cream" style={{ marginBottom: 10 }}>‹ Kembali</button>
          <h3 style={{ margin: '0 0 4px 0', color: '#5D4037' }}>{detail.info.nama} ({detail.info.kode})</h3>
          <p style={{ fontSize: 12, color: '#8C6239' }}>{detail.info.jenis} • {detail.info.kelompok} • Kec. {detail.info.kec}, {detail.info.kab} • Komitmen: {detail.info.komitmen}</p>
          <h4 style={h4}>📊 Nilai</h4>
          {detail.nilai
            ? <p style={{ fontSize: 13 }}>pre {detail.nilai[3]} → post {detail.nilai[4]} (n={detail.nilai[5]}) • g={detail.nilai[6]} • {detail.nilai[7] || '-'}</p>
            : <p style={{ fontSize: 13 }}>Belum ada nilai.</p>}
          <h4 style={h4}>📜 Riwayat Edukasi</h4>
          {(detail.laporan || []).length === 0 ? <p style={{ fontSize: 13 }}>Belum ada laporan.</p> :
            <table className="farm-table"><thead><tr><th>Bulan</th><th>Tgl</th><th>Peserta</th><th>Status</th><th>Foto</th></tr></thead>
              <tbody>{detail.laporan.map(r => <tr key={r[0]}><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td>{r[7]}</td><td>{r[6] ? <a href={r[6]} target="_blank" rel="noreferrer">📷</a> : '-'}</td></tr>)}</tbody></table>}
          <h4 style={h4}>🔎 Monev</h4>
          {(detail.monev || []).length === 0 ? <p style={{ fontSize: 13 }}>Belum ada temuan.</p> :
            detail.monev.map(r => <p key={r[0]} style={{ fontSize: 13 }}>• {r[1]}: {r[3]} → {r[4]} ({r[5]})</p>)}
        </div>
      )}

      {tab !== 'Lokus' && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="farm-input" style={{ flex: 1 }} placeholder={`Cari ${tab}...`} value={q} onChange={e => setQ(e.target.value)} />
            <button onClick={() => { setFormData({}); setShowAddModal(true) }} className="btn-harvest btn-wood">+ Tambah</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="farm-table">
              <thead><tr>{head.map(h => <th key={h}>{h === '_row' ? '#' : h}</th>)}<th>Aksi</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r[0]}>
                  {r.slice(1).map((c, i) => <td key={i}>{String(c)}</td>)}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {tab === 'Nilai' && (
                      <button onClick={() => setEditNilai({ rowNum: r[0], kode: r[1], kel: r[2], pre: r[3], post: r[4], n: r[5] })} className="btn-harvest btn-cream" style={{ padding: '3px 8px', fontSize: 11 }}>Edit</button>
                    )}{' '}
                    {user !== 'kader' && <button onClick={() => handleDelete(r[0])} className="btn-harvest btn-danger" style={{ padding: '3px 8px', fontSize: 11 }}>Hapus</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {editNilai && (
        <div style={ovWrap} onClick={() => setEditNilai(null)}>
          <div className="parchment-card" style={{ maxWidth: 400, width: '100%', padding: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#5D4037', marginTop: 0 }}>Edit Nilai {editNilai.kode}</h3>
            <form onSubmit={saveNilai} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={lb}>Pre mean <input type="number" step="any" className="farm-input" value={editNilai.pre} onChange={e => setEditNilai({ ...editNilai, pre: e.target.value })} /></label>
              <label style={lb}>Post mean <input type="number" step="any" className="farm-input" value={editNilai.post} onChange={e => setEditNilai({ ...editNilai, post: e.target.value })} /></label>
              <label style={lb}>n <input type="number" className="farm-input" value={editNilai.n} onChange={e => setEditNilai({ ...editNilai, n: e.target.value })} /></label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditNilai(null)} className="btn-harvest btn-cream">Batal</button>
                <button type="submit" className="btn-harvest btn-green">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={ovWrap} onClick={() => setShowAddModal(false)}>
          <div className="parchment-card" style={{ maxWidth: 440, width: '100%', padding: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#5D4037', marginTop: 0 }}>+ Tambah {tab}</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tab === 'Lokus' && (<>
                <input className="farm-input" placeholder="kode" value={formData.kode || ''} onChange={e => setFormData({ ...formData, kode: e.target.value })} required />
                <input className="farm-input" placeholder="nama" value={formData.nama || ''} onChange={e => setFormData({ ...formData, nama: e.target.value })} required />
                <input className="farm-input" placeholder="lat" value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                <input className="farm-input" placeholder="lng" value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
              </>)}
              {tab === 'Laporan' && (<>
                <input className="farm-input" placeholder="kode_lokus" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                <input className="farm-input" type="number" min="1" max="3" placeholder="bulan 1-3" value={formData.bulan || ''} onChange={e => setFormData({ ...formData, bulan: e.target.value })} />
                <input className="farm-input" placeholder="link foto drive" value={formData.link_foto || ''} onChange={e => setFormData({ ...formData, link_foto: e.target.value })} />
              </>)}
              {tab === 'Monev' && (<>
                <input className="farm-input" placeholder="kode_lokus" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                <input className="farm-input" placeholder="temuan" value={formData.temuan || ''} onChange={e => setFormData({ ...formData, temuan: e.target.value })} required />
                <input className="farm-input" placeholder="tindak lanjut" value={formData.tindak_lanjut || ''} onChange={e => setFormData({ ...formData, tindak_lanjut: e.target.value })} />
              </>)}
              {tab === 'Nilai' && <input className="farm-input" placeholder="kode,kel,pre,post,n (koma)" value={formData.raw || ''} onChange={e => setFormData({ ...formData, raw: e.target.value })} />}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-harvest btn-cream">Batal</button>
                <button type="submit" className="btn-harvest btn-green">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const lb = { display: 'block', fontSize: 12, fontWeight: 700, color: '#8C6239', marginBottom: 4 }
const h4 = { color: '#5D4037', margin: '14px 0 6px 0', fontSize: 14 }
const lkRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #E6D5B8', borderRadius: 10, marginBottom: 6, cursor: 'pointer', background: '#FFFDF9' }
const ovWrap = { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(60,40,20,.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const ovBox = { background: '#FFFDF7', border: '3px solid #D7B152', borderRadius: 16, padding: '28px 36px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.35)' }
