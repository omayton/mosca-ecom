"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function PageTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    // Fire-and-forget: never blocks rendering
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
      // Use keepalive so it completes even if user navigates away
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
