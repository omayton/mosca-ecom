"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"

export interface CartItem {
  productId: number
  name: string
  price: number
  imageFile: string
  quantity: number
  slug: string
  weight?: string
  dimensions?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  loaded: boolean
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = "mosca-cart"

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSyncDone = useRef(false)
  const clearedRef = useRef(false)

  useEffect(() => {
    const localItems = loadFromStorage()

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(async (user) => {
        if (user?.id) {
          setIsLoggedIn(true)
          try {
            const res = await fetch("/api/cart")
            if (res.ok) {
              const data = await res.json()
              const serverItems: CartItem[] = data.items || []

              if (serverItems.length > 0) {
                const merged = [...serverItems]
                for (const localItem of localItems) {
                  if (!merged.find((s) => s.productId === localItem.productId)) {
                    merged.push(localItem)
                  }
                }
                setItems(merged)
                saveToStorage(merged)
              } else if (localItems.length > 0) {
                setItems(localItems)
                await fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: localItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
                })
              }
            } else {
              setItems(localItems)
            }
          } catch {
            setItems(localItems)
          }
        } else {
          setItems(localItems)
        }
        initialSyncDone.current = true
        setLoaded(true)
      })
      .catch(() => {
        setItems(localItems)
        initialSyncDone.current = true
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (!loaded) return
    saveToStorage(items)

    if (!isLoggedIn || !initialSyncDone.current) return
    // Skip sync if tab is hidden (prevents multi-tab overwriting each other's carts)
    if (typeof document !== "undefined" && document.hidden) return
    // A new mutation means the cart is no longer "cleared"
    clearedRef.current = false

    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      // Abort if cleared while debouncing (prevents cart resurrection after checkout)
      if (clearedRef.current) return
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
      }).catch(() => {})
    }, 1000)
  }, [items, loaded, isLoggedIn])

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => {
    clearedRef.current = true
    if (syncTimer.current) clearTimeout(syncTimer.current)
    setItems([])
    if (isLoggedIn) {
      fetch("/api/cart", { method: "DELETE" }).catch(() => {})
    }
  }, [isLoggedIn])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen, loaded }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
