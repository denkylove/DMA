import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockSocef, sortieSocef, getClients } from '../api';
import toast from 'react-hot-toast';
import { ArrowDownToLine } from 'lucide-react';

const fmt = n => Number(n||0).toLocaleString('fr-CI');

function ModalSortie({ lot, clients, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ stock_id: lot.id, date_sortie: new Date().toISOString().split('T')[0], qte_sortie: '', client_id: clients[0]?.id||'', num_bon: '' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const mut = useMutation({ mutationFn: sortieSocef, onSuccess:()=>{toast.success('Sortie enregistrée');qc.invalidateQueries();onClose();}, onError:e=>toast.error(String(e)) });
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Sortie stock SOCEF — {lot.navire_nom} V{lot.voyage}</h3><button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="alert alert-info" style={{marginBottom:14}}>Disponible : <strong>{fmt(lot.qte_disponible)} kg</strong> de {lot.produit}</div>
          <div className="form-grid form-grid-2">
            <div className="field"><label>Date sortie</label><input type="date" value={form.date_sortie} onChange={e=>set('date_sortie',e.target.value)}/></div>
            <div className="field"><label>Quantité sortie (kg)</label><input type="number" max={lot.qte_disponible} value={form.qte_sortie} onChange={e=>set('qte_sortie',e.target.value)}/></div>
            <div className="field"><label>Client destinataire</label>
              <select value={form.client_id} onChange={e=>set('client_id',e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
            </div>
            <div className="field"><label>N° Bon de sortie</label><input value={form.num_bon} onChange={e=>set('num_bon',e.target.value)}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={!form.qte_sortie||mut.isPending}>Enregistrer sortie</button>
        </div>
      </div>
    </div>
  );
}

export default function StockSocef() {
  const [selectedLot, setSelectedLot] = useState(null);
  const { data: stock=[] } = useQuery({ queryKey:['stock-socef'], queryFn: getStockSocef });
  const { data: clients=[] } = useQuery({ queryKey:['clients'], queryFn: getClients });

  const totalDispo = stock.filter(s=>s.statut==='En stock').reduce((s,x)=>s+x.qte_disponible,0);
  const totalEntree = stock.reduce((s,x)=>s+x.qte_entree,0);

  return (
    <>
      <div className="topbar"><span className="topbar-title">Stock SOCEF</span></div>
      <div className="page-content">
        <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
          <div className="kpi-card kpi-blue"><div className="kpi-label">Tonnage disponible</div><div className="kpi-value">{fmt(totalDispo)} kg</div></div>
          <div className="kpi-card"><div className="kpi-label">Tonnage total entré</div><div className="kpi-value">{fmt(totalEntree)} kg</div></div>
          <div className="kpi-card"><div className="kpi-label">Lots actifs</div><div className="kpi-value">{stock.filter(s=>s.statut==='En stock').length}</div></div>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date entrée</th><th>Navire</th><th>Voy.</th><th>Produit</th><th>Client</th><th>Qté entrée</th><th>Disponible</th><th>Frais (FCFA)</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {stock.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>{s.date_entree}</td>
                    <td>{s.navire_nom}</td>
                    <td style={{fontFamily:'var(--mono)'}}>V{s.voyage}</td>
                    <td><span className="chip">{s.produit}</span></td>
                    <td>{s.client_nom}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{fmt(s.qte_entree)}</td>
                    <td style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--blue)'}}>{fmt(s.qte_disponible)}</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--amber)'}}>{s.frais_congelation>0?fmt(s.frais_congelation):'—'}</td>
                    <td><span className={`badge ${s.statut==='En stock'?'badge-blue':'badge-gray'}`}>{s.statut}</span></td>
                    <td>{s.statut==='En stock'&&<button className="btn btn-secondary btn-sm" onClick={()=>setSelectedLot(s)}><ArrowDownToLine size={12}/> Sortie</button>}</td>
                  </tr>
                ))}
                {!stock.length && <tr><td colSpan={10} className="empty">Aucun stock SOCEF</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedLot && <ModalSortie lot={selectedLot} clients={clients} onClose={()=>setSelectedLot(null)}/>}
    </>
  );
}
