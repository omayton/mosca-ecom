"use client"

import { cn } from "@/lib/utils"
import { MapPin, Truck, CreditCard, Check } from "lucide-react"

const STEPS = [
  { id: "address", label: "Endereço", icon: MapPin },
  { id: "shipping", label: "Frete", icon: Truck },
  { id: "review", label: "Pagamento", icon: CreditCard },
] as const

export type CheckoutStep = (typeof STEPS)[number]["id"]

interface CheckoutStepsProps {
  current: CheckoutStep
}

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === current)

  return (
    <nav aria-label="Etapas do checkout" className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isCompleted && "bg-green-600 text-white",
                  isCurrent && "bg-red-600 text-white",
                  !isCompleted && !isCurrent && "bg-zinc-100 text-zinc-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  isCurrent && "font-semibold text-zinc-900",
                  isCompleted && "text-green-700",
                  !isCompleted && !isCurrent && "text-zinc-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5",
                  idx < currentIdx ? "bg-green-600" : "bg-zinc-200"
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
