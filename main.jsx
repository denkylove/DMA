import { useState, useMemo } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDB, fmt, fmtDate, totalNet } from '../hooks/useDB'
import { PageHeader, Modal, ModalFooter, Field, Grid2, Input, Select, Badge, EmptyState, TblWrap, Tabs, KpiCard } from '../components/UI'

const TABS = [
  { value: 'all',       label: 'Toutes' },
  { value: 'impayée',   label: 'Impayées' },
  { value: 'partielle', label: 'Partielles' },
  { value: 'payée',     label: 'Payées' },
]

export default function Factures() {
  const { db, addFacture, addPaiement, getClient, getPaiementsByFacture } = useDB()
  const [tab, setTab] = useState('all')
  const [openFac, setOpenFac] = useState(false)
  const [openPay, setOpenPay] = useState(false)
  const [selFac, setSelFac] = useState(null)
  const [form, setForm] = useState({ client_id: '', date_facture: new Date().toISOString().split('T')[0], date_echeance: '', montant_total: '' })
  const [payForm, setPayForm] = useState({ montant: '', mode: 'Virement', reference: '', date_paiement: new Date().toISOString().split('T')[0] })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setP = k => e => setPayForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = useMemo(() =>
    tab === 'all' ? db.factures : db.factures.filter(f => f.statut === tab)
  , [db.factures, tab])

  const tabsWithCount = TABS.map(t => ({
    ...t, count: t.value === 'all' ? db.factures.length : db.factures.filter(f => f.statut === t.value).length
  }))

  const kpis = useMemo(() => ({
    total:    db.factures.reduce((s, f) => s + f.montant_total, 0),
    paye:     db.factures.reduce((s, f) => s + f.montant_paye, 0),
    reste:    db.factures.reduce((s, f) => s + (f.montant_total - f.montant_paye), 0),
  }), [db.factures])

  function handleSaveFac() {
    if (!form.client_id || !form.montant_total) { toast.error('Client et montant obligatoires'); return }
    const num = `FAC-${new Date().getFullYear()}-${String(db.factures.length + 1).padStart(3,'0')}`
    addFacture({ ...form, client_id: parseInt(form.client_id), montant_total: parseFloat(form.montant_total), numero: num })
    toast.success('Facture créée')
    setOpenFac(false)
  }

  function handleSavePay() {
    if (!payForm.montant) { toast.error('Montant obligatoire'); return }
    addPaiement({ ...payForm, facture_id: selFac.id, montant: parseFloat(payForm.montant) })
    toast.success('Paiement enregistré')
    setOpenPay(false); setSelFac(null)
  }

  return (
    <div className="p-8">
      <PageHeader title="Factures">
        <button className="btn-primary" onClick={() => setOpenFac(true)}><Plus size={14} /> Créer facture</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total facturé" value={`${fmt(kpis.total)} FCFA`} />
        <KpiCard label="Total encaissé" value={`${fmt(kpis.paye)} FCFA`} />
        <KpiCard label="Reste à encaisser" value={`${fmt(kpis.reste)} FCFA`} accent />
      </div>

      <Tabs tabs={tabsWithCount} active={tab} onChange={setTab} />

      <div className="card">
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['N° Facture','Client','Date','Échéance','Total','Payé','Reste dû','Statut',''].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <EmptyState message="Aucune facture" /> : filtered.map(f => {
                const cli = getClient(f.client_id)
                const reste = f.montant_total - f.montant_paye
                const estEchue = f.statut !== 'payée' && f.date_echeance && f.date_echeance < new Date().toISOString().split('T')[0]
                return (
                  <tr key={f.id} className={`tr-hover ${estEchue ? 'bg-red-50' : ''}`}>
                    <td className="td font-mono text-xs text-ocean-600">{f.numero}</td>
                    <td className="td font-semibold">{cli?.nom}</td>
                    <td className="td">{fmtDate(f.date_facture)}</td>
                    <td className={`td ${estEchue ? 'text-red-600 font-medium' : ''}`}>{fmtDate(f.date_echeance)}</td>
                    <td className="td font-mono">{fmt(f.montant_total)}</td>
                    <td className="td font-mono text-emerald-600">{fmt(f.montant_paye)}</td>
                    <td className="td font-mono font-semibold text-amber-600">{fmt(reste)}</td>
                    <td className="td"><Badge type={f.statut} /></td>
                    <td className="td">
                      {f.statut !== 'payée' && (
                        <button
                          className="flex items-center gap-1 text-xs text-ocean-500 hover:text-ocean-800 transition-colors"
                          onClick={() => { setSelFac(f); setOpenPay(true) }}
                        >
                          <CreditCard size={12} /> Paiement
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

      {/* Créer facture */}
      <Modal open={openFac} onClose={() => setOpenFac(false)} title="Créer une facture">
        <Grid2>
          <Field label="Client">
            <Select value={form.client_id} onChange={set('client_id')}>
              <option value="">— Choisir —</option>
              {db.clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </Field>
          <Field label="Montant total (FCFA)"><Input type="number" value={form.montant_total} onChange={set('montant_total')} /></Field>
          <Field label="Date facture"><Input type="date" value={form.date_facture} onChange={set('date_facture')} /></Field>
          <Field label="Date échéance"><Input type="date" value={form.date_echeance} onChange={set('date_echeance')} /></Field>
        </Grid2>
        <ModalFooter onClose={() => setOpenFac(false)} onSave={handleSaveFac} />
      </Modal>

      {/* Enregistrer paiement */}
      <Modal open={openPay} onClose={() => { setOpenPay(false); setSelFac(null) }} title={`Paiement — ${selFac?.numero}`}>
        {selFac && (
          <div className="bg-ocean-50 rounded-lg px-4 py-3 mb-4 text-sm">
            <span className="text-ocean-500">Reste dû : </span>
            <span className="font-semibold font-mono text-ocean-800">{fmt(selFac.montant_total - selFac.montant_paye)} FCFA</span>
          </div>
        )}
        <Grid2>
          <Field label="Montant (FCFA)"><Input type="number" value={payForm.montant} onChange={setP('montant')} /></Field>
          <Field label="Mode">
            <Select value={payForm.mode} onChange={setP('mode')}>
              <option>Virement</option><option>Espèces</option><option>Chèque</option><option>Acompte</option>
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={payForm.date_paiement} onChange={setP('date_paiement')} /></Field>
          <Field label="Référence"><Input value={payForm.reference} onChange={setP('reference')} placeholder="N° virement..." /></Field>
        </Grid2>
        <ModalFooter onClose={() => { setOpenPay(false); setSelFac(null) }} onSave={handleSavePay} saveLabel="Enregistrer paiement" />
      </Modal>
    </div>
  )
}
