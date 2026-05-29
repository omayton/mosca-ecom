/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.moscabrancaparts.com.br' },
      { protocol: 'http',  hostname: 'moscabrancaparts.com.br' },
    ],
  },
}

module.exports = nextConfig
