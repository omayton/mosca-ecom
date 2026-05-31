'use client'

import { Car, ChevronDown } from 'lucide-react'
import type { Vehicle } from '@/lib/vehicle-types'

interface VehicleSearchButtonProps {
  onClick: () => void
  isActive: boolean
  selectedVehicle?: Vehicle | null
}

export function VehicleSearchButton({
  onClick,
  isActive,
  selectedVehicle
}: VehicleSearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={selectedVehicle ? `Veículo selecionado: ${selectedVehicle.displayText}` : 'Buscar por veículo'}
      aria-expanded={isActive}
      className={`
        hidden md:flex items-center gap-2
        min-h-[44px] px-4 border transition-all duration-150
        whitespace-nowrap flex-shrink-0 cursor-pointer
        ${isActive
          ? 'bg-zinc-700 border-zinc-600 ring-2 ring-zinc-600'
          : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
        }
        text-zinc-100 text-sm
      `}
    >
      <Car className="h-4 w-4 text-red-500" aria-hidden="true" />
      <span className="text-sm">
        {selectedVehicle
          ? selectedVehicle.displayText.length > 30
            ? `${selectedVehicle.displayText.slice(0, 30)}...`
            : selectedVehicle.displayText
          : 'Buscar com veículo'
        }
      </span>
      <ChevronDown
        className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 ${isActive ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}