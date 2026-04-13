// src/pages/Clients.jsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDB, fmt, totalNet } from '../hooks/useDB'
import { PageHeader, Modal, ModalFooter, Field, Grid2, Input, Badge, EmptyState, TblWrap, ProgressBar } from '../components/UI'

const EMPTY = { nom: '', telephone: '', email: '', adresse: '', limite_credit: 0, statut: 'Actif' }

export default function Clients() {
  const { db, addClient, soldeClient, getFacturesByClient } = useDB()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave() {
    if (!form.nom.trim()) { toast.error('Nom obligatoire'); return }
    addClient({ ...form, limite_credit: parseFloat(form.limite_credit) || 0 })
    toast.success('Client ajouté')
    setOpen(false); setForm(EMPTY)
  }

  return (
    <div className="p-8">
      <PageHeader title="Clients">
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> Nouveau client</button>
      </PageHeader>
      <div className="card">
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Client','Téléphone','Email','Achats','Solde dû (FCFA)','Limite crédit','Statut'].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {db.clients.length === 0 ? <EmptyState message="Aucun client" /> : db.clients.map(c => {
                const solde = soldeClient(c.id)
                const factures = getFacturesByClient(c.id)
                const achats = db.pesees.filter(p => p.client_id === c.id).reduce((s,p) => s + totalNet(p), 0)
                return (
                  <tr key={c.id} className="tr-hover">
                    <td className="td font-semibold">{c.nom}</td>
                    <td className="td text-sm text-ocean-500">{c.telephone || '—'}</td>
                    <td className="td text-sm text-ocean-500">{c.email || '—'}</td>
                    <td className="td font-mono">{fmt(achats)} kg</td>
                    <td className="td">
                      <span className={`font-mono font-semibold ${solde > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(solde)}</span>
                      {c.limite_credit > 0 && <ProgressBar value={solde} max={c.limite_credit} color="bg-amber-400" />}
                    </td>
                    <td className="td font-mono text-ocean-400">{c.limite_credit > 0 ? fmt(c.limite_credit) : '—'}</td>
                    <td className="td"><Badge type={c.statut} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TblWrap>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau client">
        <Grid2>
          <Field label="Raison sociale / Nom"><Input value={form.nom} onChange={set('nom')} placeholder="ex: SOPROMER CI" /></Field>
          <Field label="Téléphone"><Input value={form.telephone} onChange={set('telephone')} placeholder="+225 07..." /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Limite crédit (FCFA)"><Input type="number" value={form.limite_credit} onChange={set('limite_credit')} /></Field>
        </Grid2>
        <Field label="Adresse"><Input value={form.adresse} onChange={set('adresse')} /></Field>
        <ModalFooter onClose={() => setOpen(false)} onSave={handleSave} />
      </Modal>
    </div>
  )
}
