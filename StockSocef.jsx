import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Ship, TrendingUp, Snowflake, AlertTriangle } from 'lucide-react'
import { useDB, fmt, fmtDate, totalNet } from '../hooks/useDB'
import { KpiCard, AlertBox, Badge, ProgressBar } from '../components/UI'

export default function Dashboard() {
  const { db, getNavire, getClient, soldeClient } = useDB()

  const stats = useMemo(() => {
    const tonnageNet = db.pesees.reduce((s, p) => s + totalNet(p), 0)
    const stockKg    = db.stock_socef.filter(s => s.statut === 'En stock').reduce((s, x) => s + x.quantite_disponible, 0)
    const caTotal    = db.pesees.reduce((s, p) => s + (totalNet(p) * p.prix_unitaire), 0)
    const creances   = db.factures.reduce((s, f) => s + (f.montant_total - f.montant_paye), 0)

    // tonnage par navire
    const byNavire = {}
    db.pesees.forEach(p => {
      const imp = db.importations.find(i => i.id === p.importation_id)
      if (!imp) return
      const nav = getNavire(imp.navire_id)?.nom || '?'
      byNavire[nav] = (byNavire[nav] || 0) + totalNet(p)
    })
    const navireChart = Object.entries(byNavire)
      .map(([name, tonnage]) => ({ name, tonnage }))
      .sort((a, b) => b.tonnage - a.tonnage)

    // alertes
    const alerts = []
    const today = new Date().toISOString().split('T')[0]
    db.factures.forEach(f => {
      if (f.statut !== 'payée' && f.date_echeance < today) {
        const cli = getClient(f.client_id)
        alerts.push({ type: 'warning', msg: `Facture ${f.numero} (${cli?.nom || '?'}) échue — ${fmt(f.montant_total - f.montant_paye)} FCFA restants` })
      }
    })
    if (stockKg > 0) alerts.push({ type: 'info', msg: `${fmt(stockKg)} kg en attente chez SOCEF` })

    return { tonnageNet, stockKg, caTotal, creances, navireChart, alerts }
  }, [db])

  const navigate = useNavigate()
  const recentPesees = [...db.pesees].reverse().slice(0, 6)

  const COLORS = ['#097c82','#4fb4b8','#8fd0d2','#cfa24e','#b8872e']

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ocean-900">Tableau de bord</h1>
        <p className="text-sm text-ocean-400 mt-1 font-mono">
          {new Date().toLocaleDateString('fr-CI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <KpiCard label="Tonnage net total" value={`${fmt(stats.tonnageNet)} kg`} sub={`${db.pesees.length} pesée(s)`} accent />
        <KpiCard label="Chiffre d'affaires" value={`${fmt(stats.caTotal)} FCFA`} sub="toutes ventes" />
        <KpiCard label="Créances en cours" value={`${fmt(stats.creances)} FCFA`} sub={`${db.factures.filter(f=>f.statut!=='payée').length} facture(s)`} />
        <KpiCard label="Stock SOCEF" value={`${fmt(stats.stockKg)} kg`} sub={`${db.stock_socef.filter(s=>s.statut==='En stock').length} lot(s)`} />
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Graphique tonnage par navire */}
        <div className="card p-5 col-span-2">
          <p className="text-sm font-semibold text-ocean-700 mb-4 flex items-center gap-2">
            <Ship size={15} className="text-ocean-400" /> Tonnage net par navire
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.navireChart} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4fb4b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8fd0d2' }} axisLine={false} tickLine={false} tickFormatter={v => `${fmt(v)}`} />
              <Tooltip
                formatter={(v) => [`${fmt(v)} kg`, 'Tonnage']}
                contentStyle={{ background: '#022c2e', border: 'none', borderRadius: 8, fontSize: 12, color: '#eaf6f6' }}
              />
              <Bar dataKey="tonnage" radius={[4, 4, 0, 0]}>
                {stats.navireChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top créances clients */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-ocean-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-ocean-400" /> Créances clients
          </p>
          <div className="space-y-3">
            {db.clients.map(c => {
              const solde = soldeClient(c.id)
              if (solde <= 0) return null
              const maxSolde = Math.max(...db.clients.map(x => soldeClient(x.id)), 1)
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ocean-700 font-medium">{c.nom}</span>
                    <span className="font-mono text-ocean-500">{fmt(solde)} FCFA</span>
                  </div>
                  <ProgressBar value={solde} max={maxSolde} color="bg-sand-400" />
                </div>
              )
            })}
            {db.clients.every(c => soldeClient(c.id) <= 0) && (
              <p className="text-xs text-ocean-400 italic">Aucune créance en cours</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Journal récent */}
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ocean-700">Dernières pesées</p>
            <button onClick={() => navigate('/journal')} className="text-xs text-ocean-400 hover:text-ocean-600">Voir tout →</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr>
                {['Date','Navire','Client','Produit','Type','Total net'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-ocean-400 font-medium uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPesees.map(p => {
                const imp = db.importations.find(i => i.id === p.importation_id)
                const nav = imp ? getNavire(imp.navire_id) : null
                const cli = getClient(p.client_id)
                return (
                  <tr key={p.id} className="border-t border-ocean-50 hover:bg-ocean-50 transition-colors">
                    <td className="py-2.5 px-2 text-ocean-600">{fmtDate(p.date_pesee)}</td>
                    <td className="py-2.5 px-2 font-medium text-ocean-800">{nav?.nom || '—'}</td>
                    <td className="py-2.5 px-2 text-ocean-600">{cli?.nom || '—'}</td>
                    <td className="py-2.5 px-2"><span className="font-mono text-ocean-500">{p.produit}</span></td>
                    <td className="py-2.5 px-2"><Badge type={p.type_pesee} /></td>
                    <td className="py-2.5 px-2 font-semibold font-mono text-ocean-800">{fmt(totalNet(p))} kg</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Alertes */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-ocean-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-ocean-400" /> Alertes
          </p>
          {stats.alerts.length === 0 ? (
            <p className="text-xs text-ocean-400 italic">Aucune alerte active</p>
          ) : (
            stats.alerts.map((a, i) => (
              <AlertBox key={i} type={a.type}>{a.msg}</AlertBox>
            ))
          )}

          {/* Stock SOCEF rapide */}
          <div className="mt-4 pt-4 border-t border-ocean-100">
            <p className="text-xs font-semibold text-ocean-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Snowflake size={12} /> Stock SOCEF actif
            </p>
            {db.stock_socef.filter(s => s.statut === 'En stock').slice(0, 3).map(s => {
              const cli = getClient(s.client_id)
              return (
                <div key={s.id} className="flex justify-between text-xs py-1.5 border-b border-ocean-50">
                  <span className="text-ocean-600">{cli?.nom}</span>
                  <span className="font-mono font-medium text-ocean-800">{fmt(s.quantite_disponible)} kg</span>
                </div>
              )
            })}
            {db.stock_socef.filter(s => s.statut === 'En stock').length === 0 && (
              <p className="text-xs text-ocean-400 italic">Aucun stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
