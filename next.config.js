/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.moscabrancaparts.com.br' },
      { protocol: 'http',  hostname: 'moscabrancaparts.com.br' },
      { protocol: 'https', hostname: 'mcaxtwztzfrytxtkgdxh.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('sharp')
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://*.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://www.moscabrancaparts.com.br https://mcaxtwztzfrytxtkgdxh.supabase.co https://images.unsplash.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://mcaxtwztzfrytxtkgdxh.supabase.co https://api.mercadopago.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://www.facebook.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              "frame-src 'self' https://sdk.mercadopago.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
