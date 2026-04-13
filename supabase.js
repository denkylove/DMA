@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --ocean-500: #097c82;
    --sand-400: #cfa24e;
  }
  * { box-sizing: border-box; }
  body {
    background: #f0f4f4;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #0d2526;
    min-height: 100vh;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #e5eded; }
  ::-webkit-scrollbar-thumb { background: #4fb4b8; border-radius: 3px; }
}

@layer components {
  .sidebar-item {
    @apply flex items-center gap-3 px-4 py-2.5 text-sm text-ocean-300 rounded-lg cursor-pointer transition-all duration-150;
  }
  .sidebar-item:hover {
    @apply bg-ocean-800 text-white;
  }
  .sidebar-item.active {
    @apply bg-ocean-500 text-white font-medium;
  }

  .btn-primary {
    @apply bg-ocean-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ocean-600 transition-colors duration-150 flex items-center gap-2;
  }
  .btn-secondary {
    @apply bg-white text-ocean-700 text-sm border border-ocean-200 px-4 py-2 rounded-lg hover:bg-ocean-50 transition-colors duration-150 flex items-center gap-2;
  }
  .btn-danger {
    @apply bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-150;
  }

  .card {
    @apply bg-white rounded-xl border border-ocean-100 shadow-sm;
  }

  .input {
    @apply w-full px-3 py-2 text-sm border border-ocean-200 rounded-lg bg-white text-ocean-900 focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent transition-all;
  }
  .label {
    @apply block text-xs font-medium text-ocean-600 mb-1;
  }

  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
  }
  .badge-direct  { @apply bg-emerald-100 text-emerald-700; }
  .badge-socef   { @apply bg-blue-100 text-blue-700; }
  .badge-cont    { @apply bg-amber-100 text-amber-700; }
  .badge-paid    { @apply bg-emerald-100 text-emerald-700; }
  .badge-partial { @apply bg-amber-100 text-amber-700; }
  .badge-unpaid  { @apply bg-red-100 text-red-700; }
  .badge-neutral { @apply bg-ocean-100 text-ocean-700; }

  .th { @apply px-4 py-3 text-left text-xs font-semibold text-ocean-500 uppercase tracking-wider bg-ocean-50; }
  .td { @apply px-4 py-3 text-sm text-ocean-800 border-b border-ocean-50; }
  .tr-hover { @apply hover:bg-ocean-50 transition-colors; }

  .kpi-card {
    @apply bg-white rounded-xl border border-ocean-100 p-5;
  }
  .kpi-label { @apply text-xs font-medium text-ocean-500 uppercase tracking-wider mb-1; }
  .kpi-value { @apply text-2xl font-semibold text-ocean-900 font-mono; }
  .kpi-sub   { @apply text-xs text-ocean-400 mt-1; }

  .modal-overlay {
    @apply fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4;
  }
  .modal-box {
    @apply bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto;
  }

  .page-enter {
    animation: pageIn 0.2s ease-out;
  }
  @keyframes pageIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .stat-bar {
    @apply h-1.5 rounded-full bg-ocean-100 overflow-hidden mt-1;
  }
  .stat-bar-fill {
    @apply h-full rounded-full bg-ocean-400 transition-all duration-500;
  }
}
