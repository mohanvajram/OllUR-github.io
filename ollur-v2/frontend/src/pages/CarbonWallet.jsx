import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './CarbonWallet.css'

export default function CarbonWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [carbon, setCarbon] = useState(null)
  const [leaders, setLeaders] = useState([])
  const [alerts, setAlerts] = useState([])
  const [recurring, setRecurring] = useState([])
  const [tab, setTab] = useState('wallet')

  useEffect(() => {
    if (user?.role === 'customer') {
      api.get('/wallet').then(r => setWallet(r.data)).catch(() => {})
      api.get('/carbon/stats').then(r => setCarbon(r.data)).catch(() => {})
      api.get('/restock-alerts').then(r => setAlerts(r.data)).catch(() => {})
      api.get('/recurring-orders').then(r => setRecurring(r.data)).catch(() => {})
    }
    api.get('/leaderboard').then(r => setLeaders(r.data)).catch(() => {})
  }, [user])

  const cancelRecurring = async (id) => {
    await api.delete(`/recurring-orders/${id}`)
    setRecurring(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="cw-page">
      <div className="cw-tabs">
        <button className={`cw-tab ${tab==='wallet'?'active':''}`} onClick={() => setTab('wallet')}>💰 Savings Jar</button>
        <button className={`cw-tab ${tab==='carbon'?'active':''}`} onClick={() => setTab('carbon')}>🌱 Carbon Impact</button>
        <button className={`cw-tab ${tab==='leaders'?'active':''}`} onClick={() => setTab('leaders')}>🏆 Leaderboard</button>
        {user?.role === 'customer' && (
          <>
            <button className={`cw-tab ${tab==='recurring'?'active':''}`} onClick={() => setTab('recurring')}>⏰ Recurring</button>
            <button className={`cw-tab ${tab==='alerts'?'active':''}`} onClick={() => setTab('alerts')}>🔔 Alerts</button>
          </>
        )}
      </div>

      {tab === 'wallet' && wallet && (
        <div className="cw-section">
          <div className="wallet-hero">
            <div className="wallet-jar">🫙</div>
            <div>
              <p className="wallet-label">Your savings jar</p>
              <p className="wallet-balance">₹{wallet.balance.toFixed(2)}</p>
              <p className="wallet-sub">Total saved: ₹{wallet.total_saved.toFixed(2)} (from bill round-ups)</p>
            </div>
          </div>
          {wallet.coupon_available ? (
            <div className="coupon-card">
              <span className="coupon-icon">🎟️</span>
              <div>
                <strong>Coupon unlocked! ₹{wallet.coupon_value} off your next order</strong>
                <p>Your savings jar has ₹{wallet.balance.toFixed(0)}+ — redeem at checkout</p>
              </div>
            </div>
          ) : (
            <div className="wallet-progress-wrap">
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text-muted)',marginBottom:6}}>
                <span>Savings progress</span>
                <span>₹{wallet.balance.toFixed(0)} / ₹100 for coupon</span>
              </div>
              <div className="wallet-progress-bar">
                <div className="wallet-progress-fill" style={{width: Math.min(100, (wallet.balance/100)*100) + '%'}} />
              </div>
              <p style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>
                Every bill is rounded up to the nearest ₹10. The difference goes here!
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'carbon' && carbon && (
        <div className="cw-section">
          <div className="carbon-hero">
            <span style={{fontSize:56}}>🌍</span>
            <div>
              <h2>Your local shopping impact</h2>
              <p>By buying from your local kirana instead of large supermarkets, you're reducing carbon emissions.</p>
            </div>
          </div>
          <div className="carbon-stats">
            <div className="carbon-stat">
              <span className="carbon-num">{carbon.total_kg_saved.toFixed(1)}<small>kg CO₂</small></span>
              <span className="carbon-label">Carbon saved</span>
            </div>
            <div className="carbon-stat">
              <span className="carbon-num">{carbon.trees_equivalent.toFixed(2)}<small>trees</small></span>
              <span className="carbon-label">Equivalent</span>
            </div>
            <div className="carbon-stat">
              <span className="carbon-num">{carbon.km_equivalent.toFixed(0)}<small>km</small></span>
              <span className="carbon-label">Less transport</span>
            </div>
            <div className="carbon-stat">
              <span className="carbon-num">{carbon.orders}<small>orders</small></span>
              <span className="carbon-label">Local orders</span>
            </div>
          </div>
          <div className="carbon-tip">
            🌱 You've saved {carbon.total_kg_saved.toFixed(1)} kg of CO₂ — equivalent to planting {Math.max(1,Math.round(carbon.trees_equivalent))} tree{carbon.trees_equivalent >= 2 ? 's' : ''}!
          </div>
        </div>
      )}

      {tab === 'leaders' && (
        <div className="cw-section">
          <h2 style={{marginBottom:16}}>🏆 Top OllUR Shoppers This Month</h2>
          {leaders.length === 0 ? (
            <p style={{color:'var(--text-muted)'}}>No completed orders yet. Be the first!</p>
          ) : leaders.map((l, i) => (
            <div key={l.customer_id} className={`leader-row ${user?.id === l.customer_id ? 'me' : ''}`}>
              <span className="leader-rank">
                {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${l.rank}`}
              </span>
              <span className="leader-name">{l.name}{user?.id === l.customer_id ? ' (you)' : ''}</span>
              <span className="leader-orders">{l.order_count} orders</span>
              <span className="leader-spent">₹{Number(l.total_spent).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'recurring' && (
        <div className="cw-section">
          <h2 style={{marginBottom:16}}>⏰ Scheduled Orders</h2>
          {recurring.length === 0 ? (
            <p style={{color:'var(--text-muted)'}}>No recurring orders set. Add one at checkout!</p>
          ) : recurring.map(r => (
            <div key={r.id} className="recurring-card">
              <div>
                <strong style={{fontSize:14}}>{r.frequency} delivery</strong>
                <p style={{fontSize:12,color:'var(--text-muted)'}}>{r.items.length} items · {r.delivery_type.replace('_',' ')}</p>
                <p style={{fontSize:12,color:'var(--text-muted)'}}>{r.delivery_address}</p>
              </div>
              <button className="cancel-btn" onClick={() => cancelRecurring(r.id)}>Cancel</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="cw-section">
          <h2 style={{marginBottom:16}}>🔔 Restock Alerts</h2>
          {alerts.length === 0 ? (
            <p style={{color:'var(--text-muted)'}}>No alerts set. Tap 🔔 on out-of-stock items!</p>
          ) : alerts.map(a => (
            <div key={a.id} className="alert-row">
              <span>{a.product_name}</span>
              <span className={'badge ' + (a.stock > 0 ? 'badge-green' : 'badge-gray')}>
                {a.stock > 0 ? 'Back in stock!' : 'Still out of stock'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
