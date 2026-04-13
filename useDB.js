// src/pages/StockSocef.jsx
import { useState } from 'react'
import { Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDB, fmt, fmtDate, totalNet } from '../hooks/useDB'
import { PageHeader, Modal, ModalFooter, Field, Grid2, Input, Select, Badge, EmptyState, TblWrap, KpiCard } from '../components/UI'

export default function StockSocef() {
  const { db, sortieSocef, getClient, updateStock } = useDB()
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(null)
  const [qte, setQte] = useState('')
  const [frais, setFrais] = useState('')

  const actif = db.stock_socef.filter(s => s.statut === 'En stock')
  const totalKg = actif.reduce((s, x) => s + x.quantite_disponible, 0)
  const totalFrais = db.stock_socef.reduce((s, x) => s + x.frais_congelation, 0)

  function handleSortie() {
    const q = parseFloat(qte) || 0
    if (!sel || q <= 0 || q > sel.quantite_disponible) { toast.error('Quantité invalide'); return }
    sortieSocef(sel.id, q)
    toast.success(`${fmt(q)} kg sortis du stock SOCEF`)
    setOpen(false); setSel(null); setQte('')
  }

  function handleFrais(id, val) {
    updateStock(id, { frais_congelation: parseFloat(val) || 0 })
  }

  return (
    <div className="p-8">
      <PageHeader title="Stock SOCEF">
        <span className="text-sm text-ocean-400">Société de Congélation</span>
      </PageHeader>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Tonnage disponible" value={`${fmt(totalKg)} kg`} sub={`${actif.length} lot(s) actif(s)`} accent />
        <KpiCard label="Frais congélation" value={`${fmt(totalFrais)} FCFA`} />
        <KpiCard label="Lots sortis" value={db.stock_socef.filter(s=>s.statut==='Sorti').length} />
      </div>
      <div className="card">
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Date entrée','Client','Produit','Qté entrée','Disponible','Frais congél.','Statut',''].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {db.stock_socef.length === 0 ? <EmptyState message="Aucun stock SOCEF" /> : db.stock_socef.map(s => {
                const cli = getClient(s.client_id)
                const pesee = db.pesees.find(p => p.id === s.pesee_id)
                return (
                  <tr key={s.id} className="tr-hover">
                    <td className="td">{fmtDate(s.date_entree)}</td>
                    <td className="td font-semibold">{cli?.nom || '—'}</td>
                    <td className="td font-mono text-xs">{pesee?.produit}</td>
                    <td className="td font-mono">{fmt(s.quantite_entree)} kg</td>
                    <td className="td font-semibold font-mono text-ocean-700">{fmt(s.quantite_disponible)} kg</td>
                    <td className="td">
                      <input
                        type="number"
                        className="w-28 px-2 py-1 text-xs border border-ocean-200 rounded font-mono"
                        defaultValue={s.frais_congelation}
                        onBlur={e => handleFrais(s.id, e.target.value)}
                      />
                    </td>
                    <td className="td"><Badge type={s.statut} /></td>
                    <td className="td">
                      {s.statut === 'En stock' && (
                        <button
                          className="text-xs text-ocean-500 hover:text-ocean-800 flex items-center gap-1"
                          onClick={() => { setSel(s); setOpen(true) }}
                        >
                          <Snowflake size={12} /> Sortie
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TblWrap>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setSel(null) }} title="Sortie stock SOCEF">
        {sel && (
          <div className="bg-ocean-50 rounded-lg px-4 py-3 mb-4 text-sm">
            Disponible : <span className="font-semibold font-mono">{fmt(sel.quantite_disponible)} kg</span>
            {' · '}Client : <span className="font-semibold">{getClient(sel.client_id)?.nom}</span>
          </div>
        )}
        <Field label="Quantité à sortir (kg)">
          <Input type="number" value={qte} onChange={e => setQte(e.target.value)} placeholder={`max ${fmt(sel?.quantite_disponible)} kg`} />
        </Field>
        <ModalFooter onClose={() => { setOpen(false); setSel(null) }} onSave={handleSortie} saveLabel="Confirmer sortie" />
      </Modal>
    </div>
  )
}
