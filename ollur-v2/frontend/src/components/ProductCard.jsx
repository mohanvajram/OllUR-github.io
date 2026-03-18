import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './ProductCard.css'

function getFreshness(harvestDate, freshnessDays) {
  if (!harvestDate || !freshnessDays) return null
  const daysOld = Math.floor((new Date() - new Date(harvestDate)) / 86400000)
  const daysLeft = freshnessDays - daysOld
  if (daysLeft <= 0) return { label: 'Expired', color: '#ef4444' }
  if (daysLeft === 1) return { label: 'Last day!', color: '#f59e0b' }
  if (daysLeft <= 3) return { label: daysLeft + 'd left', color: '#f59e0b' }
  return { label: 'Fresh ' + daysLeft + 'd', color: '#1a7a4a' }
}

export default function ProductCard({ product, onToast, onCartChange }) {
  const { add, items, update } = useCart()
  const { user } = useAuth()
  const [alertSet, setAlertSet] = useState(false)
  const cartItem = items.find(i => i.product_id === product.id)
  const freshness = getFreshness(product.harvest_date, product.freshness_days)

  const handleAdd = () => {
    add(product)
    onToast && onToast(product.name + ' added to cart!')
    onCartChange && onCartChange([...items, { product_id: product.id, product_name: product.name }])
  }

  const handleRestockAlert = async () => {
    try {
      await api.post('/restock-alerts', { product_id: product.id })
      setAlertSet(true)
      onToast && onToast('You will be notified when ' + product.name + ' is restocked!')
    } catch (e) {}
  }

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
          alt={product.name} className="product-img"
          onError={e => e.target.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'} />
        <span className={'stock-badge ' + (product.stock > 10 ? 'in' : product.stock > 0 ? 'low' : 'out')}>
          {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
        </span>
        {freshness && (
          <span className="freshness-badge" style={{background:freshness.color}}>🌱 {freshness.label}</span>
        )}
      </div>
      <div className="product-body">
        <p className="product-name">{product.name}</p>
        {product.description && <p className="product-desc">{product.description}</p>}
        <div className="product-footer">
          <div>
            <span className="product-price">₹{product.price}</span>
            <span className="product-unit"> / {product.unit}</span>
          </div>
          {user?.role === 'customer' && (
            product.stock === 0 ? (
              <button className="alert-btn" onClick={handleRestockAlert} disabled={alertSet}>
                {alertSet ? '🔔 Set' : '🔔 Alert'}
              </button>
            ) : cartItem ? (
              <div className="qty-control">
                <button onClick={() => update(product.id, cartItem.quantity - 1)}>−</button>
                <span>{cartItem.quantity}</span>
                <button onClick={() => update(product.id, cartItem.quantity + 1)}>+</button>
              </div>
            ) : (
              <button className="add-btn" onClick={handleAdd}>+ Add</button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
