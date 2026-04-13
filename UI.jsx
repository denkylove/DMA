// src/pages/Importations.jsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDB, fmt, fmtDate, totalNet } from '../hooks/useDB'
import { PageHeader, Modal, ModalFooter, Field, Grid2, Input, Select, Badge, EmptyState, TblWrap } from '../components/UI'

const EMPTY = { navire_id: '', numero_voyage: '', numero_connaissement: '', date_arrivee: '', tonnage_brut: '', port: "Port d'Abidjan", statut: 'En cours' }

export default function Importations() {
  const { db, addImportation, updateImportation, getNavire, getPeseesByImport } = useDB()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave() {
    if (!form.navire_id || !form.numero_voyage) { toast.error('Navire et voyage obligatoires'); return }
    addImportation({ ...form, navire_id: parseInt(form.navire_id), numero_voyage: parseInt(form.numero_voyage), tonnage_brut: parseFloat(form.tonnage_brut) || 0 })
    toast.success('Importation créée')
    setOpen(false); setForm(EMPTY)
  }

  return (
    <div className="p-8">
      <PageHeader title="Importations / Voyages">
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> Nouvelle importation</button>
      </PageHeader>
      <div className="card">
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Connaissement','Navire','Voyage','Date arrivée','Port','Tonnage brut','Pesées','Tonnage net','Statut'].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {db.importations.length === 0 ? <EmptyState /> : [...db.importations].reverse().map(i => {
                const nav = getNavire(i.navire_id)
                const pesees = getPeseesByImport(i.id)
                const tn = pesees.reduce((s, p) => s + totalNet(p), 0)
                return (
                  <tr key={i.id} className="tr-hover">
                    <td className="td font-mono text-xs">{i.numero_connaissement}</td>
                    <td className="td font-semibold">{nav?.nom}</td>
                    <td className="td text-ocean-500">V{i.numero_voyage}</td>
                    <td className="td">{fmtDate(i.date_arrivee)}</td>
                    <td className="td text-xs text-ocean-400">{i.port}</td>
                    <td className="td font-mono">{fmt(i.tonnage_brut)} kg</td>
                    <td className="td text-center">{pesees.length}</td>
                    <td className="td font-semibold font-mono text-ocean-700">{fmt(tn)} kg</td>
                    <td className="td"><Badge type={i.statut} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TblWrap>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle importation">
        <Grid2>
          <Field label="Navire">
            <Select value={form.navire_id} onChange={set('navire_id')}>
              <option value="">— Choisir —</option>
              {db.navires.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </Select>
          </Field>
          <Field label="N° Voyage"><Input type="number" value={form.numero_voyage} onChange={set('numero_voyage')} /></Field>
          <Field label="N° Connaissement"><Input value={form.numero_connaissement} onChange={set('numero_connaissement')} placeholder="CI-2025-001" /></Field>
          <Field label="Date d'arrivée"><Input type="date" value={form.date_arrivee} onChange={set('date_arrivee')} /></Field>
          <Field label="Tonnage brut (kg)"><Input type="number" value={form.tonnage_brut} onChange={set('tonnage_brut')} /></Field>
          <Field label="Statut">
            <Select value={form.statut} onChange={set('statut')}>
              <option>En cours</option><option>Terminée</option>
            </Select>
          </Field>
        </Grid2>
        <ModalFooter onClose={() => setOpen(false)} onSave={handleSave} />
      </Modal>
    </div>
  )
}
