import './globals.css'
import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import { CartProvider } from '@/contexts/cart-context'
import { CookieConsent } from '@/components/cookie-consent'
import { Analytics } from '@/components/analytics'

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
        url: 'https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png',
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
    images: ['https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png'],
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
        <Analytics />
        <CartProvider>{children}</CartProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
