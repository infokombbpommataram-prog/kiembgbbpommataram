import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

export default function FarmMap({ lokusList = [], onPick = null, selectedKab = 'all' }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const baseLayersRef = useRef({})

  const [activeLayer, setActiveLayer] = useState('osm')
  const [filterKelompok, setFilterKelompok] = useState('all')
  const [filterKab, setFilterKab] = useState(selectedKab)
  const [selectedLokus, setSelectedLokus] = useState(null)

  // Pusat Geografis Pulau Lombok (Provinsi NTB) mencakup Mataram, Lobar, Loteng, Lotim, KLU
  const centerLombok = [-8.62, 116.32]

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: centerLombok,
      zoom: 10,
      zoomControl: true
    })
    mapInstanceRef.current = map

    // 1. OpenStreetMap Tile Layer
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    })

    // 2. Esri Satellite Tile Layer
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    })

    // 3. CartoDB Voyager Clean Tile Layer
    const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap & CARTO'
    })

    baseLayersRef.current = { osm, sat, voyager }
    osm.addTo(map)

    const markersGroup = L.layerGroup().addTo(map)
    markersLayerRef.current = markersGroup

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Sync state if parent changes selectedKab
  useEffect(() => {
    setFilterKab(selectedKab)
  }, [selectedKab])

  const switchLayer = (type) => {
    const map = mapInstanceRef.current
    if (!map) return
    Object.values(baseLayersRef.current).forEach(layer => map.removeLayer(layer))
    if (baseLayersRef.current[type]) {
      baseLayersRef.current[type].addTo(map)
      setActiveLayer(type)
    }
  }

  const createPinIcon = (bg, symbol) => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="
        background: ${bg};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">${symbol}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    })
  }

  const iconIntervensi = createPinIcon('#2E7D32', '🌱')
  const iconKontrol = createPinIcon('#0284C7', '🏫')

  // Filter list
  const filteredList = lokusList.filter(item => {
    const matchKel = filterKelompok === 'all' || String(item.kelompok || item.kel || '').toLowerCase() === filterKelompok.toLowerCase()
    const matchKab = filterKab === 'all' || String(item.kab || '').toLowerCase().includes(filterKab.toLowerCase())
    return matchKel && matchKab
  })

  // Re-plot markers
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersGroup = markersLayerRef.current
    if (!map || !markersGroup) return

    markersGroup.clearLayers()
    const bounds = []

    filteredList.forEach(item => {
      const lat = parseFloat(item.lat)
      const lng = parseFloat(item.lng)
      if (isNaN(lat) || isNaN(lng)) return

      bounds.push([lat, lng])
      const isIntervensi = String(item.kelompok || item.kel || '').toLowerCase() === 'intervensi'
      const icon = isIntervensi ? iconIntervensi : iconKontrol

      const marker = L.marker([lat, lng], { icon })

      const gmapsLink = `https://www.google.com/maps?q=${lat},${lng}`
      const popupHtml = `
        <div style="font-family: var(--font-body); min-width: 220px; color: #1e293b; padding: 2px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; background: ${isIntervensi ? '#dcfce7' : '#e0f2fe'}; color: ${isIntervensi ? '#15803d' : '#0369a1'}; padding: 2px 8px; border-radius: 6px;">
              ${item.kode || 'LOKUS'} • ${isIntervensi ? 'Intervensi MBG' : 'Kontrol'}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${item.nama}</h4>
          <p style="margin: 2px 0; font-size: 12px; color: #475569;">📍 ${item.kab || 'Pulau Lombok'} • Kec. <strong>${item.kec || '-'}</strong></p>
          <p style="margin: 2px 0; font-size: 12px; color: #475569;">👩‍⚕️ Kader: <strong>${item.kader || (item.hp ? `${item.hp}` : 'Kader MBG')}</strong></p>
          <p style="margin: 2px 0; font-size: 12px; color: #475569;">🌻 Komitmen: <strong>${String(item.komitmen || '').toLowerCase() === 'ada' ? 'Lengkap (Ada)' : 'Belum Lengkap'}</strong></p>
          <p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace; color: #64748b;">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
            <a href="${gmapsLink}" target="_blank" rel="noreferrer" style="color: #0284c7; font-weight: 700; text-decoration: none; font-size: 11px;">
              Buka Google Maps ↗
            </a>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
      marker.addTo(markersGroup)
      item._marker = marker
    })

    // Auto fit bounds jika filter spesifik memiliki titik
    if (bounds.length > 0 && filterKab !== 'all') {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }
  }, [filteredList, filterKelompok, filterKab])

  const flyToLokus = (item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lng)
    if (isNaN(lat) || isNaN(lng)) return
    setSelectedLokus(item.kode)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 })
      if (item._marker) {
        setTimeout(() => item._marker.openPopup(), 1200)
      }
    }
  }

  const resetPulauLombok = () => {
    setSelectedLokus(null)
    setFilterKab('all')
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(centerLombok, 10, { duration: 1.0 })
    }
  }

  // Daftar unik Kabupaten/Kota yang ada di data
  const kabOptions = ['all', 'Lombok Barat', 'Kota Mataram', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara']

  return (
    <div className="parchment-card" style={{ padding: 16, marginBottom: 16 }}>
      
      {/* Top Map Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #EADCC2' }}>
        
        {/* Layer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5D4037' }}>Tampilan:</span>
          <div style={{ display: 'inline-flex', background: '#F0E4CE', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => switchLayer('osm')}
              className={`btn-harvest ${activeLayer === 'osm' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              🗺️ Jalan
            </button>
            <button
              onClick={() => switchLayer('sat')}
              className={`btn-harvest ${activeLayer === 'sat' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              🛰️ Satelit
            </button>
            <button
              onClick={() => switchLayer('voyager')}
              className={`btn-harvest ${activeLayer === 'voyager' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              🏙️ Bersih
            </button>
          </div>
        </div>

        {/* Filter Wilayah Kab/Kota Se-Pulau Lombok */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5D4037' }}>Wilayah:</span>
          <select
            className="farm-input"
            style={{ padding: '3px 8px', fontSize: 11, minWidth: 140 }}
            value={filterKab}
            onChange={e => setFilterKab(e.target.value)}
          >
            <option value="all">🌐 Seluruh Pulau Lombok</option>
            <option value="Lombok Barat">Kab. Lombok Barat</option>
            <option value="Kota Mataram">Kota Mataram</option>
            <option value="Lombok Tengah">Kab. Lombok Tengah</option>
            <option value="Lombok Timur">Kab. Lombok Timur</option>
            <option value="Lombok Utara">Kab. Lombok Utara</option>
          </select>

          <span style={{ fontSize: 12, fontWeight: 700, color: '#5D4037', marginLeft: 4 }}>Kelompok:</span>
          <button
            onClick={() => setFilterKelompok('all')}
            className={`btn-harvest ${filterKelompok === 'all' ? 'btn-wood' : 'btn-cream'}`}
            style={{ padding: '3px 8px', fontSize: 11 }}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterKelompok('intervensi')}
            className={`btn-harvest ${filterKelompok === 'intervensi' ? 'btn-green' : 'btn-cream'}`}
            style={{ padding: '3px 8px', fontSize: 11 }}
          >
            🌱 Intervensi
          </button>
          <button
            onClick={() => setFilterKelompok('kontrol')}
            className={`btn-harvest ${filterKelompok === 'kontrol' ? 'btn-wood' : 'btn-cream'}`}
            style={{ padding: '3px 8px', fontSize: 11 }}
          >
            🏫 Kontrol
          </button>
          
          <button
            onClick={resetPulauLombok}
            className="btn-harvest btn-gold"
            style={{ padding: '3px 8px', fontSize: 11 }}
            title="Reset kamera ke pusat Pulau Lombok"
          >
            🏝️ Pusat P. Lombok
          </button>
        </div>

      </div>

      {/* Main Map Split: Map on Left, Lokus list on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        
        {/* Leaflet Container */}
        <div style={{ position: 'relative' }}>
          <div ref={mapContainerRef} className="farm-map-wrapper" style={{ height: 440 }} />

          {/* Floating Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 400,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '6px 10px',
            fontSize: 11,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>PETA SEBARAN PULAU LOMBOK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#2E7D32' }}></span>
              <span style={{ fontWeight: 600, color: '#334155' }}>🌱 Lokus Intervensi MBG</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#0284C7' }}></span>
              <span style={{ fontWeight: 600, color: '#334155' }}>🏫 Lokus Kontrol</span>
            </div>
          </div>
        </div>

        {/* Right Lokus List */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 440 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-farm)', color: '#5D4037', fontSize: 14 }}>
              Titik Lokus {filterKab !== 'all' ? `(${filterKab})` : 'Pulau Lombok'}: {filteredList.length} Titik
            </h4>
            <span style={{ fontSize: 11, color: '#8C6239' }}>Klik untuk arahkan</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredList.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#8C6239', fontSize: 12 }}>
                Belum ada lokus terdata untuk wilayah ini.
              </div>
            ) : (
              filteredList.map((item, idx) => {
                const isIntervensi = String(item.kelompok || item.kel || '').toLowerCase() === 'intervensi'
                const isSelected = selectedLokus === item.kode
                return (
                  <div
                    key={item.kode || idx}
                    onClick={() => flyToLokus(item)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid #2E7D32' : '1px solid #E6D5B8',
                      background: isSelected ? '#F0FDF4' : '#FFFDF9',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nama}
                        </span>
                        <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                          {item.kode}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {item.kab} • Kec. {item.kec} ({item.jenis})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {onPick && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onPick(item.kode) }}
                          className="btn-harvest btn-cream"
                          style={{ padding: '3px 6px', fontSize: 10 }}
                          title="Buka detail riwayat lokus ini"
                        >
                          Detail
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); flyToLokus(item) }}
                        className={`btn-harvest ${isIntervensi ? 'btn-green' : 'btn-wood'}`}
                        style={{ padding: '3px 6px', fontSize: 10 }}
                        title="Arahkan kamera peta ke titik ini"
                      >
                        📍
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
