'use client'

import { useEffect } from 'react'

export function PreloaderRemover() {
  useEffect(() => {
    const el = document.getElementById('preloader')
    if (el) {
      // Small delay to ensure content is painted
      setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => el.remove(), 500)
      }, 200)
    }
  }, [])

  return null
}
