"use client"

import { useEffect } from "react"
import { trackViewItem } from "@/lib/analytics"

interface ProductTrackerProps {
  name: string
  id: number
  price: number
  category?: string
}

/** Rastreia visualização de produto quando a página carrega */
export function ProductTracker({ name, id, price, category }: ProductTrackerProps) {
  useEffect(() => {
    trackViewItem({ name, id, price, category })
  }, [name, id, price, category])

  return null
}
