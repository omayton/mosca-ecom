'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  currentImage?: string
  productId?: number
  onUpload: (url: string) => void
}

export function ImageUpload({ currentImage, productId, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Use JPG, PNG, WebP ou GIF')
      return
    }

    // Validar tamanho
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5MB')
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (productId) formData.append('productId', productId.toString())

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        onUpload(data.url)
      } else {
        setError(data.error || 'Erro no upload')
        setPreview(currentImage || null)
      }
    } catch (err) {
      setError('Erro de conexão')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const removeImage = () => {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700 mb-1">Foto do Produto</label>

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-zinc-200 group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain bg-zinc-50"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={removeImage}
              className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            w-full h-48 rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-3
            transition-all duration-200
            ${dragOver
              ? 'border-red-400 bg-red-50'
              : 'border-zinc-300 bg-zinc-50 hover:border-red-300 hover:bg-red-50/50'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          ) : (
            <>
              <div className="p-3 rounded-full bg-zinc-100">
                <Upload className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-600">
                  Arraste uma imagem ou <span className="text-red-600">clique aqui</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP ou GIF • Máx 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}