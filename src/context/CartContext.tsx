'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { CartDish, CartItem, MenuItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (dish: CartDish) => void
  updateQty: (dishId: string, delta: number) => void
  clearCart: () => void
  loadItems: (items: CartItem[]) => void
  getQty: (dishId: string) => number
  toMenuItems: () => MenuItem[]
  totalCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((dish: CartDish) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish.id === dish.id)
      if (existing) {
        return prev.map(i => i.dish.id === dish.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { dish, qty: 1 }]
    })
  }, [])

  const updateQty = useCallback((dishId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => i.dish.id === dishId ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const loadItems = useCallback((newItems: CartItem[]) => setItems(newItems), [])

  const getQty = (dishId: string) => items.find(i => i.dish.id === dishId)?.qty ?? 0

  const toMenuItems = (): MenuItem[] =>
    items.map(i => ({ dish_id: i.dish.id, qty: i.qty }))

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, clearCart, loadItems, getQty, toMenuItems, totalCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
