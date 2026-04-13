import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFactures, createFacture, addPaiement,
  getNavires, createNavire,
  getImportations, createImportation,
  getEmployes, createEmploye, getPaie, genererPaie,
  getClients, getPesees
} from '../api';
import toast from 'react-hot-toast';
import { Plus, CreditCard, Ship, Users, Package } from 'lucide-react';

const fmt = n => Number(n||0).toLocaleString('fr-CI');
const today = () => new Date().toISOString().split('T')[0];
const MOIS = ['','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

// ──────────────────────────────────────────────────────────────────────────────
// FACTURES
// ──────────────────────────────────────────────────────────────────────────────
function ModalPaiement({ facture, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ montant:'', mode:'Virement', reference:'', date_paiement: today() });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const reste = facture.montant_total - facture.montant_paye;
  const mut = useMutation({ mutationFn: d=>addPaiement(facture.id,d), onSuccess:()=>{toast.success('Paiement enregistré');qc.invalidateQueries();onClose();}, onError:e=>toast.error(String(e)) });
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Paiement — {facture.num_facture}</h3><button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="alert alert-warning" style={{marginBottom:14}}>Reste à payer : <strong>{fmt(reste)} FCFA</strong></div>
          <div className="form-grid form-grid-2">
            <div className="field"><label>Montant (FCFA)</label><input type="number" max={reste} value={form.montant} onChange={e=>set('montant',e.target.value)}/></div>
            <div className="field"><label>Mode</label>
              <select value={form.mode} onChange={e=>set('mode',e.target.value)}><option>Espèces</option><option>Virement</option><option>Chèque</option><option>Acompte</option></select>
            </div>
            <div className="field"><label>Référence</label><input value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="N° virement/chèque"/></div>
            <div className="field"><label>Date</label><input type="date" value={form.date_paiement} onChange={e=>set('date_paiement',e.target.value)}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={!form.montant||mut.isPending}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function ModalFacture({ clients, pesees, onClose }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState(clients[0]?.id||'');
  const [echeance, setEcheance] = useState('');
  const [lignes, setLignes] = useState([{ pesee_id:'', quantite:'', prix_unitaire:'' }]);
  const total = lignes.reduce((s,l)=>s+(parseFloat(l.quantite)||0)*(parseFloat(l.prix_unitaire)||0),0);
  const clientPesees = pesees.filter(p=>p.client_id==clientId);

  const addLigne = () => setLignes(l=>[...l,{pesee_id:'',quantite:'',prix_unitaire:''}]);
  const setLigne = (i,k,v) => setLignes(l=>l.map((x,j)=>j===i?{...x,[k]:v}:x));
  const removeLigne = i => setLignes(l=>l.filter((_,j)=>j!==i));

  const onPeseeSelect = (i, pid) => {
    const p = pesees.find(x=>x.id==pid);
    setLigne(i,'pesee_id',pid);
    if(p) setLigne(i,'quantite',p.total_net);
  };

  const mut = useMutation({ mutationFn: createFacture, onSuccess:()=>{toast.success('Facture créée');qc.invalidateQueries();onClose();}, onError:e=>toast.error(String(e)) });

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{width:600}}>
        <div className="modal-header"><h3>Créer une facture</h3><button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid form-grid-2" style={{marginBottom:14}}>
            <div className="field"><label>Client</label>
              <select value={clientId} onChange={e=>setClientId(e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
            </div>
            <div className="field"><label>Date d'échéance</label><input type="date" value={echeance} onChange={e=>setEcheance(e.target.value)}/></div>
          </div>
          <div className="sep"/>
          {lignes.map((l,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,marginBottom:10,alignItems:'end'}}>
              <div className="field"><label>Pesée / référence</label>
                <select value={l.pesee_id} onChange={e=>onPeseeSelect(i,e.target.value)}>
                  <option value="">-- Pesée libre --</option>
                  {clientPesees.map(p=><option key={p.id} value={p.id}>{p.date} · {p.navire_nom} V{p.voyage} · {fmt(p.total_net)} kg</option>)}
                </select>
              </div>
              <div className="field"><label>Quantité (kg)</label><input type="number" value={l.quantite} onChange={e=>setLigne(i,'quantite',e.target.value)}/></div>
              <div className="field"><label>Prix/kg (FCFA)</label><input type="number" value={l.prix_unitaire} onChange={e=>setLigne(i,'prix_unitaire',e.target.value)}/></div>
              <button className="btn btn-danger btn-sm btn-icon" onClick={()=>removeLigne(i)} style={{marginBottom:1}}>✕</button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addLigne}><Plus size={12}/> Ligne</button>
          <div className="total-bar" style={{marginTop:14}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>Total facture</span>
            <span className="total-val">{fmt(total)} FCFA</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={()=>mut.mutate({client_id:clientId,date_echeance:echeance,lignes})} disabled={!total||mut.isPending}>Créer la facture</button>
        </div>
      </div>
    </div>
  );
}

export function Factures() {
  const [statut, setStatut] = useState('all');
  const [payFac, setPayFac] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: factures=[] } = useQuery({ queryKey:['factures',statut], queryFn:()=>getFactures(statut!=='all'?{statut}:{}) });
  const { data: clients=[] } = useQuery({ queryKey:['clients'], queryFn: getClients });
  const { data: pesees=[] } = useQuery({ queryKey:['pesees'], queryFn: getPesees });

  return (
    <>
      <div className="topbar"><span className="topbar-title">Factures</span>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}><Plus size={14}/> Nouvelle facture</button>
      </div>
      <div className="page-content">
        <div className="tabs">
          {['all','impayée','partielle','payée'].map(s=>(
            <div key={s} className={`tab${statut===s?' active':''}`} onClick={()=>setStatut(s)}>{s==='all'?'Toutes':s.charAt(0).toUpperCase()+s.slice(1)}</div>
          ))}
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>N° Facture</th><th>Client</th><th>Date</th><th>Échéance</th><th>Total</th><th>Payé</th><th>Reste</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {factures.map(f=>{
                  const reste=f.montant_total-f.montant_paye;
                  return (
                    <tr key={f.id}>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:600}}>{f.num_facture}</td>
                      <td>{f.client_nom}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{f.date_facture}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:f.date_echeance<today()&&f.statut!=='payée'?'var(--red)':undefined}}>{f.date_echeance||'—'}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{fmt(f.montant_total)}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--accent)'}}>{fmt(f.montant_paye)}</td>
                      <td style={{fontFamily:'var(--mono)',fontWeight:600,color:reste>0?'var(--amber)':'var(--text3)'}}>{fmt(reste)}</td>
                      <td><span className={`badge ${f.statut==='payée'?'badge-green':f.statut==='partielle'?'badge-amber':'badge-red'}`}>{f.statut}</span></td>
                      <td>{f.statut!=='payée'&&<button className="btn btn-secondary btn-sm" onClick={()=>setPayFac(f)}><CreditCard size={12}/> Paiement</button>}</td>
                    </tr>
                  );
                })}
                {!factures.length&&<tr><td colSpan={9} className="empty">Aucune facture</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {payFac && <ModalPaiement facture={payFac} onClose={()=>setPayFac(null)}/>}
      {showCreate && <ModalFacture clients={clients} pesees={pesees} onClose={()=>setShowCreate(false)}/>}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NAVIRES
// ──────────────────────────────────────────────────────────────────────────────
export function Navires() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({nom:'',pavillon:''});
  const qc = useQueryClient();
  const { data: navires=[] } = useQuery({ queryKey:['navires'], queryFn: getNavires });
  const mut = useMutation({ mutationFn: createNavire, onSuccess:()=>{toast.success('Navire ajouté');qc.invalidateQueries();setShowModal(false);setForm({nom:'',pavillon:''});}, onError:e=>toast.error(String(e)) });
  return (
    <>
      <div className="topbar"><span className="topbar-title">Navires</span>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}><Plus size={14}/> Nouveau navire</button>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Navire</th><th>Pavillon</th><th>Voyages</th><th>Tonnage total</th></tr></thead>
              <tbody>
                {navires.map(n=>(
                  <tr key={n.id}>
                    <td style={{fontWeight:600,display:'flex',alignItems:'center',gap:8}}><Ship size={14} style={{color:'var(--blue)',opacity:.6}}/>{n.nom}</td>
                    <td>{n.pavillon||'—'}</td>
                    <td>{n.nb_voyages}</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--accent)'}}>{fmt(n.tonnage_total)} kg</td>
                  </tr>
                ))}
                {!navires.length&&<tr><td colSpan={4} className="empty">Aucun navire</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Nouveau navire</h3><button className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="field"><label>Nom du navire *</label><input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="ex: DICHA UNO"/></div>
                <div className="field"><label>Pavillon</label><input value={form.pavillon} onChange={e=>setForm(f=>({...f,pavillon:e.target.value}))} placeholder="ex: Panama"/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={!form.nom||mut.isPending}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// IMPORTATIONS
// ──────────────────────────────────────────────────────────────────────────────
export function Importations() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ num_connaissement:'', navire_id:'', date_arrivee: today(), tonnage_brut:'', port:"Port d'Abidjan" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const qc = useQueryClient();
  const { data: importations=[] } = useQuery({ queryKey:['importations'], queryFn: getImportations });
  const { data: navires=[] } = useQuery({ queryKey:['navires'], queryFn: getNavires });
  const mut = useMutation({ mutationFn: createImportation, onSuccess:()=>{toast.success('Importation enregistrée');qc.invalidateQueries();setShowModal(false);}, onError:e=>toast.error(String(e)) });

  return (
    <>
      <div className="topbar"><span className="topbar-title">Importations</span>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm(f=>({...f,navire_id:navires[0]?.id||''}));setShowModal(true);}}><Plus size={14}/> Nouvelle importation</button>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Connaissement</th><th>Navire</th><th>Date arrivée</th><th>Tonnage brut</th><th>Port</th><th>Pesées liées</th><th>Statut</th></tr></thead>
              <tbody>
                {importations.map(i=>(
                  <tr key={i.id}>
                    <td style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:600}}>{i.num_connaissement}</td>
                    <td>{i.navire_nom}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>{i.date_arrivee}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{fmt(i.tonnage_brut)} kg</td>
                    <td>{i.port}</td>
                    <td>{i.nb_pesees}</td>
                    <td><span className={`badge ${i.statut==='Terminée'?'badge-green':'badge-blue'}`}>{i.statut}</span></td>
                  </tr>
                ))}
                {!importations.length&&<tr><td colSpan={7} className="empty">Aucune importation</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Nouvelle importation</h3><button className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="field"><label>N° Connaissement *</label><input value={form.num_connaissement} onChange={e=>set('num_connaissement',e.target.value)} placeholder="ex: CI-2025-001"/></div>
                <div className="field"><label>Navire *</label>
                  <select value={form.navire_id} onChange={e=>set('navire_id',e.target.value)}>{navires.map(n=><option key={n.id} value={n.id}>{n.nom}</option>)}</select>
                </div>
                <div className="field"><label>Date d'arrivée</label><input type="date" value={form.date_arrivee} onChange={e=>set('date_arrivee',e.target.value)}/></div>
                <div className="field"><label>Tonnage brut (kg)</label><input type="number" value={form.tonnage_brut} onChange={e=>set('tonnage_brut',e.target.value)}/></div>
                <div className="field" style={{gridColumn:'1/-1'}}><label>Port</label><input value={form.port} onChange={e=>set('port',e.target.value)}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={!form.num_connaissement||mut.isPending}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RESSOURCES HUMAINES
// ──────────────────────────────────────────────────────────────────────────────
export function RessourcesHumaines() {
  const [showEmp, setShowEmp] = useState(false);
  const [showPaie, setShowPaie] = useState(false);
  const [formEmp, setFormEmp] = useState({nom:'',prenom:'',poste:'',date_embauche:'',salaire_base:0});
  const [formPaie, setFormPaie] = useState({employe_id:'',mois:new Date().getMonth()+1,annee:new Date().getFullYear(),taux_charges:15,date_paiement:today()});
  const set = (s,k,v) => s==='emp'?setFormEmp(f=>({...f,[k]:v})):setFormPaie(f=>({...f,[k]:v}));
  const qc = useQueryClient();
  const { data: employes=[] } = useQuery({ queryKey:['employes'], queryFn: getEmployes });
  const { data: paie=[] } = useQuery({ queryKey:['paie'], queryFn: getPaie });
  const mutEmp = useMutation({ mutationFn: createEmploye, onSuccess:()=>{toast.success('Employé ajouté');qc.invalidateQueries();setShowEmp(false);}, onError:e=>toast.error(String(e)) });
  const mutPaie = useMutation({ mutationFn: genererPaie, onSuccess:r=>{toast.success(`Paie générée — Net : ${fmt(r.net)} FCFA`);qc.invalidateQueries();setShowPaie(false);}, onError:e=>toast.error(String(e)) });

  return (
    <>
      <div className="topbar"><span className="topbar-title">Ressources humaines</span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={()=>{setFormPaie(f=>({...f,employe_id:employes[0]?.id||''}));setShowPaie(true);}}>Générer paie</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowEmp(true)}><Plus size={14}/> Employé</button>
        </div>
      </div>
      <div className="page-content">
        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><span className="card-title">Effectif ({employes.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom complet</th><th>Poste</th><th>Date embauche</th><th>Salaire base</th><th>Statut</th></tr></thead>
              <tbody>
                {employes.map(e=>(
                  <tr key={e.id}>
                    <td style={{fontWeight:500}}>{e.prenom} {e.nom}</td>
                    <td>{e.poste}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>{e.date_embauche}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{fmt(e.salaire_base)} FCFA</td>
                    <td><span className={`badge ${e.statut==='Actif'?'badge-green':'badge-gray'}`}>{e.statut}</span></td>
                  </tr>
                ))}
                {!employes.length&&<tr><td colSpan={5} className="empty">Aucun employé</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Bulletin de paie</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employé</th><th>Poste</th><th>Mois</th><th>Brut</th><th>Charges</th><th>Net</th><th>Payé le</th></tr></thead>
              <tbody>
                {paie.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.prenom} {p.nom}</td>
                    <td style={{fontSize:12,color:'var(--text2)'}}>{p.poste}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{MOIS[p.mois]} {p.annee}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{fmt(p.salaire_brut)}</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--amber)'}}>{fmt(p.charges)}</td>
                    <td style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--accent)'}}>{fmt(p.salaire_net)}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>{p.date_paiement}</td>
                  </tr>
                ))}
                {!paie.length&&<tr><td colSpan={7} className="empty">Aucune paie générée</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showEmp&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowEmp(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Nouvel employé</h3><button className="btn btn-secondary btn-sm" onClick={()=>setShowEmp(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="field"><label>Nom *</label><input value={formEmp.nom} onChange={e=>set('emp','nom',e.target.value)}/></div>
                <div className="field"><label>Prénom *</label><input value={formEmp.prenom} onChange={e=>set('emp','prenom',e.target.value)}/></div>
                <div className="field"><label>Poste</label><input value={formEmp.poste} onChange={e=>set('emp','poste',e.target.value)}/></div>
                <div className="field"><label>Date embauche</label><input type="date" value={formEmp.date_embauche} onChange={e=>set('emp','date_embauche',e.target.value)}/></div>
                <div className="field" style={{gridColumn:'1/-1'}}><label>Salaire de base (FCFA)</label><input type="number" value={formEmp.salaire_base} onChange={e=>set('emp','salaire_base',e.target.value)}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowEmp(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={()=>mutEmp.mutate(formEmp)} disabled={!formEmp.nom||mutEmp.isPending}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      {showPaie&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowPaie(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Générer la paie</h3><button className="btn btn-secondary btn-sm" onClick={()=>setShowPaie(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="field"><label>Employé</label>
                  <select value={formPaie.employe_id} onChange={e=>set('paie','employe_id',e.target.value)}>{employes.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</select>
                </div>
                <div className="field"><label>Taux charges (%)</label><input type="number" value={formPaie.taux_charges} onChange={e=>set('paie','taux_charges',e.target.value)}/></div>
                <div className="field"><label>Mois</label>
                  <select value={formPaie.mois} onChange={e=>set('paie','mois',e.target.value)}>{MOIS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
                </div>
                <div className="field"><label>Année</label><input type="number" value={formPaie.annee} onChange={e=>set('paie','annee',e.target.value)}/></div>
                <div className="field"><label>Date de paiement</label><input type="date" value={formPaie.date_paiement} onChange={e=>set('paie','date_paiement',e.target.value)}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowPaie(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={()=>mutPaie.mutate(formPaie)} disabled={!formPaie.employe_id||mutPaie.isPending}>Générer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Factures;
