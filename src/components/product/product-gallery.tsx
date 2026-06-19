"use client"

import { useState } from "react"
import { ProductImage } from "@/components/product-image"
import { PLACEHOLDER } from "@/lib/products"

interface GalleryImage {
  id: number | string
  url: string
  alt: string
}

interface ProductGalleryProps {
  mainImage: string
  productName: string
  images: GalleryImage[]
}

export function ProductGallery({ mainImage, productName, images }: ProductGalleryProps) {
  const allImages: GalleryImage[] = [
    { id: "main", url: mainImage, alt: productName },
    ...images,
  ]

  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square bg-zinc-50/80 border border-zinc-100 overflow-hidden rounded-xl">
        <ProductImage
          src={allImages[activeIndex]?.url || mainImage}
          alt={allImages[activeIndex]?.alt || productName}
          fill
          className="object-contain p-6"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          fallbackSrc={PLACEHOLDER}
        />

        {/* Rare badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="bg-red-50 text-red-700 font-semibold text-xs px-3 py-1.5 uppercase tracking-wide rounded-md">
            Peça Rara
          </span>
          <span className="bg-green-50 text-green-700 font-semibold text-xs px-3 py-1.5 rounded-md">
            5% OFF no PIX
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {allImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagem ${index + 1}`}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                index === activeIndex
                  ? "border-zinc-900 shadow-sm"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <ProductImage
                src={img.url}
                alt={img.alt}
                fill
                className="object-contain p-1"
                sizes="64px"
                fallbackSrc={PLACEHOLDER}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
