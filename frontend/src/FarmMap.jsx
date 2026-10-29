import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

export default function FarmMap({ lokusList = [] }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const baseLayersRef = useRef({})

  const [activeLayer, setActiveLayer] = useState('osm')
  const [filterKelompok, setFilterKelompok] = useState('all')
  const [selectedLokus, setSelectedLokus] = useState(null)

  // Default center: Lombok Barat (Gerung, Kediri, Lembar, Sekotong, Narmada)
  const defaultCenter = [-8.70, 116.12]

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return // Avoid re-initialization

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: true
    })
    mapInstanceRef.current = map

    // 1. OpenStreetMap Tile Layer
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
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

  // Switch Base Layer
  const switchLayer = (type) => {
    const map = mapInstanceRef.current
    if (!map) return
    Object.values(baseLayersRef.current).forEach(layer => map.removeLayer(layer))
    if (baseLayersRef.current[type]) {
      baseLayersRef.current[type].addTo(map)
      setActiveLayer(type)
    }
  }

  // Create custom farm icons
  const createFarmIcon = (bg, emoji) => {
    return L.divIcon({
      className: 'farm-marker-pin',
      html: `<div style="
        background: ${bg};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid #FFFDF7;
        box-shadow: 0 4px 8px rgba(78, 52, 46, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">${emoji}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    })
  }

  const iconIntervensi = createFarmIcon('#4CAF50', '🌱')
  const iconKontrol = createFarmIcon('#8D6E63', '🏡')

  // Render markers whenever lokusList or filterKelompok changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersGroup = markersLayerRef.current
    if (!map || !markersGroup) return

    markersGroup.clearLayers()

    const filtered = lokusList.filter(item => {
      if (filterKelompok === 'all') return true
      return String(item.kelompok || item.kel || '').toLowerCase() === filterKelompok.toLowerCase()
    })

    filtered.forEach(item => {
      const lat = parseFloat(item.lat)
      const lng = parseFloat(item.lng)
      if (isNaN(lat) || isNaN(lng)) return

      const isIntervensi = String(item.kelompok || item.kel || '').toLowerCase() === 'intervensi'
      const icon = isIntervensi ? iconIntervensi : iconKontrol

      const marker = L.marker([lat, lng], { icon })

      const gmapsLink = `https://www.google.com/maps?q=${lat},${lng}`
      const popupHtml = `
        <div style="font-family: var(--font-body); min-width: 210px; color: #43281C;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; background: ${isIntervensi ? '#E8F5E9' : '#EFEBE9'}; color: ${isIntervensi ? '#2E7D32' : '#4E342E'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isIntervensi ? '#A5D6A7' : '#BCAAA4'};">
              ${item.kode || 'LOKUS'} • ${isIntervensi ? 'Intervensi MBG' : 'Kontrol'}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #5D4037;">${item.nama}</h4>
          <p style="margin: 2px 0; font-size: 12px; color: #6D4C41;">📍 Kec. <strong>${item.kec || '-'}</strong>, ${item.kab || 'Lombok Barat'}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #6D4C41;">👩‍⚕️ Kader: <strong>${item.kader || item.hp ? `${item.kader || ''} (${item.hp || ''})` : 'Kader Desa'}</strong></p>
          <p style="margin: 2px 0; font-size: 12px; color: #6D4C41;">🌻 Komitmen: <strong>${String(item.komitmen || '').toLowerCase() === 'ada' ? 'Lengkap (Ada)' : 'Belum Lengkap'}</strong></p>
          <p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace; color: #8D6E63;">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #D7C29E; text-align: right;">
            <a href="${gmapsLink}" target="_blank" rel="noreferrer" style="color: #2E7D32; font-weight: 700; text-decoration: none; font-size: 11px;">
              Buka di Google Maps ↗
            </a>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
      marker.addTo(markersGroup)
      item._marker = marker
    })
  }, [lokusList, filterKelompok])

  const flyToLokus = (item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lng)
    if (isNaN(lat) || isNaN(lng)) return
    setSelectedLokus(item.kode)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 })
      if (item._marker) {
        setTimeout(() => item._marker.openPopup(), 1200)
      }
    }
  }

  const resetView = () => {
    setSelectedLokus(null)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(defaultCenter, 11, { duration: 1.0 })
    }
  }

  const filteredList = lokusList.filter(item => {
    if (filterKelompok === 'all') return true
    return String(item.kelompok || item.kel || '').toLowerCase() === filterKelompok.toLowerCase()
  })

  return (
    <div className="parchment-card" style={{ padding: 18, marginTop: 12 }}>
      
      {/* Top Map Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #EADCC2' }}>
        
        {/* Layer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5D4037' }}>Lapisan Peta:</span>
          <div style={{ display: 'inline-flex', background: '#F0E4CE', borderRadius: 10, padding: 3, border: '1px solid #D7C29E' }}>
            <button
              onClick={() => switchLayer('osm')}
              className={`btn-harvest ${activeLayer === 'osm' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              🗺️ Jalan (OSM)
            </button>
            <button
              onClick={() => switchLayer('sat')}
              className={`btn-harvest ${activeLayer === 'sat' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              🛰️ Citra Satelit
            </button>
            <button
              onClick={() => switchLayer('voyager')}
              className={`btn-harvest ${activeLayer === 'voyager' ? 'btn-green' : 'btn-cream'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              🏙️ Peta Bersih
            </button>
          </div>
        </div>

        {/* Filter Intervensi vs Kontrol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5D4037' }}>Filter:</span>
          <button
            onClick={() => setFilterKelompok('all')}
            className={`btn-harvest ${filterKelompok === 'all' ? 'btn-wood' : 'btn-cream'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            Semua ({lokusList.length})
          </button>
          <button
            onClick={() => setFilterKelompok('intervensi')}
            className={`btn-harvest ${filterKelompok === 'intervensi' ? 'btn-green' : 'btn-cream'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            🌱 Intervensi ({lokusList.filter(x => String(x.kelompok || x.kel).toLowerCase() === 'intervensi').length})
          </button>
          <button
            onClick={() => setFilterKelompok('kontrol')}
            className={`btn-harvest ${filterKelompok === 'kontrol' ? 'btn-wood' : 'btn-cream'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            🏡 Kontrol ({lokusList.filter(x => String(x.kelompok || x.kel).toLowerCase() === 'kontrol').length})
          </button>
          
          <button
            onClick={resetView}
            className="btn-harvest btn-gold"
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            🎯 Pusat Lombok
          </button>
        </div>

      </div>

      {/* Main Split: Leaflet Map (Left) & Lokus Directory (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        
        {/* Leaflet Container */}
        <div style={{ position: 'relative' }}>
          <div ref={mapContainerRef} className="farm-map-wrapper" style={{ height: 480 }} />

          {/* Floating Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 400,
            background: 'rgba(255, 253, 249, 0.94)',
            border: '2px solid #D7C29E',
            borderRadius: 12,
            padding: '8px 12px',
            fontSize: 11,
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontWeight: 800, color: '#5D4037', marginBottom: 4 }}>LEGENDA LOKUS MBG</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#4CAF50' }}></span>
              <span>🌱 Lokus Intervensi MBG (Sekolah/Posyandu)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#8D6E63' }}></span>
              <span>🏡 Lokus Kontrol (Pembanding N-Gain)</span>
            </div>
          </div>
        </div>

        {/* Right Lokus List with FlyTo */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-farm)', color: '#5D4037', fontSize: 15 }}>
              🌾 Sebaran Lokus di Lembah Lombok
            </h4>
            <span className="farm-badge badge-wood">{filteredList.length} Titik</span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#8C6239' }}>
            Klik lokus untuk mengarahkan peta ke koordinat titik:
          </p>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredList.map((item, idx) => {
              const isIntervensi = String(item.kelompok || item.kel || '').toLowerCase() === 'intervensi'
              const isSelected = selectedLokus === item.kode
              return (
                <div
                  key={item.kode || idx}
                  onClick={() => flyToLokus(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #4CAF50' : '1.5px solid #E6D5B8',
                    background: isSelected ? '#E8F5E9' : '#FFFDF9',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#43281C' }}>{item.nama}</span>
                      <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`} style={{ fontSize: 9 }}>
                        {item.kode}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8C6239', marginTop: 2 }}>
                      Kec. {item.kec} • Kader: {item.kader || 'Kader MBG'}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#A1887F', marginTop: 1 }}>
                      {parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lng).toFixed(4)}
                    </div>
                  </div>
                  <button
                    className={`btn-harvest ${isIntervensi ? 'btn-green' : 'btn-wood'}`}
                    style={{ padding: '4px 8px', fontSize: 10 }}
                  >
                    📍 Arahkan
                  </button>
                </div>
              )
            })}
          </div>

        </div>

      </div>

    </div>
  )
}
