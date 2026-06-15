'use client'

import { useEffect } from 'react'

export function PreloaderRemover() {
  useEffect(() => {
    const el = document.getElementById('preloader')
    if (el) {
      // Mark preloader as shown for this session (so it's skipped on next navigation)
      try { sessionStorage.setItem('mb-preloader-shown', '1') } catch (e) {}
      // Small delay to ensure content is painted
      setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => el.remove(), 500)
      }, 200)
    }
  }, [])

  return null
}
