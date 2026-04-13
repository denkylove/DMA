import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDB, fmt, fmtDate } from '../hooks/useDB'
import { PageHeader, Modal, ModalFooter, Field, Grid2, Input, Select, Badge, EmptyState, TblWrap, KpiCard } from '../components/UI'

const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const EMPTY_EMP = { nom: '', prenom: '', poste: '', date_embauche: '', salaire_base: '', statut: 'Actif' }
const EMPTY_PAIE = { employe_id: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear(), taux_charges: 15 }

export default function RH() {
  const { db, addEmploye, addPaie } = useDB()
  const [openEmp, setOpenEmp] = useState(false)
  const [openPaie, setOpenPaie] = useState(false)
  const [formEmp, setFormEmp] = useState(EMPTY_EMP)
  const [formPaie, setFormPaie] = useState(EMPTY_PAIE)
  const setE = k => e => setFormEmp(f => ({ ...f, [k]: e.target.value }))
  const setP = k => e => setFormPaie(f => ({ ...f, [k]: e.target.value }))

  const masseS = db.employes.filter(e => e.statut === 'Actif').reduce((s, e) => s + e.salaire_base, 0)

  function handleSaveEmp() {
    if (!formEmp.nom.trim()) { toast.error('Nom obligatoire'); return }
    addEmploye({ ...formEmp, salaire_base: parseFloat(formEmp.salaire_base) || 0 })
    toast.success('Employé ajouté')
    setOpenEmp(false); setFormEmp(EMPTY_EMP)
  }

  function handleSavePaie() {
    if (!formPaie.employe_id) { toast.error('Choisissez un employé'); return }
    const emp = db.employes.find(e => e.id === parseInt(formPaie.employe_id))
    if (!emp) return
    const brut = emp.salaire_base
    const charges = Math.round(brut * (parseFloat(formPaie.taux_charges) / 100))
    addPaie({
      employe_id: emp.id,
      mois: parseInt(formPaie.mois),
      annee: parseInt(formPaie.annee),
      salaire_brut: brut,
      charges,
      salaire_net: brut - charges,
      date_paiement: new Date().toISOString().split('T')[0]
    })
    toast.success('Paie générée')
    setOpenPaie(false); setFormPaie(EMPTY_PAIE)
  }

  return (
    <div className="p-8">
      <PageHeader title="Ressources humaines">
        <button className="btn-secondary" onClick={() => setOpenPaie(true)}><Plus size={14} /> Générer paie</button>
        <button className="btn-primary" onClick={() => setOpenEmp(true)}><Plus size={14} /> Nouvel employé</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Effectif actif" value={db.employes.filter(e => e.statut === 'Actif').length} sub="employés" accent />
        <KpiCard label="Masse salariale" value={`${fmt(masseS)} FCFA`} sub="brut mensuel" />
        <KpiCard label="Bulletins émis" value={db.paie.length} sub="total paie" />
      </div>

      {/* Effectif */}
      <div className="card mb-5">
        <div className="px-5 py-4 border-b border-ocean-100">
          <p className="text-sm font-semibold text-ocean-700">Effectif</p>
        </div>
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Nom','Prénom','Poste','Date embauche','Salaire base (FCFA)','Statut'].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {db.employes.length === 0 ? <EmptyState message="Aucun employé" /> : db.employes.map(e => (
                <tr key={e.id} className="tr-hover">
                  <td className="td font-semibold">{e.nom}</td>
                  <td className="td">{e.prenom}</td>
                  <td className="td text-ocean-500">{e.poste}</td>
                  <td className="td">{fmtDate(e.date_embauche)}</td>
                  <td className="td font-mono font-semibold">{fmt(e.salaire_base)}</td>
                  <td className="td"><Badge type={e.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TblWrap>
      </div>

      {/* Historique paie */}
      <div className="card">
        <div className="px-5 py-4 border-b border-ocean-100">
          <p className="text-sm font-semibold text-ocean-700">Historique des paies</p>
        </div>
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Employé','Mois','Année','Brut (FCFA)','Charges','Net (FCFA)','Date paiement'].map(h => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {db.paie.length === 0 ? <EmptyState message="Aucune paie générée" /> : [...db.paie].reverse().map(p => {
                const emp = db.employes.find(e => e.id === p.employe_id)
                return (
                  <tr key={p.id} className="tr-hover">
                    <td className="td font-semibold">{emp ? `${emp.prenom} ${emp.nom}` : '—'}</td>
                    <td className="td">{MOIS[p.mois]}</td>
                    <td className="td font-mono">{p.annee}</td>
                    <td className="td font-mono">{fmt(p.salaire_brut)}</td>
                    <td className="td font-mono text-red-500">-{fmt(p.charges)}</td>
                    <td className="td font-mono font-semibold text-emerald-600">{fmt(p.salaire_net)}</td>
                    <td className="td">{fmtDate(p.date_paiement)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TblWrap>
      </div>

      {/* Modal employé */}
      <Modal open={openEmp} onClose={() => setOpenEmp(false)} title="Nouvel employé">
        <Grid2>
          <Field label="Nom"><Input value={formEmp.nom} onChange={setE('nom')} /></Field>
          <Field label="Prénom"><Input value={formEmp.prenom} onChange={setE('prenom')} /></Field>
          <Field label="Poste"><Input value={formEmp.poste} onChange={setE('poste')} placeholder="ex: Responsable portuaire" /></Field>
          <Field label="Date d'embauche"><Input type="date" value={formEmp.date_embauche} onChange={setE('date_embauche')} /></Field>
          <Field label="Salaire de base (FCFA)"><Input type="number" value={formEmp.salaire_base} onChange={setE('salaire_base')} /></Field>
          <Field label="Statut">
            <Select value={formEmp.statut} onChange={setE('statut')}>
              <option>Actif</option><option>Inactif</option>
            </Select>
          </Field>
        </Grid2>
        <ModalFooter onClose={() => setOpenEmp(false)} onSave={handleSaveEmp} />
      </Modal>

      {/* Modal paie */}
      <Modal open={openPaie} onClose={() => setOpenPaie(false)} title="Générer une paie">
        <Field label="Employé">
          <Select value={formPaie.employe_id} onChange={setP('employe_id')}>
            <option value="">— Choisir —</option>
            {db.employes.filter(e => e.statut === 'Actif').map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {fmt(e.salaire_base)} FCFA</option>
            ))}
          </Select>
        </Field>
        <Grid2>
          <Field label="Mois">
            <Select value={formPaie.mois} onChange={setP('mois')}>
              {MOIS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Année"><Input type="number" value={formPaie.annee} onChange={setP('annee')} /></Field>
          <Field label="Taux charges (%)"><Input type="number" value={formPaie.taux_charges} onChange={setP('taux_charges')} /></Field>
          <Field label="Salaire brut">
            <div className="input bg-ocean-50 font-mono font-semibold text-ocean-700">
              {fmt(db.employes.find(e => e.id === parseInt(formPaie.employe_id))?.salaire_base || 0)} FCFA
            </div>
          </Field>
        </Grid2>
        {formPaie.employe_id && (() => {
          const emp = db.employes.find(e => e.id === parseInt(formPaie.employe_id))
          if (!emp) return null
          const charges = Math.round(emp.salaire_base * (formPaie.taux_charges / 100))
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mt-2 text-sm">
              <span className="text-emerald-600">Salaire net : </span>
              <span className="font-semibold font-mono text-emerald-800">{fmt(emp.salaire_base - charges)} FCFA</span>
              <span className="text-emerald-500 ml-2 text-xs">(charges : {fmt(charges)} FCFA)</span>
            </div>
          )
        })()}
        <ModalFooter onClose={() => setOpenPaie(false)} onSave={handleSavePaie} saveLabel="Générer le bulletin" />
      </Modal>
    </div>
  )
}
