"use client"

import { useState, useEffect } from "react"
import { X, Upload, Image as ImageIcon, GripVertical, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface ProductImage {
  id: number
  url: string
  altText: string
  sortOrder: number
}

interface ProductImagesUploadProps {
  productId: number
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

export function ProductImagesUpload({ productId, images, onChange }: ProductImagesUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filtra imagens sem URL vazia
  const validImages = images.filter((img) => img.url && img.url.trim() !== "")

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadPromises: Promise<ProductImage>[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("productId", productId.toString())

      uploadPromises.push(
        fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then(async (data) => {
            if (data.error) throw new Error(data.error)

            // Adicionar imagem ao produto
            const res = await fetch("/api/admin/product-images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId,
                url: data.url,
                altText: file.name.replace(/\.[^/.]+$/, ""), // nome do arquivo sem extensão
                sortOrder: validImages.length + i, // adicionar no final
              }),
            })

            if (!res.ok) throw new Error("Erro ao adicionar imagem")

            const imgData = await res.json()
            return imgData.image || imgData
          })
          .catch((err) => {
            console.error("Erro no upload:", err)
            return null
          })
      )
    }

    const uploadedImages = await Promise.all(uploadPromises)
    const successful = uploadedImages.filter((img): img is ProductImage => img !== null)

    if (successful.length > 0) {
      onChange([...validImages, ...successful])
    }

    setUploading(false)
  }

  const handleDelete = async (imageId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return

    try {
      const res = await fetch(`/api/admin/product-images?id=${imageId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Erro ao excluir imagem")

      onChange(validImages.filter((img) => img.id !== imageId))

      // Se deletou a imagem selecionada, ajustar índice
      if (selectedIndex >= validImages.length - 1) {
        setSelectedIndex(Math.max(0, validImages.length - 2))
      }
    } catch (error) {
      console.error("Erro ao excluir imagem:", error)
      alert("Erro ao excluir imagem")
    }
  }

  const handleSetMain = async (imageId: number) => {
    // Reordenar: a imagem selecionada vira sort_order=0, as outras +1
    const reordered = validImages.map((img) => {
      if (img.id === imageId) return { ...img, sortOrder: 0 }
      return { ...img, sortOrder: img.sortOrder + 1 }
    })

    try {
      // Atualizar todas as imagens
      await fetch("/api/admin/product-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: reordered.map((img) => ({
            id: img.id,
            sortOrder: img.sortOrder,
          })),
        }),
      })

      onChange(reordered)

      // A imagem principal agora é a primeira
      const newIndex = reordered.findIndex((img) => img.id === imageId)
      setSelectedIndex(newIndex)
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error)
      alert("Erro ao definir imagem principal")
    }
  }

  const handleMoveLeft = (index: number) => {
    if (index === 0) return
    const newImages = [...validImages]
    ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    onChange(newImages)
    if (selectedIndex === index) setSelectedIndex(index - 1)
    else if (selectedIndex === index - 1) setSelectedIndex(index)
  }

  const handleMoveRight = (index: number) => {
    if (index === validImages.length - 1) return
    const newImages = [...validImages]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    onChange(newImages)
    if (selectedIndex === index) setSelectedIndex(index + 1)
    else if (selectedIndex === index + 1) setSelectedIndex(index)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-red-400 hover:bg-red-50/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.createElement("input")
          input.type = "file"
          input.multiple = true
          input.accept = "image/*"
          input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files)
          input.click()
        }}
      >
        <Upload className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-700">
          {uploading ? "Fazendo upload..." : "Arraste imagens ou clique para selecionar"}
        </p>
        <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WebP, GIF (máx 5MB cada)</p>
      </div>

      {/* Lista de imagens */}
      {validImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              Imagens ({validImages.length})
            </h3>
            <span className="text-xs text-zinc-500">A primeira é a imagem principal</span>
          </div>

          {/* Preview mobile-friendly */}
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <div className="aspect-video relative rounded-lg overflow-hidden bg-zinc-100 mb-3">
              {validImages[selectedIndex] && (
                <Image
                  src={validImages[selectedIndex].url}
                  alt={validImages[selectedIndex].altText || "Preview"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              )}
            </div>

            {/* Navegação */}
            {validImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-zinc-700">
                  {selectedIndex + 1} / {validImages.length}
                </span>
                <button
                  onClick={() => setSelectedIndex(Math.min(validImages.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === validImages.length - 1}
                  className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Controles da imagem atual */}
            {validImages[selectedIndex] && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {selectedIndex === 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-current" />
                      Principal
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetMain(validImages[selectedIndex].id)}
                      className="text-xs text-zinc-600 hover:text-red-600 transition-colors"
                    >
                      <Star className="h-4 w-4 inline mr-1" />
                      Tornar principal
                    </button>
                  )}

                  {selectedIndex > 0 && (
                    <button
                      onClick={() => handleMoveLeft(selectedIndex)}
                      className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                      title="Mover para esquerda"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  {selectedIndex < validImages.length - 1 && (
                    <button
                      onClick={() => handleMoveRight(selectedIndex)}
                      className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                      title="Mover para direita"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(validImages[selectedIndex].id)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors ml-auto"
                    title="Excluir imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={validImages[selectedIndex].altText}
                  onChange={(e) => {
                    const newImages = [...validImages]
                    newImages[selectedIndex] = {
                      ...newImages[selectedIndex],
                      altText: e.target.value,
                    }
                    onChange(newImages)
                  }}
                  placeholder="Texto alternativo (opcional)"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}
          </div>

          {/* Thumbnails em grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {validImages.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `Imagem ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 20vw, 100px"
                />
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5">
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {validImages.length === 0 && (
        <div className="text-center py-8 bg-zinc-50 rounded-lg border border-zinc-200">
          <ImageIcon className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-600">Nenhuma imagem adicionada ainda</p>
        </div>
      )}
    </div>
  )
}
