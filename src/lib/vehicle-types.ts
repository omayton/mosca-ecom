// Vehicle search and compatibility types

export interface Vehicle {
  brand: string
  model: string
  year: string
  fipeCode?: string
  displayText: string
}

export interface CompatibleProduct {
  id: number
  name: string
  price: number
  oldPrice?: number
  category: string
  imageFile: string
  slug: string
  compatibilityScore: number
  compatibilityReason: string
  inStock: boolean
}

export interface VehicleSearchResponse {
  results: Vehicle[]
  cached: boolean
}

export interface CompatibilityResponse {
  compatibleProducts: CompatibleProduct[]
  analysisMetadata: {
    totalProducts: number
    analyzedAt: string
    fallbackUsed: boolean
  }
}

export interface VehicleSearchRequest {
  q: string
}

export interface CompatibilityRequest {
  vehicle: {
    brand: string
    model: string
    year: string
  }
}