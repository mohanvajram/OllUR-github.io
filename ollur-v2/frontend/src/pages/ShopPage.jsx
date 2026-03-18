import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import StoreMap from '../components/StoreMap'
import RecipeModal from '../components/RecipeModal'
import VoiceCart from '../components/VoiceCart'
import WeatherBar from '../components/WeatherBar'
import BundlesSection from '../components/BundlesSection'
import './ShopPage.css'

const CATEGORIES = [
  { id: 'rice_grains', label: 'Rice & Grains', icon: '🌾' },
  { id: 'dals_pulses', label: 'Dals & Pulses', icon: '🫘' },
  { id: 'snacks', label: 'Snacks', icon: '🍿' },
  { id: 'water_drinks', label: 'Water & Drinks', icon: '💧' },
  { id: 'juice_beverages', label: 'Juice & Beverages', icon: '🧃' },
  { id: 'fresh_vegetables', label: 'Fresh Vegetables', icon: '🥦' },
  { id: 'fresh_fruits', label: 'Fresh Fruits', icon: '🍎' },
  { id: 'dairy_eggs', label: 'Dairy & Eggs', icon: '🥛' },
  { id: 'spices_masala', label: 'Spices & Masala', icon: '🌶️' },
  { id: 'oil_ghee', label: 'Oil & Ghee', icon: '🫙' },
  { id: 'flour_atta', label: 'Flour & Atta', icon: '🌿' },
  { id: 'household', label: 'Household', icon: '🧹' },
]

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [showRecipe, setShowRecipe] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [tab, setTab] = useState('shop') // shop | bundles

  useEffect(() => { fetchProducts() }, [category, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (category) params.category = category
      if (search) params.search = search
      const res = await api.get('/products', { params })
      setProducts(res.data)
    } catch (e) {}
    setLoading(false)
  }

  const fetchSuggestions = async (cartItems) => {
    if (!cartItems?.length) return
    try {
      const res = await api.post('/ai/suggestions', { cart_items: cartItems })
      setSuggestions(res.data)
    } catch (e) {}
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const grouped = category
    ? { [category]: products }
    : products.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = []
        acc[p.category].push(p)
        return acc
      }, {})

  const getCat = (id) => CATEGORIES.find(c => c.id === id)

  return (
    <div className="shop-page">
      <WeatherBar />
      <div className="shop-hero">
        <div className="hero-content">
          <h1>Your <span className="hero-accent">Local Store</span>,<br/>Delivered to Your Door 🚪</h1>
          <p>Fresh groceries from your neighbourhood kirana — pick up or get delivered</p>
          <div className="hero-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search rice, dal, snacks..." value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && <button className="clear-search" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="hero-actions">
            <button className="hero-btn" onClick={() => setShowRecipe(true)}>🍲 Recipe to Cart</button>
            <button className="hero-btn" onClick={() => setShowVoice(true)}>🎙️ Voice Order</button>
            <button className="hero-btn" onClick={() => setShowMap(true)}>🗺️ Store Map</button>
          </div>
        </div>
        <div className="hero-visual">🛒</div>
      </div>

      <div className="shop-tabs">
        <button className={`shop-tab ${tab==='shop'?'active':''}`} onClick={() => setTab('shop')}>🛒 All Products</button>
        <button className={`shop-tab ${tab==='bundles'?'active':''}`} onClick={() => setTab('bundles')}>🎁 Festival Bundles</button>
      </div>

      {tab === 'bundles' ? (
        <BundlesSection onToast={showToast} />
      ) : (
        <>
          <div className="category-strip">
            <button className={`cat-pill ${!category ? 'active' : ''}`} onClick={() => setCategory(null)}>🏪 All Items</button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-pill ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(category === c.id ? null : c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions-bar">
              <span className="sugg-label">🧠 AI suggests adding:</span>
              {suggestions.map(p => (
                <span key={p.id} className="sugg-chip">{p.name} ₹{p.price}</span>
              ))}
            </div>
          )}

          <div className="shop-content">
            {loading ? (
              <div className="loading-state"><div className="spinner"/><p>Loading products...</p></div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span style={{fontSize:48}}>🔍</span>
                <p>No products found</p>
                <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategory(null) }}>Clear filters</button>
              </div>
            ) : (
              Object.entries(grouped).map(([catId, prods]) => {
                const cat = getCat(catId)
                return (
                  <section key={catId} className="category-section">
                    <div className="category-heading">
                      <span className="cat-icon">{cat?.icon || '📦'}</span>
                      <h2>{cat?.label || catId}</h2>
                      <span className="cat-count">{prods.length} items</span>
                    </div>
                    <div className="product-grid">
                      {prods.map(p => (
                        <ProductCard key={p.id} product={p} onToast={showToast} onCartChange={fetchSuggestions} />
                      ))}
                    </div>
                  </section>
                )
              })
            )}
          </div>
        </>
      )}

      {showMap && <StoreMap onClose={() => setShowMap(false)} category={category} />}
      {showRecipe && <RecipeModal onClose={() => setShowRecipe(false)} onToast={showToast} />}
      {showVoice && <VoiceCart onClose={() => setShowVoice(false)} onToast={showToast} />}
      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
