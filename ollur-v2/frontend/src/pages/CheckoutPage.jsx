import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const { items, total, update, remove, clear } = useCart()
  const { user } = useAuth()
  const nav = useNavigate()
  const [deliveryType, setDeliveryType] = useState('home_delivery')
  const [address, setAddress] = useState(user?.address || '')
  const [makeRecurring, setMakeRecurring] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [useWallet, setUseWallet] = useState(false)

  useState(() => {
    api.get('/wallet').then(r => setWallet(r.data)).catch(() => {})
  }, [])

  if (items.length === 0 && !success) return (
    <div className="checkout-empty">
      <span style={{fontSize:56}}>🛒</span>
      <h2>Your cart is empty</h2>
      <button className="btn btn-primary" onClick={() => nav('/')}>Browse Store</button>
    </div>
  )

  const deliveryFee = deliveryType === 'home_delivery' ? 30 : 0
  const walletDiscount = useWallet && wallet?.coupon_available ? wallet.coupon_value : 0
  const grandTotal = total + deliveryFee - walletDiscount
  const roundUp = Math.ceil(grandTotal / 10) * 10 - grandTotal
  const shopId = items[0]?.shop_id

  const placeOrder = async () => {
    if (deliveryType === 'home_delivery' && !address.trim()) { alert('Enter delivery address'); return }
    setLoading(true)
    try {
      const res = await api.post('/orders', {
        shop_id: shopId,
        items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
        total_amount: grandTotal,
        delivery_type: deliveryType,
        delivery_address: address
      })
      if (makeRecurring) {
        await api.post('/recurring-orders', {
          shop_id: shopId,
          items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
          frequency,
          delivery_type: deliveryType,
          delivery_address: address
        }).catch(() => {})
      }
      setOrderId(res.data.id); setSuccess(true); clear()
    } catch (e) { alert('Failed to place order. Please try again.') }
    setLoading(false)
  }

  if (success) return (
    <div className="checkout-success">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2>Order Placed!</h2>
        <p>Order <strong>#{orderId}</strong> confirmed.</p>
        <p className="success-sub">{deliveryType === 'home_delivery' ? '🚚 Delivering to your door!' : '🏪 Ready for pick up soon!'}</p>
        {makeRecurring && <p className="success-sub">⏰ Set up as a <strong>{frequency}</strong> recurring order!</p>}
        {roundUp > 0 && <p style={{fontSize:13,color:'var(--green)',marginTop:8}}>🫙 ₹{roundUp.toFixed(0)} added to your savings jar!</p>}
        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => nav('/orders')}>View Orders</button>
          <button className="btn btn-ghost" onClick={() => nav('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="checkout-page">
      <div className="checkout-left">
        <h2>Your Cart 🛒</h2>
        <div className="cart-list">
          {items.map(item => (
            <div key={item.product_id} className="cart-item">
              <img src={item.image_url||'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'} alt={item.product_name}
                onError={e=>e.target.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}/>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.product_name}</p>
                <p className="cart-item-price">₹{item.price} / {item.unit}</p>
              </div>
              <div className="cart-item-controls">
                <div className="qty-control">
                  <button onClick={() => update(item.product_id, item.quantity-1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => update(item.product_id, item.quantity+1)}>+</button>
                </div>
                <p className="cart-item-subtotal">₹{(item.price*item.quantity).toFixed(0)}</p>
                <button className="remove-btn" onClick={() => remove(item.product_id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-right">
        <div className="checkout-summary card">
          <h3>Order Summary</h3>

          <p className="section-label">Delivery option</p>
          <div className="delivery-options">
            <button className={`delivery-opt ${deliveryType==='home_delivery'?'active':''}`} onClick={() => setDeliveryType('home_delivery')}>
              <span className="opt-icon">🚚</span>
              <div><strong>Home Delivery</strong><p>+₹30 delivery fee</p></div>
            </button>
            <button className={`delivery-opt ${deliveryType==='pick_and_drop'?'active':''}`} onClick={() => setDeliveryType('pick_and_drop')}>
              <span className="opt-icon">🏪</span>
              <div><strong>Pick & Drop</strong><p>Free — collect yourself</p></div>
            </button>
          </div>

          {deliveryType === 'home_delivery' && (
            <div style={{marginTop:10}}>
              <label style={{fontSize:13,fontWeight:500,color:'var(--text-soft)',display:'block',marginBottom:5}}>Delivery Address</label>
              <textarea rows={2} placeholder="Enter full address..." value={address} onChange={e=>setAddress(e.target.value)}
                style={{width:'100%',padding:'9px 13px',borderRadius:'var(--radius-sm)',border:'1.5px solid var(--border)',fontSize:14,fontFamily:'var(--font-body)',resize:'none',outline:'none'}}/>
            </div>
          )}

          <div className="recurring-toggle" onClick={() => setMakeRecurring(!makeRecurring)}>
            <div>
              <strong>⏰ Make recurring?</strong>
              <p>Auto-order this every week or month</p>
            </div>
            <div className={`toggle-switch ${makeRecurring?'on':''}`}/>
          </div>

          {makeRecurring && (
            <div style={{display:'flex',gap:8,marginBottom:4}}>
              {['daily','weekly','monthly'].map(f => (
                <button key={f} onClick={() => setFrequency(f)}
                  style={{flex:1,padding:'7px 4px',borderRadius:'var(--radius-sm)',border:`1.5px solid ${frequency===f?'var(--green)':'var(--border)'}`,background:frequency===f?'var(--green-light)':'var(--bg)',color:frequency===f?'var(--green)':'var(--text-soft)',fontSize:12,fontWeight:500,cursor:'pointer',textTransform:'capitalize'}}>
                  {f}
                </button>
              ))}
            </div>
          )}

          {wallet?.coupon_available && (
            <div className="wallet-toggle" onClick={() => setUseWallet(!useWallet)}>
              <div>
                <strong>🫙 Use savings coupon</strong>
                <p>₹{wallet.coupon_value} off — from your savings jar</p>
              </div>
              <div className={`toggle-switch ${useWallet?'on':''}`}/>
            </div>
          )}

          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal ({items.reduce((s,i)=>s+i.quantity,0)} items)</span><span>₹{total.toFixed(0)}</span></div>
            <div className="summary-row"><span>Delivery fee</span><span className={deliveryFee===0?'free':''}>{deliveryFee===0?'Free':'₹30'}</span></div>
            {walletDiscount > 0 && <div className="summary-row"><span>🫙 Savings coupon</span><span className="free">−₹{walletDiscount}</span></div>}
            <div className="summary-row total"><span>Total</span><span>₹{grandTotal.toFixed(0)}</span></div>
            {roundUp > 0 && <div className="summary-row" style={{fontSize:12,color:'var(--green)'}}><span>🫙 Jar savings</span><span>+₹{roundUp.toFixed(0)}</span></div>}
          </div>

          <button className="btn btn-primary place-btn" onClick={placeOrder} disabled={loading}>
            {loading ? 'Placing...' : '🛒 Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
