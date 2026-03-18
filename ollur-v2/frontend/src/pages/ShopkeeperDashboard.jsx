import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './ShopkeeperDashboard.css'

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

const EMPTY_FORM = { name:'', description:'', category:'rice_grains', price:'', unit:'kg', stock:'100', image_url:'', harvest_date:'', freshness_days:'' }

export default function ShopkeeperDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('analytics')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, oRes, aRes] = await Promise.all([
        api.get('/products', { params: { shop_id: user.id } }),
        api.get('/orders/my'),
        api.get('/analytics/shop')
      ])
      setProducts(pRes.data); setOrders(oRes.data); setAnalytics(aRes.data)
    } catch (e) {}
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (p) => {
    setForm({ name:p.name, description:p.description||'', category:p.category, price:p.price, unit:p.unit, stock:p.stock, image_url:p.image_url||'', harvest_date:p.harvest_date||'', freshness_days:p.freshness_days||'' })
    setEditId(p.id); setShowForm(true)
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), freshness_days: form.freshness_days ? parseInt(form.freshness_days) : null }
      editId ? await api.put(`/products/${editId}`, payload) : await api.post('/products', payload)
      showToast(editId ? 'Product updated!' : 'Product added!')
      setShowForm(false); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Save failed') }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    showToast('Deleted'); fetchAll()
  }

  const updateStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    showToast('Status updated!')
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1>🏪 {user?.name}</h1>
          <p className="dash-sub">Shopkeeper Dashboard</p>
        </div>
        {tab === 'products' && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>

      <div className="dash-tabs">
        {['analytics','products','orders'].map(t => (
          <button key={t} className={`dash-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t==='analytics'?'📊 Analytics':t==='products'?'📦 Products':'🛒 Orders'}
            {t==='orders' && orders.filter(o=>o.status==='pending').length > 0 && (
              <span className="tab-badge">{orders.filter(o=>o.status==='pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
      ) : tab === 'analytics' && analytics ? (
        <>
          <div className="stats-row">
            <div className="stat-card green"><span className="stat-num">₹{analytics.total_revenue.toLocaleString()}</span><span className="stat-label">Revenue delivered</span></div>
            <div className="stat-card orange"><span className="stat-num">{analytics.pending_orders}</span><span className="stat-label">Pending orders</span></div>
            <div className="stat-card"><span className="stat-num">{analytics.total_orders}</span><span className="stat-label">Total orders</span></div>
            <div className="stat-card"><span className="stat-num">{products.length}</span><span className="stat-label">Products listed</span></div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>🔥 Top selling items</h3>
              {analytics.top_items.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No sales yet</p> : (
                analytics.top_items.map((item, i) => (
                  <div key={i} className="top-item-row">
                    <span className="top-item-rank">#{i+1}</span>
                    <span className="top-item-name">{item.name}</span>
                    <div className="top-item-bar-wrap">
                      <div className="top-item-bar" style={{width: Math.round((item.count / (analytics.top_items[0]?.count||1)) * 100) + '%'}}/>
                    </div>
                    <span className="top-item-count">{item.count} sold</span>
                  </div>
                ))
              )}
            </div>

            <div className="analytics-card">
              <h3>📅 Recent daily revenue</h3>
              {analytics.daily.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No data yet</p> : (
                analytics.daily.map((d, i) => (
                  <div key={i} className="daily-row">
                    <span className="daily-date">{new Date(d.day).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                    <div className="daily-bar-wrap">
                      <div className="daily-bar" style={{width: Math.round((d.revenue / (analytics.daily.reduce((m,x)=>Math.max(m,x.revenue),1))) * 100) + '%'}}/>
                    </div>
                    <span className="daily-rev">₹{Math.round(d.revenue)}</span>
                    <span className="daily-orders">{d.count} orders</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : tab === 'products' ? (
        <div className="products-table-wrap card">
          {products.length === 0 ? (
            <div className="dash-empty"><p>No products. <button onClick={openAdd} style={{color:'var(--green)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Add first product →</button></p></div>
          ) : (
            <table className="products-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Freshness</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => {
                  const cat = CATEGORIES.find(c => c.id === p.category)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="prod-name-cell">
                          <img src={p.image_url||'https://images.unsplash.com/photo-1542838132-92c53300491e?w=50'} alt={p.name}
                            onError={e=>e.target.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=50'}/>
                          <div><strong>{p.name}</strong>{p.description&&<span>{p.description}</span>}</div>
                        </div>
                      </td>
                      <td><span className="badge badge-green">{cat?.icon} {cat?.label}</span></td>
                      <td><strong style={{color:'var(--green)'}}>₹{p.price}</strong><span style={{fontSize:11,color:'var(--text-muted)',marginLeft:4}}>/{p.unit}</span></td>
                      <td><span className={`badge ${p.stock>10?'badge-green':p.stock>0?'badge-orange':'badge-gray'}`}>{p.stock}</span></td>
                      <td>{p.freshness_days ? <span className="badge badge-green">🌱 {p.freshness_days}d</span> : <span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="tbl-btn edit" onClick={() => openEdit(p)}>✏️</button>
                          <button className="tbl-btn del" onClick={() => deleteProduct(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {orders.length === 0 ? <div className="dash-empty"><p>No orders yet.</p></div> : orders.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-top">
                <div>
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <span className={`badge ${order.status==='delivered'?'badge-green':order.status==='pending'?'badge-gray':'badge-orange'}`}>{order.status}</span>
                  <span className={`badge ${order.delivery_type==='home_delivery'?'badge-green':'badge-orange'}`}>{order.delivery_type==='home_delivery'?'🚚 Delivery':'🏪 Pick & Drop'}</span>
                  {order.carbon_saved > 0 && <span className="badge badge-green">🌱 {order.carbon_saved}kg CO₂</span>}
                </div>
              </div>
              <div className="order-items-mini">
                {order.items.map((item,i) => <span key={i}>{item.product_name} ×{item.quantity}</span>)}
              </div>
              {order.delivery_address && <p className="order-address">📍 {order.delivery_address}</p>}
              <div className="order-bottom">
                <strong style={{color:'var(--green)'}}>₹{order.total_amount.toFixed(2)}</strong>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {['confirmed','ready','delivered','cancelled'].filter(s=>s!==order.status).map(s=>(
                    <button key={s} onClick={() => updateStatus(order.id, s)}
                      style={{padding:'5px 12px',borderRadius:'99px',border:'1.5px solid var(--border)',fontSize:12,background:'var(--white)',cursor:'pointer',color:'var(--text-soft)'}}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowForm(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={saveProduct} className="product-form">
              <div className="form-row">
                <div className="field"><label>Product Name *</label><input value={form.name} onChange={set('name')} placeholder="e.g. Sona Masoori Rice" required /></div>
                <div className="field"><label>Category *</label>
                  <select value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label>Description</label><input value={form.description} onChange={set('description')} placeholder="Short description..." /></div>
              <div className="form-row">
                <div className="field"><label>Price (₹) *</label><input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="58.00" required /></div>
                <div className="field"><label>Unit *</label>
                  <select value={form.unit} onChange={set('unit')}>
                    {['kg','g','litre','ml','pack','bottle','dozen','bunch','piece','bar','250g','100g','jar'].map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="field"><label>Stock *</label><input type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="100" required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Harvest date <span style={{fontSize:11,color:'var(--text-muted)'}}>(fresh items)</span></label><input type="date" value={form.harvest_date} onChange={set('harvest_date')} /></div>
                <div className="field"><label>Freshness (days)</label><input type="number" min="1" value={form.freshness_days} onChange={set('freshness_days')} placeholder="e.g. 3" /></div>
              </div>
              <div className="field"><label>Image URL</label><input value={form.image_url} onChange={set('image_url')} placeholder="https://images.unsplash.com/..." /></div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
