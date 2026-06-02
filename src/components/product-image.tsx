"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { PLACEHOLDER } from "@/lib/products"

interface ProductImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string
}

export function ProductImage({ fallbackSrc = PLACEHOLDER, src, alt, ...props }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
    />
  )
}
