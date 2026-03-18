import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import api from '../utils/api'
import './WeatherBar.css'

const WEATHERS = [
  { id: 'sunny', label: 'Sunny ☀️' },
  { id: 'rainy', label: 'Rainy 🌧️' },
  { id: 'hot', label: 'Hot 🌡️' },
  { id: 'cold', label: 'Cold 🧥' },
]

export default function WeatherBar() {
  const [weather, setWeather] = useState('sunny')
  const [data, setData] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const { add } = useCart()

  useEffect(() => { fetchSuggestions() }, [weather])

  const fetchSuggestions = async () => {
    try {
      const res = await api.get(`/ai/weather-suggestions?weather=${weather}`)
      setData(res.data)
      setDismissed(false)
    } catch (e) {}
  }

  if (dismissed || !data) return null

  return (
    <div className="weather-bar">
      <div className="weather-left">
        <div className="weather-tabs">
          {WEATHERS.map(w => (
            <button key={w.id} className={`w-tab ${weather === w.id ? 'active' : ''}`}
              onClick={() => setWeather(w.id)}>{w.label}</button>
          ))}
        </div>
        <p className="weather-msg">{data.message}</p>
      </div>
      <div className="weather-chips">
        {data.products.slice(0, 4).map(p => (
          <button key={p.id} className="weather-chip" onClick={() => { add(p) }}>
            + {p.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <button className="weather-close" onClick={() => setDismissed(true)}>✕</button>
    </div>
  )
}
