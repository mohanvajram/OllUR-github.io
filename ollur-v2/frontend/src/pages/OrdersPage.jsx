import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './OrdersPage.css'

const STATUS_COLORS = {
  pending: 'badge-gray',
  confirmed: 'badge-green',
  ready: 'badge-orange',
  delivered: 'badge-green',
  cancelled: 'badge-gray',
}

const STATUS_LABELS = {
  pending: '⏳ Pending',
  confirmed: '✅ Confirmed',
  ready: '📦 Ready',
  delivered: '🚚 Delivered',
  cancelled: '❌ Cancelled',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my')
      setOrders(res.data)
    } catch (e) {}
    setLoading(false)
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (e) { alert('Failed to update status') }
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>{user?.role === 'shopkeeper' ? '📦 Incoming Orders' : '🧾 My Orders'}</h1>
        <p>{orders.length} {orders.length === 1 ? 'order' : 'orders'} found</p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <span style={{fontSize:48}}>📋</span>
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-top">
                <div>
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                </div>
                <div className="order-badges">
                  <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className={`badge ${order.delivery_type === 'home_delivery' ? 'badge-green' : 'badge-orange'}`}>
                    {order.delivery_type === 'home_delivery' ? '🚚 Home Delivery' : '🏪 Pick & Drop'}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span className="order-item-name">{item.product_name}</span>
                    <span className="order-item-qty">× {item.quantity}</span>
                    <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.delivery_address && (
                <p className="order-address">📍 {order.delivery_address}</p>
              )}

              <div className="order-bottom">
                <span className="order-total">Total: <strong>₹{order.total_amount.toFixed(2)}</strong></span>

                {user?.role === 'shopkeeper' && (
                  <div className="status-actions">
                    {['pending','confirmed','ready','delivered','cancelled']
                      .filter(s => s !== order.status)
                      .map(s => (
                        <button
                          key={s}
                          className={`status-btn ${s}`}
                          onClick={() => updateStatus(order.id, s)}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
