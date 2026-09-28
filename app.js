// ============================================================
// app.js — Fonctions communes à toutes les pages
// ============================================================

function renderSidebar(activePage) {
  const user = Auth.getCurrentUser();
  const settings = DB.getSettings();
  const nav = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord', perm: 'dashboard' },
    { id: 'products', icon: '📦', label: 'Produits', perm: 'products' },
    { id: 'sales', icon: '🛒', label: 'Ventes', perm: 'sales' },
    { id: 'purchases', icon: '📥', label: 'Achats', perm: 'purchases' },
    { id: 'customers', icon: '👥', label: 'Clients', perm: 'customers' },
    { id: 'suppliers', icon: '🚚', label: 'Fournisseurs', perm: 'suppliers' },
    { id: 'cash', icon: '💵', label: 'Caisse', perm: 'cash' },
    { id: 'reports', icon: '📈', label: 'Rapports', perm: 'reports' },
    { id: 'users', icon: '👤', label: 'Utilisateurs', perm: 'users' },
    { id: 'settings', icon: '⚙️', label: 'Paramètres', perm: 'settings' },
  ];
  const items = nav.filter(n => Auth.can(n.perm) || n.perm === 'dashboard');
  const html = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">🏪</span>
        <span class="sidebar-title">${settings.shopName || 'Ma Boutique'}</span>
      </div>
      <nav class="sidebar-nav">
        ${items.map(n => `
          <button class="nav-item ${n.id === activePage ? 'active' : ''}" onclick="navigate('${n.id}')">
            <span class="nav-icon">${n.icon}</span>
            <span class="nav-label">${n.label}</span>
          </button>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-item" onclick="Auth.logout()">
          <span class="nav-icon">🚪</span>
          <span class="nav-label">Déconnexion</span>
        </button>
      </div>
    </aside>`;
  return html;
}

function renderTopbar(title) {
  const user = Auth.getCurrentUser();
  const notifs = DB.getNotifications();
  return `
    <div class="topbar">
      <button class="topbar-toggle" onclick="toggleSidebar()">☰</button>
      <span class="topbar-title">${title}</span>
      <div class="topbar-actions">
        <button class="notif-btn" onclick="showNotifications()" title="Notifications">
          🔔
          ${notifs.length > 0 ? `<span class="notif-badge">${notifs.length}</span>` : ''}
        </button>
        <div class="user-chip">👤 ${user?.name || 'Utilisateur'}</div>
      </div>
    </div>`;
}

function navigate(page) {
  const pageMap = {
    dashboard: 'dashboard.html',
    products: 'products.html',
    sales: 'sales.html',
    purchases: 'purchases.html',
    customers: 'customers.html',
    suppliers: 'suppliers.html',
    cash: 'cash.html',
    reports: 'reports.html',
    users: 'users.html',
    settings: 'settings.html',
  };
  if (pageMap[page]) window.location.href = pageMap[page];
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) sb.classList.toggle('mobile-open');
  else sb.classList.toggle('collapsed');
}

function showNotifications() {
  const notifs = DB.getNotifications();
  if (notifs.length === 0) { toast('Aucune notification', 'info'); return; }
  const msg = notifs.map(n => `${n.type === 'danger' ? '🔴' : n.type === 'warning' ? '⚠️' : 'ℹ️'} ${n.msg}`).join('\n');
  alert('Notifications\n\n' + msg);
}

// Toast notification
function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type === 'error' ? 'error' : type === 'warn' ? 'warn' : ''}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Modal helpers
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// Confirm dialog
function confirmDelete(msg, cb) {
  if (confirm(msg || 'Confirmer la suppression ?')) cb();
}

// Theme
function applyTheme() {
  const settings = DB.getSettings();
  document.documentElement.setAttribute('data-theme', settings.theme || 'light');
}

// Format currency
function currency(n) { return fmt(n); }

// Simple bar chart
function renderBarChart(container, data, labels) {
  const max = Math.max(...data, 1);
  const bars = data.map((v, i) => `
    <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
      <div style="font-size:10px;color:var(--text-muted)">${fmt(v).replace(' FCFA','')}</div>
      <div class="chart-bar" style="height:${Math.round((v/max)*90)}px" title="${labels[i]}: ${fmt(v)}"></div>
      <div class="chart-label">${labels[i]}</div>
    </div>`).join('');
  container.innerHTML = `<div class="chart-bar-wrap" style="align-items:flex-end;gap:6px;height:130px;display:flex">${bars}</div>`;
}

// QR Code simple (text representation)
function generateQRPlaceholder(text) {
  return `<div style="font-family:monospace;font-size:10px;background:#fff;padding:8px;display:inline-block;border:1px solid #ccc">
    <div style="font-size:20px;letter-spacing:1px">▓▓▓░▓░▓▓▓</div>
    <div style="font-size:20px;letter-spacing:1px">▓░░░▓░░░▓</div>
    <div style="font-size:20px;letter-spacing:1px">▓░▓░░░▓░▓</div>
    <div style="font-size:20px;letter-spacing:1px">▓▓▓░░░▓▓▓</div>
    <div style="text-align:center;font-size:11px;margin-top:4px;color:#333">${text}</div>
  </div>`;
}

// Print helper
function printSection(html, title = '') {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}
    .no-border td,.no-border th{border:none}
    </style></head><body>${html}</body></html>`);
  w.document.close();
  w.print();
}

// Export JSON
function exportBackup() {
  const data = DB.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `Sauvegarde_Boutique_${d}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Sauvegarde exportée !');
}

// Import JSON
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      DB.importData(e.target.result);
      toast('Données importées avec succès !');
      setTimeout(() => location.reload(), 1000);
    } catch { toast('Fichier invalide', 'error'); }
  };
  reader.readAsText(file);
}
