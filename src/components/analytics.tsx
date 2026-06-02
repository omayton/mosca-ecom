"use client"

import Script from "next/script"

/**
 * Google Tag Manager + GA4 integration.
 *
 * Setup:
 * 1. Create GTM container at tagmanager.google.com
 * 2. Inside GTM, configure GA4 tag with your Measurement ID
 * 3. Set NEXT_PUBLIC_GTM_ID env var (e.g., "GTM-XXXXXXX")
 *
 * This component loads GTM which handles GA4, Meta Pixel, and any other tags
 * you configure in the GTM dashboard — no code changes needed for new tags.
 */
export function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  if (!gtmId) return null

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      {/* GTM noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}

/**
 * Push events to GTM dataLayer.
 * Use this to track e-commerce events (add_to_cart, purchase, etc.)
 */
export function trackEvent(event: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event, ...data })
  }
}
