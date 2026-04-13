// src/components/UI.jsx
import { X, ChevronDown } from 'lucide-react'

export function PageHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-ocean-900">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ocean-100">
          <h2 className="text-base font-semibold text-ocean-900">{title}</h2>
          <button onClick={onClose} className="text-ocean-400 hover:text-ocean-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ModalFooter({ onClose, onSave, saveLabel = 'Enregistrer', danger }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-ocean-100 mt-4">
      <button onClick={onClose} className="btn-secondary">Annuler</button>
      <button
        onClick={onSave}
        className={danger ? 'btn-danger' : 'btn-primary'}
      >
        {saveLabel}
      </button>
    </div>
  )
}

export function Field({ label, children, half }) {
  return (
    <div className={`${half ? 'col-span-1' : ''} flex flex-col gap-1`}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}
export function Grid3({ children }) {
  return <div className="grid grid-cols-3 gap-4">{children}</div>
}

export function Input(props) {
  return <input {...props} className={`input ${props.className || ''}`} />
}

export function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`input appearance-none pr-8 ${props.className || ''}`}>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ocean-400 pointer-events-none" />
    </div>
  )
}

export function KpiCard({ label, value, sub, accent }) {
  return (
    <div className={`kpi-card ${accent ? 'border-l-4 border-l-ocean-400' : ''}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

export function Badge({ type, children }) {
  const cls = {
    DIRECT:   'badge-direct',
    SOCEF:    'badge-socef',
    CONTENEUR:'badge-cont',
    payée:    'badge-paid',
    partielle:'badge-partial',
    impayée:  'badge-unpaid',
    Actif:    'badge-paid',
    Inactif:  'badge-neutral',
    'En cours':'badge-socef',
    'Terminée':'badge-paid',
    'En stock':'badge-socef',
    Sorti:    'badge-neutral',
  }[type] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{children || type}</span>
}

export function EmptyState({ message = 'Aucune donnée' }) {
  return (
    <tr>
      <td colSpan={20} className="text-center py-10 text-ocean-400 text-sm italic">
        {message}
      </td>
    </tr>
  )
}

export function TblWrap({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">{children}</table>
    </div>
  )
}

export function SumRow({ cols = 20, values = [] }) {
  return (
    <tfoot>
      <tr className="bg-ocean-50 font-semibold text-sm">
        {values.map((v, i) => (
          <td key={i} className={`px-4 py-3 text-ocean-700 ${i === 0 ? 'text-xs uppercase tracking-wide text-ocean-500' : ''}`}>
            {v}
          </td>
        ))}
      </tr>
    </tfoot>
  )
}

export function AlertBox({ type = 'info', children }) {
  const cls = {
    info:    'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger:  'bg-red-50 text-red-700 border-red-200',
  }[type]
  return (
    <div className={`px-4 py-3 rounded-lg border text-sm mb-3 ${cls}`}>
      {children}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-ocean-100 mb-5">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
            active === t.value
              ? 'border-ocean-500 text-ocean-700 font-medium'
              : 'border-transparent text-ocean-400 hover:text-ocean-600'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              active === t.value ? 'bg-ocean-100 text-ocean-700' : 'bg-ocean-100 text-ocean-400'
            }`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, max, color = 'bg-ocean-400' }) {
  const pct = Math.min(Math.round((value / Math.max(max, 1)) * 100), 100)
  return (
    <div className="stat-bar">
      <div className={`stat-bar-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
