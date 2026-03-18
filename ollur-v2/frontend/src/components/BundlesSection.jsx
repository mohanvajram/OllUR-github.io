import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import api from '../utils/api'

export default function BundlesSection({ onToast }) {
  const [bundles, setBundles] = useState([])
  const { add } = useCart()

  useEffect(() => {
    api.get('/bundles').then(r => setBundles(r.data)).catch(() => {})
  }, [])

  const addBundle = (bundle) => {
    bundle.items.forEach(item => {
      add({ id: item.product_id, name: item.product_name, price: item.price,
            unit: 'pack', image_url: bundle.image_url, shop_id: bundle.shop_id || 1 }, item.quantity)
    })
    onToast(`${bundle.name} added to cart! 🎁`)
  }

  if (bundles.length === 0) return (
    <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
      <p style={{fontSize:40}}>🎁</p>
      <p>No bundles available right now. Shopkeeper will add festival deals soon!</p>
    </div>
  )

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,paddingBottom:40}}>
      {bundles.map(bundle => {
        const savings = bundle.original_price - bundle.bundle_price
        const pct = Math.round((savings / bundle.original_price) * 100)
        return (
          <div key={bundle.id} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
            <div style={{position:'relative'}}>
              <img src={bundle.image_url} alt={bundle.name}
                style={{width:'100%',height:140,objectFit:'cover'}}
                onError={e => e.target.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'} />
              <span style={{position:'absolute',top:10,right:10,background:'#ef4444',color:'#fff',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700}}>
                {pct}% OFF
              </span>
            </div>
            <div style={{padding:16}}>
              <h3 style={{fontSize:16,fontFamily:'var(--font-head)',marginBottom:4}}>{bundle.name}</h3>
              <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:10}}>{bundle.description}</p>
              <div style={{background:'var(--bg)',borderRadius:8,padding:'8px 12px',marginBottom:12}}>
                {bundle.items.map((item, i) => (
                  <div key={i} style={{fontSize:12,color:'var(--text-soft)',padding:'2px 0'}}>
                    • {item.product_name} ×{item.quantity}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <span style={{textDecoration:'line-through',color:'var(--text-muted)',fontSize:13}}>₹{bundle.original_price}</span>
                  <span style={{fontSize:20,fontWeight:800,color:'var(--green)',marginLeft:8}}>₹{bundle.bundle_price}</span>
                  <span style={{fontSize:12,color:'#ef4444',marginLeft:6}}>Save ₹{savings.toFixed(0)}</span>
                </div>
                <button className="btn btn-primary" style={{padding:'7px 16px',fontSize:13}} onClick={() => addBundle(bundle)}>
                  + Add
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
