import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.moscabrancaparts.com.br"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/minha-conta/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
