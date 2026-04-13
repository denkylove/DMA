// src/hooks/useDB.js
// Ce hook simule la base de données avec les données de votre fichier Excel.
// Pour basculer sur Supabase : remplacez chaque fonction par un appel supabase.from(...)

import { useState, useCallback } from 'react'

const INITIAL = {
  navires: [
    { id: 1, nom: 'DICHA UNO',    pavillon: 'Panama' },
    { id: 2, nom: 'DICHA SIETE',  pavillon: 'Panama' },
    { id: 3, nom: 'JC GLORIA',    pavillon: 'Liberia' },
    { id: 4, nom: 'JC VICTORIA',  pavillon: 'Liberia' },
  ],
  produits: ['THON', 'AJI', 'BROKEN', 'SAWARA'],
  clients: [
    { id: 1, nom: 'BEN',            telephone: '', email: '', adresse: '', limite_credit: 0, statut: 'Actif' },
    { id: 2, nom: 'CREME FRAICHE',  telephone: '', email: '', adresse: '', limite_credit: 0, statut: 'Actif' },
    { id: 3, nom: 'YOMBA',          telephone: '', email: '', adresse: '', limite_credit: 0, statut: 'Actif' },
  ],
  importations: [
    { id: 1, navire_id: 1, numero_voyage: 3, numero_connaissement: 'CI-2026-001', date_arrivee: '2026-04-05', tonnage_brut: 5000,  port: "Port d'Abidjan", statut: 'Terminée' },
    { id: 2, navire_id: 2, numero_voyage: 2, numero_connaissement: 'CI-2012-002', date_arrivee: '2012-12-13', tonnage_brut: 2222,  port: "Port d'Abidjan", statut: 'Terminée' },
    { id: 3, navire_id: 1, numero_voyage: 7, numero_connaissement: 'CI-2012-003', date_arrivee: '2012-12-12', tonnage_brut: 39000, port: "Port d'Abidjan", statut: 'Terminée' },
    { id: 4, navire_id: 2, numero_voyage: 1, numero_connaissement: 'CI-2024-004', date_arrivee: '2024-01-01', tonnage_brut: 5600,  port: "Port d'Abidjan", statut: 'Terminée' },
    { id: 5, navire_id: 3, numero_voyage: 2, numero_connaissement: 'CI-2024-005', date_arrivee: '2024-01-01', tonnage_brut: 6700,  port: "Port d'Abidjan", statut: 'En cours' },
  ],
  pesees: [
    { id:1,  importation_id:1, client_id:1, date_pesee:'2026-04-05', type_pesee:'DIRECT',   produit:'THON',   tonnage:5000, numero_ticket:'1234',         numero_douanes:'12345', retranchement:0,  motif_retranch:'',    prix_unitaire:950 },
    { id:2,  importation_id:2, client_id:2, date_pesee:'2012-12-13', type_pesee:'DIRECT',   produit:'BROKEN', tonnage:2222, numero_ticket:'1223',         numero_douanes:'1231',  retranchement:22, motif_retranch:'BEN', prix_unitaire:800 },
    { id:3,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:4,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:5,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:6,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:7,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:8,  importation_id:3, client_id:3, date_pesee:'2012-12-12', type_pesee:'SOCEF',    produit:'AJI',    tonnage:6500, numero_ticket:'12',           numero_douanes:'22',    retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
    { id:9,  importation_id:4, client_id:3, date_pesee:'2024-01-01', type_pesee:'DIRECT',   produit:'THON',   tonnage:5600, numero_ticket:'P1/2024/1511', numero_douanes:'1',     retranchement:60, motif_retranch:'DMA', prix_unitaire:920 },
    { id:10, importation_id:5, client_id:null, date_pesee:'2024-01-01', type_pesee:'DIRECT', produit:'THON',  tonnage:6700, numero_ticket:'',             numero_douanes:'',      retranchement:0,  motif_retranch:'',    prix_unitaire:0 },
  ],
  stock_socef: [
    { id:1, pesee_id:3,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
    { id:2, pesee_id:4,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
    { id:3, pesee_id:5,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
    { id:4, pesee_id:6,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
    { id:5, pesee_id:7,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
    { id:6, pesee_id:8,  client_id:3, date_entree:'2012-12-12', quantite_entree:6500, quantite_disponible:6500, frais_congelation:325000, statut:'En stock' },
  ],
  factures: [
    { id:1, client_id:1, numero:'FAC-2026-001', date_facture:'2026-04-05', date_echeance:'2026-05-05', montant_total:4750000, montant_paye:2000000, statut:'partielle' },
    { id:2, client_id:2, numero:'FAC-2012-001', date_facture:'2012-12-13', date_echeance:'2013-01-13', montant_total:1760000, montant_paye:1760000, statut:'payée' },
  ],
  paiements: [
    { id:1, facture_id:1, date_paiement:'2026-04-10', montant:2000000, mode:'Virement', reference:'VIR-0088' },
    { id:2, facture_id:2, date_paiement:'2012-12-20', montant:1760000, mode:'Espèces',  reference:'' },
  ],
  employes: [
    { id:1, nom:'Kouamé',  prenom:'Adou',    poste:'Responsable portuaire', date_embauche:'2020-01-15', salaire_base:450000, statut:'Actif' },
    { id:2, nom:'Traoré',  prenom:'Aminata', poste:'Comptable',             date_embauche:'2021-06-01', salaire_base:380000, statut:'Actif' },
  ],
  paie: [
    { id:1, employe_id:1, mois:3, annee:2025, salaire_brut:450000, charges:67500, salaire_net:382500, date_paiement:'2025-03-31' },
    { id:2, employe_id:2, mois:3, annee:2025, salaire_brut:380000, charges:57000, salaire_net:323000, date_paiement:'2025-03-31' },
  ],
  _seq: { navires:5, clients:4, importations:6, pesees:11, stock:7, factures:3, paie:3, employes:3, paiements:3 }
}

// Calculer le total net depuis une pesée
export function totalNet(p) { return (p.tonnage || 0) - (p.retranchement || 0) }
export function montantTotal(p) { return totalNet(p) * (p.prix_unitaire || 0) }
export const fmt = n => Number(n || 0).toLocaleString('fr-CI')
export const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-CI') : '—'

// Store global simple (sans Redux pour garder le code léger)
let _store = JSON.parse(localStorage.getItem('thonimport_db') || 'null') || INITIAL
const _listeners = new Set()

function save() {
  localStorage.setItem('thonimport_db', JSON.stringify(_store))
  _listeners.forEach(fn => fn())
}

export function useDB() {
  const [, forceRender] = useState(0)

  const subscribe = useCallback(() => {
    const fn = () => forceRender(n => n + 1)
    _listeners.add(fn)
    return () => _listeners.delete(fn)
  }, [])

  // Écouter les changements
  useState(() => { const unsub = subscribe(); return unsub })

  const db = _store

  // ── NAVIRES ──
  const addNavire = (data) => {
    _store.navires.push({ id: _store._seq.navires++, ...data })
    save()
  }

  // ── CLIENTS ──
  const addClient = (data) => {
    _store.clients.push({ id: _store._seq.clients++, ...data })
    save()
  }
  const updateClient = (id, data) => {
    const i = _store.clients.findIndex(c => c.id === id)
    if (i >= 0) { _store.clients[i] = { ..._store.clients[i], ...data }; save() }
  }

  // ── IMPORTATIONS ──
  const addImportation = (data) => {
    _store.importations.push({ id: _store._seq.importations++, statut: 'En cours', ...data })
    save()
  }
  const updateImportation = (id, data) => {
    const i = _store.importations.findIndex(x => x.id === id)
    if (i >= 0) { _store.importations[i] = { ..._store.importations[i], ...data }; save() }
  }

  // ── PESÉES ──
  const addPesee = (data) => {
    const pesee = { id: _store._seq.pesees++, ...data }
    _store.pesees.push(pesee)
    // Si SOCEF → créer entrée stock
    if (data.type_pesee === 'SOCEF') {
      _store.stock_socef.push({
        id: _store._seq.stock++,
        pesee_id: pesee.id,
        client_id: data.client_id,
        date_entree: data.date_pesee,
        quantite_entree: totalNet(pesee),
        quantite_disponible: totalNet(pesee),
        frais_congelation: 0,
        statut: 'En stock'
      })
    }
    save()
    return pesee
  }
  const updatePesee = (id, data) => {
    const i = _store.pesees.findIndex(p => p.id === id)
    if (i >= 0) { _store.pesees[i] = { ..._store.pesees[i], ...data }; save() }
  }
  const deletePesee = (id) => {
    _store.pesees = _store.pesees.filter(p => p.id !== id)
    save()
  }

  // ── STOCK SOCEF ──
  const updateStock = (id, data) => {
    const i = _store.stock_socef.findIndex(s => s.id === id)
    if (i >= 0) { _store.stock_socef[i] = { ..._store.stock_socef[i], ...data }; save() }
  }
  const sortieSocef = (stock_id, qte) => {
    const i = _store.stock_socef.findIndex(s => s.id === stock_id)
    if (i >= 0) {
      _store.stock_socef[i].quantite_disponible -= qte
      if (_store.stock_socef[i].quantite_disponible <= 0) _store.stock_socef[i].statut = 'Sorti'
      save()
    }
  }

  // ── FACTURES ──
  const addFacture = (data) => {
    _store.factures.push({ id: _store._seq.factures++, montant_paye: 0, statut: 'impayée', ...data })
    save()
  }
  const addPaiement = (data) => {
    _store.paiements.push({ id: _store._seq.paiements++, ...data })
    // recalculer le statut de la facture
    const fac = _store.factures.find(f => f.id === data.facture_id)
    if (fac) {
      const totalPaye = _store.paiements.filter(p => p.facture_id === fac.id).reduce((s, p) => s + p.montant, 0)
      fac.montant_paye = totalPaye
      fac.statut = totalPaye >= fac.montant_total ? 'payée' : totalPaye > 0 ? 'partielle' : 'impayée'
    }
    save()
  }

  // ── RH ──
  const addEmploye = (data) => {
    _store.employes.push({ id: _store._seq.employes++, statut: 'Actif', ...data })
    save()
  }
  const addPaie = (data) => {
    _store.paie.push({ id: _store._seq.paie++, ...data })
    save()
  }

  // ── HELPERS ──
  const getNavire = (id) => db.navires.find(n => n.id === id)
  const getClient = (id) => db.clients.find(c => c.id === id)
  const getImportation = (id) => db.importations.find(i => i.id === id)
  const getPeseesByImport = (imp_id) => db.pesees.filter(p => p.importation_id === imp_id)
  const getFacturesByClient = (cli_id) => db.factures.filter(f => f.client_id === cli_id)
  const getPaiementsByFacture = (fac_id) => db.paiements.filter(p => p.facture_id === fac_id)

  const soldeClient = (cli_id) =>
    getFacturesByClient(cli_id).reduce((s, f) => s + (f.montant_total - f.montant_paye), 0)

  const resetDB = () => {
    _store = JSON.parse(JSON.stringify(INITIAL))
    save()
  }

  return {
    db,
    // navires
    addNavire,
    // clients
    addClient, updateClient,
    // importations
    addImportation, updateImportation,
    // pesées
    addPesee, updatePesee, deletePesee,
    // socef
    updateStock, sortieSocef,
    // factures/paiements
    addFacture, addPaiement,
    // rh
    addEmploye, addPaie,
    // helpers
    getNavire, getClient, getImportation,
    getPeseesByImport, getFacturesByClient, getPaiementsByFacture,
    soldeClient,
    resetDB,
  }
}
