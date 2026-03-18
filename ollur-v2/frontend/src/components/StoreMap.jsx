import { useState, useEffect } from 'react'
import api from '../utils/api'
import './Modal.css'

const CAT_COLORS = {
  rice_grains: '#fef3c7', dals_pulses: '#fde68a', snacks: '#fed7aa',
  spices_masala: '#fca5a5', oil_ghee: '#d1fae5', fresh_vegetables: '#a7f3d0',
  fresh_fruits: '#bbf7d0', dairy_eggs: '#bfdbfe', water_drinks: '#e0f2fe',
  juice_beverages: '#fce7f3', flour_atta: '#f3f4f6', household: '#e5e7eb',
}

export default function StoreMap({ onClose, category }) {
  const [mapData, setMapData] = useState(null)

  useEffect(() => {
    api.get('/store-map/1').then(r => setMapData(r.data)).catch(() => {})
  }, [])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-wide">
        <div className="modal-header">
          <h3>🗺️ Store Layout</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Find what you need — each zone shows where items are in the store.</p>
          {!mapData ? <div style={{textAlign:'center',padding:40}}><div className="spinner" style={{margin:'0 auto'}}/></div> : (
            <svg viewBox="0 0 560 230" width="100%" style={{border:'1px solid var(--border)',borderRadius:8,background:'#fafaf9'}}>
              {mapData.aisles.map(aisle => {
                const firstCat = aisle.categories[0]
                const isActive = category && aisle.categories.includes(category)
                const color = CAT_COLORS[firstCat] || '#f3f4f6'
                return (
                  <g key={aisle.id}>
                    <rect x={aisle.x} y={aisle.y} width={aisle.w} height={aisle.h} rx="6"
                      fill={color} stroke={isActive ? '#1a7a4a' : '#d1d5db'}
                      strokeWidth={isActive ? 2.5 : 1} />
                    <text x={aisle.x + aisle.w/2} y={aisle.y + aisle.h/2 - 6}
                      textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{aisle.label}</text>
                    <text x={aisle.x + aisle.w/2} y={aisle.y + aisle.h/2 + 8}
                      textAnchor="middle" fontSize="9" fill="#6b7280">
                      {aisle.categories.map(c => c.replace('_',' ')).join(', ')}
                    </text>
                  </g>
                )
              })}
              {/* Entrance */}
              <text x="275" y="220" textAnchor="middle" fontSize="11" fill="#6b7280">🚪 Entrance</text>
            </svg>
          )}
          {category && <p style={{marginTop:10,fontSize:13,color:'var(--green)',fontWeight:500}}>
            ✅ Highlighted: where to find <strong>{category.replace('_',' ')}</strong>
          </p>}
        </div>
      </div>
    </div>
  )
}
