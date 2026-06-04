"use client"

import Script from "next/script"

/**
 * Analytics: Google Analytics 4 + Vercel Web Analytics + Speed Insights
 *
 * GA4 Measurement ID: G-5CRHKEJH7F
 * Vercel Analytics: carrega automaticamente quando hospedado na Vercel
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-5CRHKEJH7F"

export function Analytics() {
  return (
    <>
      {/* Google Analytics 4 (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_title: document.title,
              send_page_view: true
            });
          `,
        }}
      />

      {/* Vercel Web Analytics (privacy-friendly, no cookies) */}
      <Script
        src="/_vercel/insights/script.js"
        strategy="afterInteractive"
      />

      {/* Vercel Speed Insights */}
      <Script
        src="/_vercel/speed-insights/script.js"
        strategy="afterInteractive"
      />
    </>
  )
}

/**
 * Track custom events to GA4.
 * Use para e-commerce: add_to_cart, purchase, view_item, etc.
 */
export function trackEvent(event: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, data)
  }
}

/**
 * Track e-commerce: adicionar ao carrinho
 */
export function trackAddToCart(item: { id: number; name: string; price: number; quantity: number }) {
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: item.price * item.quantity,
    items: [{ item_id: String(item.id), item_name: item.name, price: item.price, quantity: item.quantity }],
  })
}

/**
 * Track e-commerce: compra finalizada
 */
export function trackPurchase(orderId: number, total: number, items: { id: number; name: string; price: number; quantity: number }[]) {
  trackEvent("purchase", {
    transaction_id: String(orderId),
    currency: "BRL",
    value: total,
    items: items.map((i) => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.quantity })),
  })
}

/**
 * Track e-commerce: visualização de produto
 */
export function trackViewItem(item: { id: number; name: string; price: number }) {
  trackEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [{ item_id: String(item.id), item_name: item.name, price: item.price }],
  })
}
