import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 520, margin: '15vh auto', padding: 24, textAlign: 'center' }}>
          <div className="parchment-card" style={{ padding: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-farm)', color: '#5D4037', margin: '0 0 10px 0', fontSize: 18 }}>
              Terjadi Kendala Memuat Tampilan
            </h2>
            <p style={{ fontSize: 13, color: '#8C6239', lineHeight: 1.5, marginBottom: 16 }}>
              Aplikasi mendeteksi kendala pada cache peramban atau koneksi data.
            </p>
            <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 8, padding: 10, fontSize: 11, color: '#9A3412', textAlign: 'left', wordBreak: 'break-all', marginBottom: 16 }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('kie_mbg_user')
                window.location.reload()
              }}
              className="btn-harvest btn-green"
              style={{ padding: '8px 18px', fontSize: 13 }}
            >
              🔄 Reset Sesi & Muat Ulang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
