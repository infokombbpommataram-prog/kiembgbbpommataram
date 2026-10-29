import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_GAS_URL || ''
const TABS = ['Lokus', 'Laporan', 'Nilai', 'Monev']
async function call(fn, body = {}) {
  const r = await fetch(API, { method: 'POST', body: JSON.stringify({ fn, ...body }) })
  return r.json()
}

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('Lokus')
  const [q, setQ] = useState('')
  const [head, setHead] = useState([])
  const [rows, setRows] = useState([])
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [nw, setNw] = useState('')

  const load = async () => {
    const d = await call('read', { sheet: tab, q })
    setHead(d.head || []); setRows(d.rows || [])
  }
  useEffect(() => { if (user) load() }, [user, tab])
  useEffect(() => { const t = setTimeout(() => user && load(), 400); return () => clearTimeout(t) }, [q])

  if (!user) return (
    <div style={{ maxWidth: 320, margin: '15vh auto', fontFamily: 'system-ui' }}>
      <h3>Monev KIE MBG</h3>
      <input placeholder="user" value={u} onChange={e => setU(e.target.value)} style={s} />
      <input placeholder="pass" type="password" value={p} onChange={e => setP(e.target.value)} style={s} />
      <button style={s} onClick={async () => {
        const r = await call('login', { u, p })
        r.ok ? setUser(r.role) : alert('salah')
      }}>Masuk</button>
    </div>
  )
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 12, fontFamily: 'system-ui', fontSize: 14 }}>
      <b>Monev KIE MBG</b> <small>({user})</small>
      <div style={{ margin: '8px 0' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={t === tab ? on : s}>{t}</button>)}
        <input placeholder="cari…" value={q} onChange={e => setQ(e.target.value)} style={s} />
        <button style={s} onClick={() => call('ikk').then(load)}>Hitung IKK</button>
        <button style={s} onClick={() => call('seed').then(load)}>Seed 102</button>
      </div>
      <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{head.map(h => <th key={h}>{h}</th>)}<th></th></tr></thead>
        <tbody>{rows.map(r => <tr key={r[0]}>{r.slice(1).map((c, i) => <td key={i}>{c}</td>)}
          <td>{user !== 'kader' && <button onClick={() => call('del', { sheet: tab, rowNum: r[0] }).then(load)}>x</button>}</td></tr>)}</tbody>
      </table>
      <p><input value={nw} onChange={e => setNw(e.target.value)} placeholder="nilai baru, pisah koma" size="60" style={s} />
        <button style={s} onClick={() => call('add', { sheet: tab, row: nw.split(',').map(x => x.trim()) }).then(() => { setNw(''); load() })}>+ Tambah</button></p>
    </div>
  )
}
const s = { padding: 6, margin: 2, fontSize: 14 }
const on = { ...s, background: '#155ee7', color: '#fff' }
