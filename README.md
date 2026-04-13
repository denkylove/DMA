import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPesees, createPesee, deletePesee, getNavires, getClients } from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Filter } from 'lucide-react';

const fmt = n => Number(n||0).toLocaleString('fr-CI');
const PRODUITS = ['THON','AJI','BROKEN','SAWARA'];
const TYPES = ['DIRECT','SOCEF','CONTENEUR'];

function ModalPesee({ onClose, navires, clients }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    navire_id: navires[0]?.id || '',
    voyage: '',
    type_pesee: 'DIRECT',
    produit: 'THON',
    tonnage: '',
    client_id: clients[0]?.id || '',
    num_ticket: '',
    num_douanes: '',
    retranchement: '0',
    motif_retranch: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const totalNet = (parseFloat(form.tonnage)||0) - (parseFloat(form.retranchement)||0);

  const mut = useMutation({
    mutationFn: createPesee,
    onSuccess: () => { toast.success('Pesée enregistrée'); qc.invalidateQueries(); onClose(); },
    onError: e => toast.error(String(e)),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Nouvelle pesée</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-2">
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>set('date',e.target.value)}/></div>
            <div className="field"><label>Type de pesée</label>
              <select value={form.type_pesee} onChange={e=>set('type_pesee',e.target.value)}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label>Navire</label>
              <select value={form.navire_id} onChange={e=>set('navire_id',e.target.value)}>
                {navires.map(n=><option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
            <div className="field"><label>Voyage N°</label><input type="number" min="1" value={form.voyage} onChange={e=>set('voyage',e.target.value)} placeholder="ex: 3"/></div>
            <div className="field"><label>Produit</label>
              <select value={form.produit} onChange={e=>set('produit',e.target.value)}>
                {PRODUITS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field"><label>Client</label>
              <select value={form.client_id} onChange={e=>set('client_id',e.target.value)}>
                {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="field"><label>Tonnage brut (kg)</label><input type="number" value={form.tonnage} onChange={e=>set('tonnage',e.target.value)} placeholder="ex: 18500"/></div>
            <div className="field"><label>N° Ticket port</label><input value={form.num_ticket} onChange={e=>set('num_ticket',e.target.value)}/></div>
            <div className="field"><label>N° Douanes</label><input value={form.num_douanes} onChange={e=>set('num_douanes',e.target.value)}/></div>
            <div className="field"><label>Retranchement (kg)</label><input type="number" value={form.retranchement} onChange={e=>set('retranchement',e.target.value)}/></div>
          </div>
          <div className="field" style={{ marginTop: 4 }}><label>Motif retranchement</label><input value={form.motif_retranch} onChange={e=>set('motif_retranch',e.target.value)} placeholder="ex: DMA, BEN..."/></div>
          <div className="total-bar" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Total net calculé</span>
            <span className="total-val">{fmt(totalNet)} kg</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={()=>mut.mutate({...form,total_net:totalNet})} disabled={mut.isPending}>
            {mut.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Journal() {
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const qc = useQueryClient();

  const { data: pesees = [] } = useQuery({ queryKey: ['pesees', typeFilter], queryFn: () => getPesees(typeFilter !== 'all' ? { type: typeFilter } : {}) });
  const { data: navires = [] } = useQuery({ queryKey: ['navires'], queryFn: getNavires });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const delMut = useMutation({
    mutationFn: deletePesee,
    onSuccess: () => { toast.success('Supprimée'); qc.invalidateQueries(); },
    onError: e => toast.error(String(e)),
  });

  const filtered = typeFilter === 'all' ? pesees : pesees.filter(p => p.type_pesee === typeFilter);
  const sumTonnage = filtered.reduce((s,p) => s+p.tonnage, 0);
  const sumRetranch = filtered.reduce((s,p) => s+p.retranchement, 0);
  const sumTotal = filtered.reduce((s,p) => s+p.total_net, 0);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Journal de vente</span>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nouvelle pesée
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="tabs">
          {['all','DIRECT','SOCEF','CONTENEUR'].map(t => (
            <div key={t} className={`tab${typeFilter===t?' active':''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'Toutes' : t}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Navire</th><th>Voy.</th><th>Type</th>
                  <th>Produit</th><th>Tonnage</th><th>Client</th>
                  <th>N° Ticket</th><th>N° Douanes</th><th>Retranch.</th><th>Motif</th>
                  <th>Total net</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily:'var(--mono)',fontSize:12 }}>{p.date}</td>
                    <td>{p.navire_nom}</td>
                    <td style={{ fontFamily:'var(--mono)' }}>V{p.voyage}</td>
                    <td><span className={`badge ${p.type_pesee==='DIRECT'?'badge-green':p.type_pesee==='SOCEF'?'badge-blue':'badge-gray'}`}>{p.type_pesee}</span></td>
                    <td><span className="chip">{p.produit}</span></td>
                    <td style={{ fontFamily:'var(--mono)' }}>{fmt(p.tonnage)}</td>
                    <td>{p.client_nom}</td>
                    <td style={{ fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)' }}>{p.num_ticket}</td>
                    <td style={{ fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)' }}>{p.num_douanes}</td>
                    <td style={{ fontFamily:'var(--mono)' }}>{p.retranchement > 0 ? fmt(p.retranchement) : ''}</td>
                    <td style={{ fontSize:11,color:'var(--text3)' }}>{p.motif_retranch}</td>
                    <td style={{ fontFamily:'var(--mono)',fontWeight:600,color:'var(--accent)' }}>{fmt(p.total_net)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => { if(window.confirm('Supprimer cette pesée ?')) delMut.mutate(p.id); }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={13} className="empty">Aucune pesée enregistrée</td></tr>}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5}>Totaux ({filtered.length} lignes)</td>
                    <td>{fmt(sumTonnage)}</td>
                    <td colSpan={3}></td>
                    <td>{fmt(sumRetranch)}</td>
                    <td></td>
                    <td style={{ color:'var(--accent)' }}>{fmt(sumTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
      {showModal && navires.length > 0 && clients.length > 0 && (
        <ModalPesee onClose={() => setShowModal(false)} navires={navires} clients={clients} />
      )}
    </>
  );
}
