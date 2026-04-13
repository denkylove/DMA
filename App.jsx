import { useState, useMemo } from 'react'
import { Download, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useDB, fmt, fmtDate, totalNet } from '../hooks/useDB'
import { PageHeader, Badge, EmptyState, TblWrap, SumRow, KpiCard, Select } from '../components/UI'

export default function Comptabilite() {
  const { db, getNavire, getClient } = useDB()
  const [filNavire, setFilNavire] = useState('')
  const [filClient, setFilClient] = useState('')
  const [filType, setFilType] = useState('')
  const [filProduit, setFilProduit] = useState('')

  const navires = [...new Set(db.importations.map(i => i.navire_id))]
    .map(id => getNavire(id)).filter(Boolean)

  const filtered = useMemo(() => {
    return db.pesees.filter(p => {
      const imp = db.importations.find(i => i.id === p.importation_id)
      if (filNavire && imp?.navire_id !== parseInt(filNavire)) return false
      if (filClient && p.client_id !== parseInt(filClient)) return false
      if (filType && p.type_pesee !== filType) return false
      if (filProduit && p.produit !== filProduit) return false
      return true
    })
  }, [db.pesees, filNavire, filClient, filType, filProduit])

  const totaux = useMemo(() => ({
    tonnage:  filtered.reduce((s, p) => s + p.tonnage, 0),
    retranch: filtered.reduce((s, p) => s + p.retranchement, 0),
    net:      filtered.reduce((s, p) => s + totalNet(p), 0),
    montant:  filtered.reduce((s, p) => s + totalNet(p) * p.prix_unitaire, 0),
  }), [filtered])

  // Données graphique par produit
  const byProduit = useMemo(() => {
    const map = {}
    filtered.forEach(p => { map[p.produit] = (map[p.produit] || 0) + totalNet(p) })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  // Données par client
  const byClient = useMemo(() => {
    const map = {}
    filtered.forEach(p => {
      const cli = getClient(p.client_id)?.nom || 'Sans client'
      map[cli] = (map[cli] || 0) + totalNet(p)
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))
  }, [filtered])

  function exportCSV() {
    const header = ['Date','Navire','Voyage','Type','Produit','Client','Tonnage brut','Retranchement','Total net','Prix/kg','Montant FCFA']
    const rows = filtered.map(p => {
      const imp = db.importations.find(i => i.id === p.importation_id)
      const nav = imp ? getNavire(imp.navire_id) : null
      const cli = getClient(p.client_id)
      return [
        p.date_pesee, nav?.nom||'', imp?.numero_voyage||'', p.type_pesee,
        p.produit, cli?.nom||'', p.tonnage, p.retranchement,
        totalNet(p), p.prix_unitaire, totalNet(p)*p.prix_unitaire
      ].join(';')
    })
    const csv = [header.join(';'), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `comptabilite_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const COLORS = ['#097c82','#4fb4b8','#cfa24e','#b8872e']

  return (
    <div className="p-8">
      <PageHeader title="Comptabilité">
        <button className="btn-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </PageHeader>

      {/* Filtres */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={14} className="text-ocean-400" />
          <Select value={filNavire} onChange={e => setFilNavire(e.target.value)} className="w-44">
            <option value="">Tous navires</option>
            {navires.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </Select>
          <Select value={filClient} onChange={e => setFilClient(e.target.value)} className="w-44">
            <option value="">Tous clients</option>
            {db.clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Select>
          <Select value={filType} onChange={e => setFilType(e.target.value)} className="w-36">
            <option value="">Tous types</option>
            <option>DIRECT</option><option>SOCEF</option><option>CONTENEUR</option>
          </Select>
          <Select value={filProduit} onChange={e => setFilProduit(e.target.value)} className="w-36">
            <option value="">Tous produits</option>
            {db.produits.map(p => <option key={p}>{p}</option>)}
          </Select>
          {(filNavire || filClient || filType || filProduit) && (
            <button
              className="text-xs text-ocean-400 hover:text-ocean-700"
              onClick={() => { setFilNavire(''); setFilClient(''); setFilType(''); setFilProduit('') }}
            >
              Réinitialiser
            </button>
          )}
          <span className="ml-auto text-xs text-ocean-400 font-mono">{filtered.length} ligne(s)</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard label="Tonnage net" value={`${fmt(totaux.net)} kg`} accent />
        <KpiCard label="Total retranchements" value={`${fmt(totaux.retranch)} kg`} />
        <KpiCard label="Chiffre d'affaires" value={`${fmt(totaux.montant)} FCFA`} />
        <KpiCard label="Nb pesées" value={filtered.length} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <p className="text-sm font-semibold text-ocean-700 mb-4">Tonnage net par produit</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byProduit} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4fb4b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={v => [`${fmt(v)} kg`]}
                contentStyle={{ background: '#022c2e', border: 'none', borderRadius: 8, fontSize: 12, color: '#eaf6f6' }}
              />
              <Bar dataKey="value" fill="#097c82" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-ocean-700 mb-4">Tonnage net par client</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byClient} barSize={22} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4fb4b8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                formatter={v => [`${fmt(v)} kg`]}
                contentStyle={{ background: '#022c2e', border: 'none', borderRadius: 8, fontSize: 12, color: '#eaf6f6' }}
              />
              <Bar dataKey="value" fill="#cfa24e" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="card">
        <TblWrap>
          <table className="w-full">
            <thead><tr>
              {['Date','Navire','Voy.','Type','Produit','Client','Tonnage brut','Retranch.','Total net','Prix/kg','Montant FCFA'].map(h => (
                <th key={h} className="th whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <EmptyState message="Aucune donnée avec ces filtres" /> :
                filtered.map(p => {
                  const imp = db.importations.find(i => i.id === p.importation_id)
                  const nav = imp ? getNavire(imp.navire_id) : null
                  const cli = getClient(p.client_id)
                  return (
                    <tr key={p.id} className="tr-hover">
                      <td className="td font-mono text-xs">{fmtDate(p.date_pesee)}</td>
                      <td className="td font-medium">{nav?.nom || '—'}</td>
                      <td className="td text-ocean-400">V{imp?.numero_voyage}</td>
                      <td className="td"><Badge type={p.type_pesee} /></td>
                      <td className="td font-mono text-xs">{p.produit}</td>
                      <td className="td">{cli?.nom || <span className="text-ocean-300">—</span>}</td>
                      <td className="td font-mono">{fmt(p.tonnage)}</td>
                      <td className="td font-mono text-amber-600">{p.retranchement > 0 ? `-${fmt(p.retranchement)}` : ''}</td>
                      <td className="td font-semibold font-mono">{fmt(totalNet(p))}</td>
                      <td className="td font-mono text-xs text-ocean-400">{p.prix_unitaire > 0 ? fmt(p.prix_unitaire) : ''}</td>
                      <td className="td font-mono font-semibold text-ocean-700">{p.prix_unitaire > 0 ? fmt(totalNet(p) * p.prix_unitaire) : ''}</td>
                    </tr>
                  )
                })
              }
            </tbody>
            <SumRow values={[
              'Totaux', '', '', '', '', '',
              `${fmt(totaux.tonnage)} kg`,
              totaux.retranch > 0 ? `-${fmt(totaux.retranch)}` : '',
              `${fmt(totaux.net)} kg`, '',
              `${fmt(totaux.montant)} FCFA`
            ]} />
          </table>
        </TblWrap>
      </div>
    </div>
  )
}
