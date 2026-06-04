/**
 * Funções helper para rastrear eventos de e-commerce
 *
 * Usa GTM dataLayer, que envia para GA4, Meta Pixel, etc.
 *
 * Exemplo de uso:
 *   import { trackAddToCart, trackPurchase } from '@/lib/analytics'
 *   trackAddToCart({ name: 'Peça XYZ', id: 123, price: 150, quantity: 1 })
 */

declare global {
  interface Window {
    dataLayer?: any[]
  }
}

/** Adicionar item ao carrinho */
export function trackAddToCart(item: {
  name: string
  id: number
  price: number
  quantity: number
  category?: string
}) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      items: [
        {
          item_name: item.name,
          item_id: String(item.id),
          price: item.price,
          quantity: item.quantity,
          item_category: item.category || 'Peças Automotivas',
        },
      ],
    },
  })
}

/** Remover item do carrinho */
export function trackRemoveFromCart(item: {
  name: string
  id: number
  price: number
  quantity: number
}) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'remove_from_cart',
    ecommerce: {
      items: [
        {
          item_name: item.name,
          item_id: String(item.id),
          price: item.price,
          quantity: item.quantity,
        },
      ],
    },
  })
}

/** Iniciar checkout */
export function trackBeginCheckout(value: number, items: Array<{ name: string; id: number; price: number; quantity: number }>) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      value,
      currency: 'BRL',
      items: items.map(i => ({
        item_name: i.name,
        item_id: String(i.id),
        price: i.price,
        quantity: i.quantity,
      })),
    },
  })
}

/** Compra concluída */
export function trackPurchase(data: {
  transactionId: number
  value: number
  shipping: number
  items: Array<{ name: string; id: number; price: number; quantity: number }>
}) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: String(data.transactionId),
      value: data.value,
      shipping: data.shipping,
      currency: 'BRL',
      items: data.items.map(i => ({
        item_name: i.name,
        item_id: String(i.id),
        price: i.price,
        quantity: i.quantity,
      })),
    },
  })
}

/** Visualização de produto */
export function trackViewItem(item: { name: string; id: number; price: number; category?: string }) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      items: [
        {
          item_name: item.name,
          item_id: String(item.id),
          price: item.price,
          item_category: item.category || 'Peças Automotivas',
        },
      ],
    },
  })
}

/** Busca interna */
export function trackSearch(searchTerm: string, resultsCount: number) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'search',
    search_term: searchTerm,
    results_count: resultsCount,
  })
}
