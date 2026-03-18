import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api from '../utils/api'
import './GroupOrderPage.css'

export default function GroupOrderPage() {
  const { user } = useAuth()
  const { items: cartItems, total } = useCart()
  const [mode, setMode] = useState('hub') // hub | create | join | view
  const [code, setCode] = useState('')
  const [groupData, setGroupData] = useState(null)
  const [targetAmount, setTargetAmount] = useState(1000)
  const [myContribution, setMyContribution] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { setMyContribution(Math.round(total)) }, [total])

  const createGroup = async () => {
    if (!cartItems.length) { showToast('Add items to cart first!'); return }
    setLoading(true)
    try {
      const res = await api.post('/group-orders', {
        shop_id: cartItems[0]?.shop_id || 1,
        items: cartItems.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
        target_amount: targetAmount,
        my_contribution: myContribution
      })
      setResult(res.data)
      setMode('created')
    } catch (e) { showToast('Failed to create group order') }
    setLoading(false)
  }

  const joinGroup = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const viewRes = await api.get(`/group-orders/${code.trim().toUpperCase()}`)
      setGroupData(viewRes.data)
      setMode('view')
    } catch (e) { showToast('Group code not found. Check and try again.') }
    setLoading(false)
  }

  const confirmJoin = async () => {
    if (!cartItems.length) { showToast('Add items to cart first!'); return }
    setLoading(true)
    try {
      const res = await api.post('/group-orders/join', {
        code: groupData.code,
        items: cartItems.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
        contribution: myContribution
      })
      setResult(res.data)
      setMode('joined')
    } catch (e) { showToast('Failed to join group order') }
    setLoading(false)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const pct = groupData ? Math.min(100, Math.round((groupData.current_amount / groupData.target_amount) * 100)) : 0

  return (
    <div className="go-page">
      <div className="go-header">
        <h1>🤝 Mohalla Group Orders</h1>
        <p>Pool your neighbourhood's order to unlock bulk savings — everyone benefits!</p>
      </div>

      {mode === 'hub' && (
        <div className="go-hub">
          <div className="go-card" onClick={() => setMode('create')}>
            <span className="go-card-icon">🚀</span>
            <h3>Start a group order</h3>
            <p>Create a group, share the code with neighbours, and hit the savings target together.</p>
            <button className="btn btn-primary">Create Group</button>
          </div>
          <div className="go-card" onClick={() => setMode('join')}>
            <span className="go-card-icon">🔗</span>
            <h3>Join with a code</h3>
            <p>Got a group code from your neighbour? Enter it to join their order and add your items.</p>
            <button className="btn btn-ghost">Join Group</button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="go-form-wrap">
          <button className="back-btn" onClick={() => setMode('hub')}>← Back</button>
          <h2>Start a group order</h2>
          <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:20}}>
            Your cart has <strong>{cartItems.length} items</strong> worth <strong>₹{total.toFixed(0)}</strong>. Set a group target and invite your neighbours!
          </p>
          <div className="field">
            <label>Group savings target (₹)</label>
            <div className="target-row">
              {[500,1000,2000,5000].map(t => (
                <button key={t} className={`target-chip ${targetAmount===t?'active':''}`}
                  onClick={() => setTargetAmount(t)}>₹{t}</button>
              ))}
            </div>
            <input type="number" value={targetAmount} onChange={e => setTargetAmount(Number(e.target.value))}
              style={{marginTop:8}} />
          </div>
          <div className="field">
            <label>Your contribution (₹)</label>
            <input type="number" value={myContribution} onChange={e => setMyContribution(Number(e.target.value))} />
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Auto-filled from your cart total (₹{total.toFixed(0)})</p>
          </div>
          <button className="btn btn-primary go-submit" onClick={createGroup} disabled={loading || !cartItems.length}>
            {loading ? 'Creating...' : 'Create Group Order'}
          </button>
          {!cartItems.length && <p style={{fontSize:13,color:'#ef4444',marginTop:8}}>⚠️ Add items to your cart first!</p>}
        </div>
      )}

      {mode === 'created' && result && (
        <div className="go-success">
          <div className="go-success-icon">🎉</div>
          <h2>Group order created!</h2>
          <div className="go-code-box">
            <p>Share this code with your neighbours:</p>
            <span className="go-code">{result.code}</span>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(result.code); showToast('Code copied!') }}>
              📋 Copy Code
            </button>
          </div>
          <p style={{color:'var(--text-muted)',fontSize:14,marginTop:16}}>
            Once the group reaches ₹{targetAmount}, the order is confirmed. Share the code via WhatsApp with your mohalla!
          </p>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={() => setMode('hub')}>Back to Hub</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="go-form-wrap">
          <button className="back-btn" onClick={() => setMode('hub')}>← Back</button>
          <h2>Join a group order</h2>
          <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:20}}>Enter the code your neighbour shared with you.</p>
          <div className="field">
            <label>Group code</label>
            <input placeholder="e.g. GRP1234" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={{letterSpacing:'0.12em',fontWeight:600,fontSize:18,textTransform:'uppercase'}} />
          </div>
          <button className="btn btn-primary go-submit" onClick={joinGroup} disabled={loading || !code}>
            {loading ? 'Looking up...' : 'Find Group'}
          </button>
        </div>
      )}

      {mode === 'view' && groupData && (
        <div className="go-form-wrap">
          <button className="back-btn" onClick={() => setMode('join')}>← Back</button>
          <div className="go-group-info">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <h2>Group {groupData.code}</h2>
              <span className={`badge ${groupData.status==='reached'?'badge-green':'badge-gray'}`}>
                {groupData.status === 'reached' ? '🎯 Target reached!' : '⏳ Open'}
              </span>
            </div>
            <div className="go-progress-wrap">
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text-muted)',marginBottom:6}}>
                <span>₹{groupData.current_amount} collected</span>
                <span>Target: ₹{groupData.target_amount}</span>
              </div>
              <div className="wallet-progress-bar" style={{height:12}}>
                <div className="wallet-progress-fill" style={{width:pct+'%',background:'var(--green)'}}/>
              </div>
              <p style={{fontSize:13,color:'var(--green)',fontWeight:600,marginTop:6}}>{pct}% of target reached</p>
            </div>
            <div className="go-members">
              <h4 style={{fontSize:14,marginBottom:8}}>Members ({groupData.members?.length || 0})</h4>
              {groupData.members?.map((m,i) => (
                <div key={i} className="go-member-row">
                  <div className="khata-avatar" style={{width:32,height:32,fontSize:13}}>{m.name?.charAt(0)}</div>
                  <span style={{flex:1,fontSize:14}}>{m.name}</span>
                  <span style={{fontSize:14,fontWeight:600,color:'var(--green)'}}>₹{m.contribution}</span>
                </div>
              ))}
            </div>
          </div>
          {groupData.status !== 'reached' && (
            <>
              <div className="field" style={{marginTop:16}}>
                <label>Your contribution (₹)</label>
                <input type="number" value={myContribution} onChange={e => setMyContribution(Number(e.target.value))} />
              </div>
              <button className="btn btn-primary go-submit" onClick={confirmJoin} disabled={loading || !cartItems.length}>
                {loading ? 'Joining...' : 'Join & Add My Items'}
              </button>
              {!cartItems.length && <p style={{fontSize:13,color:'#ef4444',marginTop:8}}>⚠️ Add items to cart first!</p>}
            </>
          )}
        </div>
      )}

      {mode === 'joined' && result && (
        <div className="go-success">
          <div className="go-success-icon">🤝</div>
          <h2>You joined the group!</h2>
          <div className="go-progress-wrap" style={{maxWidth:400,margin:'20px auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:6}}>
              <span>₹{result.current} collected</span>
              <span>₹{result.target} target</span>
            </div>
            <div className="wallet-progress-bar" style={{height:12}}>
              <div className="wallet-progress-fill"
                style={{width:Math.min(100,(result.current/result.target)*100)+'%',background:'var(--green)'}}/>
            </div>
            {result.current >= result.target ? (
              <p style={{color:'var(--green)',fontWeight:700,marginTop:8,fontSize:15}}>🎯 Target reached! Order confirmed!</p>
            ) : (
              <p style={{color:'var(--text-muted)',fontSize:13,marginTop:8}}>
                ₹{result.target - result.current} more needed. Share the code to fill up!
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setMode('hub')}>Back to Hub</button>
        </div>
      )}

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
