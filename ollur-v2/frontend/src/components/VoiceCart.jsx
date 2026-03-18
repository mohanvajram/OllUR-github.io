import { useState, useRef } from 'react'
import { useCart } from '../context/CartContext'
import api from '../utils/api'
import './Modal.css'

export default function VoiceCart({ onClose, onToast }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const { add } = useCart()
  const recogRef = useRef(null)

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Type your order below.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SR()
    recog.lang = 'en-IN'
    recog.continuous = false
    recog.interimResults = false
    recog.onstart = () => setListening(true)
    recog.onend = () => setListening(false)
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setText(transcript)
    }
    recog.start()
    recogRef.current = recog
  }

  const parse = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ai/voice-to-cart', { text })
      setResult(res.data)
    } catch (e) {}
    setLoading(false)
  }

  const addAll = () => {
    result.items.forEach(item => add(item, item.suggested_qty || 1))
    onToast(`${result.items.length} items added from voice order!`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>🎙️ Voice Order</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Speak or type your shopping list in English, Hindi, or Telugu. Works with quantities too!</p>
          <div style={{textAlign:'center',margin:'20px 0'}}>
            <button
              className={`mic-btn ${listening ? 'listening' : ''}`}
              onClick={listening ? () => recogRef.current?.stop() : startListening}
            >
              {listening ? '⏹ Stop' : '🎙️ Tap to Speak'}
            </button>
          </div>
          <p className="voice-hint">Examples: "2 kg rice, ek litre milk, do dozen bananas"</p>
          <textarea
            className="voice-textarea"
            placeholder="Or type your list here..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
          />
          <button className="btn btn-primary" style={{width:'100%',marginBottom:16}} onClick={parse} disabled={loading || !text}>
            {loading ? 'Parsing...' : 'Find Items'}
          </button>

          {result && (
            result.items.length === 0 ? (
              <p className="recipe-msg">No items found. Try: "2 kg rice, 1 litre milk"</p>
            ) : (
              <>
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
                <button className="btn btn-primary" style={{width:'100%',marginTop:12}} onClick={addAll}>
                  Add All to Cart 🛒
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
