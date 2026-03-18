import { createContext, useContext, useState } from 'react'

const CartCtx = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const add = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + qty }
          : i)
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        unit: product.unit,
        image_url: product.image_url,
        shop_id: product.shop_id,
        quantity: qty
      }]
    })
  }

  const remove = (product_id) => setItems(prev => prev.filter(i => i.product_id !== product_id))

  const update = (product_id, qty) => {
    if (qty <= 0) return remove(product_id)
    setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i))
  }

  const clear = () => setItems([])

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartCtx.Provider value={{ items, add, remove, update, clear, total, count }}>
      {children}
    </CartCtx.Provider>
  )
}

export const useCart = () => useContext(CartCtx)
