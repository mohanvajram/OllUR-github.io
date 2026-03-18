import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './WhatsAppPage.css'

const EXAMPLES = [
  '2 kg rice, 1 litre milk, do dozen bananas',
  'ek kilo tomatoes, moong dal, bisleri water',
  'parle biscuits, haldiram bhujia, nescafe',
  '500g turmeric, garam masala, sunflower oil',
]

export default function WhatsAppPage() {
  const { user } = useAuth()
  const { add } = useCart()
  const [phone, setPhone] = useState(user?.phone || '')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chat, setChat] = useState([
    { from: 'bot', text: `👋 Welcome to OllUR Bot!\n\nSend your shopping list and I'll find everything for you.\n\nYou can mix English & Hindi:\n"2 kg rice, ek litre milk, do dozen bananas"` }
  ])
  const [toast, setToast] = useState('')

  const send = async () => {
    if (!message.trim()) return
    const userMsg = { from: 'user', text: message }
    setChat(prev => [...prev, userMsg])
    const sentMsg = message
    setMessage('')
    setLoading(true)
    try {
      const res = await api.post('/whatsapp/parse-order', { phone, message: sentMsg, shop_id: 1 })
      setResult(res.data)
      setChat(prev => [...prev, { from: 'bot', text: res.data.reply, items: res.data.items }])
    } catch (e) {
      setChat(prev => [...prev, { from: 'bot', text: "Sorry, something went wrong. Please try again." }])
    }
    setLoading(false)
  }

  const addToCart = () => {
    if (!result?.items) return
    result.items.forEach(item => add(item.product, item.quantity))
    setChat(prev => [...prev, { from: 'bot', text: `✅ Added ${result.items.length} items to your cart! Go to checkout to place your order.` }])
    setResult(null)
    setToast('Items added to cart!')
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="wa-page">
      <div className="wa-header">
        <h1>📱 WhatsApp Order Bot</h1>
        <p>Order like you text your local store — type naturally in English or Hindi</p>
      </div>

      <div className="wa-layout">
        <div className="wa-phone-frame">
          <div className="wa-top-bar">
            <div className="wa-avatar">R</div>
            <div>
              <strong>Ravi's OllUR Store</strong>
              <span>online</span>
            </div>
          </div>

          <div className="wa-chat">
            {chat.map((msg, i) => (
              <div key={i} className={`wa-bubble ${msg.from}`}>
                <p style={{whiteSpace:'pre-line'}}>{msg.text}</p>
                {msg.from === 'bot' && msg.items?.length > 0 && result && (
                  <button className="wa-cart-btn" onClick={addToCart}>
                    🛒 Add all to cart
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="wa-bubble bot">
                <span className="wa-typing">
                  <span/><span/><span/>
                </span>
              </div>
            )}
          </div>

          <div className="wa-input-row">
            <input
              placeholder="Type your order..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
            />
            <button className="wa-send" onClick={send} disabled={loading || !message}>
              ➤
            </button>
          </div>
        </div>

        <div className="wa-sidebar">
          <h3>Try these examples</h3>
          <p>Click to auto-fill the chat</p>
          <div className="wa-examples">
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="wa-example" onClick={() => setMessage(ex)}>
                {ex}
              </button>
            ))}
          </div>

          <div className="wa-info">
            <h4>How it works</h4>
            <div className="wa-step"><span>1</span><p>Type your shopping list naturally</p></div>
            <div className="wa-step"><span>2</span><p>Bot identifies and confirms items</p></div>
            <div className="wa-step"><span>3</span><p>Add confirmed items to cart</p></div>
            <div className="wa-step"><span>4</span><p>Checkout and choose delivery</p></div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
