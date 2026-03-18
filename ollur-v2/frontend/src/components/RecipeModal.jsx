import { useState } from 'react'
import { useCart } from '../context/CartContext'
import api from '../utils/api'
import './Modal.css'

const RECIPES = ['biryani','dal','roti','chole','khichdi','upma','tea','poha']

export default function RecipeModal({ onClose, onToast }) {
  const [recipe, setRecipe] = useState('')
  const [servings, setServings] = useState(4)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { add } = useCart()

  const search = async () => {
    if (!recipe.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ai/recipe-to-cart', { recipe, servings })
      setResult(res.data)
    } catch (e) {}
    setLoading(false)
  }

  const addAll = () => {
    result.items.forEach(item => add(item, item.suggested_qty || 1))
    onToast(`${result.items.length} ingredients added to cart!`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>🍲 Recipe to Cart</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Type a recipe name and we'll add all ingredients to your cart automatically.</p>
          <div className="recipe-quick">
            {RECIPES.map(r => (
              <button key={r} className={`recipe-chip ${recipe===r?'active':''}`} onClick={() => setRecipe(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className="recipe-inputs">
            <input className="recipe-input" placeholder="Or type: biryani, dal, chole..."
              value={recipe} onChange={e => setRecipe(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} />
            <div className="servings-row">
              <label>Serves</label>
              <button onClick={() => setServings(s => Math.max(1,s-1))}>−</button>
              <span>{servings}</span>
              <button onClick={() => setServings(s => s+1)}>+</button>
            </div>
            <button className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? 'Finding...' : 'Find Ingredients'}
            </button>
          </div>

          {result && (
            <div className="recipe-result">
              {result.items.length === 0 ? (
                <p className="recipe-msg">{result.message}</p>
              ) : (
                <>
                  <p className="recipe-title">{result.message}</p>
                  <div className="recipe-items">
                    {result.items.map(item => (
                      <div key={item.id} className="recipe-item">
                        <img src={item.image_url} alt={item.name}
                          onError={e => e.target.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'} />
                        <div>
                          <strong>{item.name}</strong>
                          <span>Qty: {item.suggested_qty} {item.unit} · ₹{(item.price * (item.suggested_qty||1)).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="recipe-total">
                    Total: ₹{result.items.reduce((s,i) => s + i.price*(i.suggested_qty||1), 0).toFixed(0)}
                  </div>
                  <button className="btn btn-primary" style={{width:'100%',marginTop:12}} onClick={addAll}>
                    Add All to Cart 🛒
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
