import './globals.css'
import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import { CartProvider } from '@/contexts/cart-context'
import { CookieConsent } from '@/components/cookie-consent'
import { Analytics } from '@/components/analytics'
import { PreloaderRemover } from '@/components/preloader'
import { PageTracker } from '@/components/page-tracker'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  variable: '--font-ubuntu',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mosca Branca Parts — Peças Automotivas Raras e de Difícil Localização',
    template: '%s | Mosca Branca Parts',
  },
  description: 'Especialistas em peças automotivas raras. Saídas de ar, tampas, acabamentos, interruptores, componentes de motor e mais. Envio para todo o Brasil com garantia.',
  keywords: ['peças automotivas', 'peças raras', 'autopeças', 'peças difícil localização', 'mosca branca parts', 'peças vectra', 'peças GM', 'peças originais'],
  authors: [{ name: 'Mosca Branca Parts' }],
  creator: 'Mosca Branca Parts',
  metadataBase: new URL('https://www.moscabrancaparts.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.moscabrancaparts.com.br',
    siteName: 'Mosca Branca Parts',
    title: 'Mosca Branca Parts — Peças Automotivas Raras',
    description: 'Encontre peças automotivas raras e de difícil localização. Envio para todo o Brasil.',
    images: [
      {
        url: 'https://www.moscabrancaparts.com.br/images/05/bannermosca.png',
        width: 768,
        height: 412,
        alt: 'Mosca Branca Parts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mosca Branca Parts — Peças Automotivas Raras',
    description: 'Encontre peças automotivas raras e de difícil localização. Envio para todo o Brasil.',
    images: ['https://www.moscabrancaparts.com.br/images/05/bannermosca.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={ubuntu.variable}>
      <body className="font-ubuntu antialiased">
        {/* Preloader — HTML/CSS puro para renderizar instantaneamente */}
        <div
          id="preloader"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0b',
            transition: 'opacity 0.4s ease-out',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes wingFlap {
              0%, 100% { transform: scaleY(1) rotate(0deg); }
              50% { transform: scaleY(0.3) rotate(-5deg); }
            }
            @keyframes wingFlapR {
              0%, 100% { transform: scaleY(1) rotate(0deg); }
              50% { transform: scaleY(0.3) rotate(5deg); }
            }
            @keyframes flyBob {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            @keyframes fadeInPreloader {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
            #preloader-fly {
              animation: flyBob 1.2s ease-in-out infinite, fadeInPreloader 0.3s ease-out;
            }
            #preloader .wing-left {
              transform-origin: right center;
              animation: wingFlap 0.15s ease-in-out infinite;
            }
            #preloader .wing-right {
              transform-origin: left center;
              animation: wingFlapR 0.15s ease-in-out infinite;
            }
            #preloader-text {
              animation: fadeInPreloader 0.5s ease-out 0.2s both;
            }
          `}} />

          <svg id="preloader-fly" width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left wing */}
            <ellipse className="wing-left" cx="25" cy="22" rx="14" ry="8" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="0.8" />
            {/* Right wing */}
            <ellipse className="wing-right" cx="55" cy="22" rx="14" ry="8" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="0.8" />
            {/* Body */}
            <ellipse cx="40" cy="36" rx="10" ry="14" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
            {/* Head */}
            <circle cx="40" cy="20" r="7" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
            {/* Eyes */}
            <circle cx="37" cy="18" r="2.5" fill="#dc2626" opacity="0.8" />
            <circle cx="43" cy="18" r="2.5" fill="#dc2626" opacity="0.8" />
            {/* Eye shine */}
            <circle cx="37.8" cy="17.2" r="0.8" fill="white" opacity="0.6" />
            <circle cx="43.8" cy="17.2" r="0.8" fill="white" opacity="0.6" />
            {/* Stripe on body */}
            <ellipse cx="40" cy="33" rx="6" ry="2" fill="#333" opacity="0.5" />
            <ellipse cx="40" cy="38" rx="5" ry="1.5" fill="#333" opacity="0.5" />
          </svg>

          <p id="preloader-text" style={{
            marginTop: '20px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Mosca Branca Parts
          </p>
        </div>

        <PreloaderRemover />
        <Analytics />
        <PageTracker />
        <CartProvider>{children}</CartProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
