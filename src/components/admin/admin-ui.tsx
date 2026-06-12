'use client'

import { ReactNode } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Design Tokens ──────────────────────────────────────────────────────────
const tokens = {
  bg: 'bg-[#0a0a0b]',
  surface: 'bg-[#111113]',
  border: 'border-white/[0.06]',
  borderHover: 'hover:border-white/10',
  text: 'text-white',
  textSecondary: 'text-white/60',
  textMuted: 'text-white/30',
}

// ─── AdminPage ──────────────────────────────────────────────────────────────
export function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {children}
    </div>
  )
}

// ─── AdminHeader ────────────────────────────────────────────────────────────
interface AdminHeaderProps {
  title: string
  subtitle?: string
  count?: number
  children?: ReactNode // actions slot
}

export function AdminHeader({ title, subtitle, count, children }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/30 mt-1 text-sm">{subtitle}</p>}
        {count !== undefined && <p className="text-white/30 mt-1 text-sm">{count} registros</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

// ─── AdminCard ──────────────────────────────────────────────────────────────
interface AdminCardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function AdminCard({ children, className = '', padding = true }: AdminCardProps) {
  return (
    <div className={`${tokens.surface} border ${tokens.border} rounded-xl ${tokens.borderHover} transition-all ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── AdminFilter ────────────────────────────────────────────────────────────
interface AdminFilterProps {
  children: ReactNode
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
}

export function AdminFilter({ children, searchValue, searchPlaceholder, onSearchChange }: AdminFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Buscar...'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111113] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
      )}
      {children}
    </div>
  )
}

// ─── AdminSelect ────────────────────────────────────────────────────────────
interface AdminSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function AdminSelect({ value, onChange, options, placeholder }: AdminSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2.5 bg-[#111113] border border-white/[0.06] rounded-lg text-sm text-white/80 focus:outline-none focus:border-amber-500/30 cursor-pointer appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ─── AdminButton ────────────────────────────────────────────────────────────
interface AdminButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export function AdminButton({ children, onClick, variant = 'primary', size = 'md', disabled, className = '' }: AdminButtonProps) {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold',
    secondary: 'bg-white/[0.06] hover:bg-white/10 text-white/80 border border-white/[0.06]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
    ghost: 'hover:bg-white/[0.04] text-white/50 hover:text-white/80',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── AdminTable ─────────────────────────────────────────────────────────────
interface AdminTableProps {
  headers: { label: string; align?: 'left' | 'center' | 'right'; width?: string }[]
  children: ReactNode
  loading?: boolean
  rows?: number
}

export function AdminTable({ headers, children, loading, rows = 5 }: AdminTableProps) {
  return (
    <div className={`${tokens.surface} border ${tokens.border} rounded-xl overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/[0.06]">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider ${
                    h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={h.width ? { width: h.width } : undefined}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  {headers.map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-white/[0.04] animate-pulse rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── AdminTableRow ──────────────────────────────────────────────────────────
export function AdminTableRow({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-white/[0.02] transition-colors ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
    >
      {children}
    </tr>
  )
}

export function AdminTableCell({ children, align, className = '' }: { children: ReactNode; align?: 'left' | 'center' | 'right'; className?: string }) {
  return (
    <td className={`px-4 py-3.5 text-sm ${
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    } ${className}`}>
      {children}
    </td>
  )
}

// ─── AdminBadge ─────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'

interface AdminBadgeProps {
  label: string
  variant?: BadgeVariant
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  neutral: 'text-white/40 bg-white/5 border-white/10',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export function AdminBadge({ label, variant = 'neutral' }: AdminBadgeProps) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border ${badgeStyles[variant]}`}>
      {label}
    </span>
  )
}

// Status badge helper for orders
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pendente', variant: 'warning' },
    confirmed: { label: 'Confirmado', variant: 'info' },
    shipped: { label: 'Enviado', variant: 'purple' },
    delivered: { label: 'Entregue', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },
  }
  const item = map[status] || { label: status, variant: 'neutral' as BadgeVariant }
  return <AdminBadge label={item.label} variant={item.variant} />
}

// ─── AdminEmptyState ────────────────────────────────────────────────────────
interface AdminEmptyStateProps {
  icon: any
  title: string
  description?: string
  action?: ReactNode
}

export function AdminEmptyState({ icon: Icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className={`${tokens.surface} border ${tokens.border} rounded-xl p-12 text-center`}>
      <Icon className="h-12 w-12 text-white/10 mx-auto mb-4" />
      <p className="text-white/50 font-medium">{title}</p>
      {description && <p className="text-white/20 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── AdminPagination ────────────────────────────────────────────────────────
interface AdminPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-white/40 px-3">
        {page} <span className="text-white/20">de</span> {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── AdminModal ─────────────────────────────────────────────────────────────
interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

export function AdminModal({ open, onClose, title, children, wide }: AdminModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`relative bg-[#111113] border border-white/[0.06] rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── AdminInput ─────────────────────────────────────────────────────────────
interface AdminInputProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}

export function AdminInput({ label, value, onChange, type = 'text', placeholder, required }: AdminInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-amber-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
      />
    </div>
  )
}

export function AdminTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label?: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors resize-none"
      />
    </div>
  )
}
