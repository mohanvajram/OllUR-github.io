import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './KhataPage.css'

export default function KhataPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState([])
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ customer_id: '', amount: '', note: '', type: 'credit' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [view, setView] = useState('summary') // summary | entries | add

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [eRes] = await Promise.all([api.get('/khata')])
      setEntries(eRes.data)
      if (user?.role === 'shopkeeper') {
        const [sRes, cRes] = await Promise.all([
          api.get('/khata/summary'),
          api.get('/shops') // reuse to get customer list via orders
        ])
        setSummary(sRes.data)
        // get customers from orders
        const oRes = await api.get('/orders/my')
        const custMap = {}
        oRes.data.forEach(o => { if (!custMap[o.customer_id]) custMap[o.customer_id] = true })
        setCustomers(Object.keys(custMap))
      }
    } catch (e) {}
    setLoading(false)
  }

  const addEntry = async (e) => {
    e.preventDefault()
    try {
      await api.post('/khata', { ...form, amount: parseFloat(form.amount), customer_id: parseInt(form.customer_id) })
      showToast('Khata entry added!')
      setForm({ customer_id: '', amount: '', note: '', type: 'credit' })
      fetchData()
      setView('entries')
    } catch (err) { showToast('Failed to add entry') }
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const totalBalance = summary.reduce((s, c) => s + (c.balance || 0), 0)

  return (
    <div className="khata-page">
      <div className="khata-header">
        <div>
          <h1>🧾 {user?.role === 'shopkeeper' ? 'Digital Khata' : 'My Credit Book'}</h1>
          <p className="khata-sub">
            {user?.role === 'shopkeeper'
              ? 'Track credit given to trusted customers'
              : 'Your credit history with the store'}
          </p>
        </div>
        {user?.role === 'shopkeeper' && (
          <button className="btn btn-primary" onClick={() => setView('add')}>+ Add Entry</button>
        )}
      </div>

      {user?.role === 'shopkeeper' && (
        <div className="khata-stats">
          <div className="kstat">
            <span className="kstat-num">₹{Math.abs(totalBalance).toFixed(0)}</span>
            <span className="kstat-label">{totalBalance >= 0 ? 'Total credit given' : 'Total received'}</span>
          </div>
          <div className="kstat">
            <span className="kstat-num">{summary.length}</span>
            <span className="kstat-label">Customers with credit</span>
          </div>
          <div className="kstat">
            <span className="kstat-num">{summary.filter(c => (c.balance||0) > 0).length}</span>
            <span className="kstat-label">Outstanding balances</span>
          </div>
        </div>
      )}

      <div className="khata-tabs">
        {user?.role === 'shopkeeper' && (
          <button className={`cw-tab ${view==='summary'?'active':''}`} onClick={() => setView('summary')}>
            👥 By Customer
          </button>
        )}
        <button className={`cw-tab ${view==='entries'?'active':''}`} onClick={() => setView('entries')}>
          📋 All Entries
        </button>
        {user?.role === 'shopkeeper' && (
          <button className={`cw-tab ${view==='add'?'active':''}`} onClick={() => setView('add')}>
            ➕ Add Entry
          </button>
        )}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
      ) : view === 'summary' && user?.role === 'shopkeeper' ? (
        <div className="khata-list">
          {summary.length === 0 ? (
            <div className="khata-empty">No credit entries yet. Add your first khata entry!</div>
          ) : summary.map(c => (
            <div key={c.customer_id} className="khata-customer-card">
              <div className="khata-avatar">{c.name?.charAt(0).toUpperCase()}</div>
              <div className="khata-info">
                <strong>{c.name}</strong>
                <span>{c.phone}</span>
              </div>
              <div className={`khata-balance ${c.balance > 0 ? 'owed' : 'clear'}`}>
                {c.balance > 0 ? `Owes ₹${c.balance.toFixed(0)}` : c.balance < 0 ? `Overpaid ₹${Math.abs(c.balance).toFixed(0)}` : '✅ Clear'}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'entries' ? (
        <div className="khata-list">
          {entries.length === 0 ? (
            <div className="khata-empty">No entries yet.</div>
          ) : entries.map(e => (
            <div key={e.id} className="khata-entry">
              <div className={`entry-type-dot ${e.type}`} />
              <div className="entry-info">
                <strong>{user?.role === 'shopkeeper' ? e.customer_name : e.shop_name}</strong>
                <span>{e.note || (e.type === 'credit' ? 'Credit given' : 'Payment received')}</span>
                <span className="entry-date">{new Date(e.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
              <div className={`entry-amount ${e.type}`}>
                {e.type === 'credit' ? '+' : '-'}₹{e.amount.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'add' && user?.role === 'shopkeeper' ? (
        <div className="khata-form-wrap">
          <form className="khata-form" onSubmit={addEntry}>
            <div className="field">
              <label>Customer ID</label>
              <input type="number" placeholder="Enter customer ID (from orders)"
                value={form.customer_id} onChange={e => setForm(f => ({...f, customer_id: e.target.value}))} required />
              <p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Tip: Find customer IDs in the Orders tab</p>
            </div>
            <div className="field">
              <label>Type</label>
              <div className="type-toggle">
                <button type="button" className={`type-btn ${form.type==='credit'?'active':''}`}
                  onClick={() => setForm(f=>({...f,type:'credit'}))}>💳 Credit given</button>
                <button type="button" className={`type-btn ${form.type==='payment'?'active':''}`}
                  onClick={() => setForm(f=>({...f,type:'payment'}))}>✅ Payment received</button>
              </div>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" min="0" placeholder="250.00"
                value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} required />
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input placeholder="e.g. Monthly grocery credit"
                value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} />
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="button" className="btn btn-ghost" onClick={() => setView('summary')}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{flex:1}}>Save Khata Entry</button>
            </div>
          </form>
        </div>
      ) : null}

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
