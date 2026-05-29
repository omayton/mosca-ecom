import './globals.css'
import type { Metadata } from 'next'
import { Inter, Barlow_Condensed } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mosca Autopeças — As melhores peças do Brasil',
  description: 'Compre peças automotivas com os melhores preços. Pneus, freios, suspensão, motor e mais.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${barlow.variable}`}>
      <body className="font-inter antialiased">{children}</body>
    </html>
  )
}
