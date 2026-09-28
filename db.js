// ============================================================
// DB.js — Base de données locale (localStorage)
// ============================================================
const DB = {
  KEYS: {
    settings: 'boutique_settings',
    users: 'boutique_users',
    categories: 'boutique_categories',
    products: 'boutique_products',
    customers: 'boutique_customers',
    suppliers: 'boutique_suppliers',
    sales: 'boutique_sales',
    purchases: 'boutique_purchases',
    cash: 'boutique_cash',
    expenses: 'boutique_expenses',
    stockMovements: 'boutique_stock_movements',
    activityLog: 'boutique_activity_log',
    notifications: 'boutique_notifications',
  },

  init() {
    const defaultSettings = {
      shopName: 'TECH-ACCESS',
      phone: '', address: '', legal: '',
      currency: 'FCFA', loginRequired: true,
      theme: 'light', language: 'fr',
      invoicePrefix: 'FAC', receiptPrefix: 'REC',
      counterInvoice: 1, counterReceipt: 1, counterSale: 1, counterPurchase: 1,
      startupAnimationEnabled: true,
      startupAnimationDuration: 15,
      startupAnimationCustomDuration: 20
    };
    const existingSettings = this.get(this.KEYS.settings);
    this.set(this.KEYS.settings, { ...defaultSettings, ...(existingSettings || {}) });

    // Répare automatiquement les anciennes installations dont la liste utilisateurs
    // est absente, vide ou partiellement corrompue. Les utilisateurs existants sont conservés.
    let users = this.get(this.KEYS.users);
    if (!Array.isArray(users)) users = [];
    users = users.filter(u => u && typeof u === 'object');
    const admin = users.find(u => String(u.username || '').trim().toLowerCase() === 'admin');
    if (!admin) {
      users.unshift({
        id: 1, username: 'admin', password: 'admin123',
        role: 'admin', name: 'Administrateur', active: true,
        permissions: { dashboard:true, products:true, sales:true, purchases:true,
          customers:true, suppliers:true, cash:true, reports:true,
          users:true, settings:true }
      });
    } else {
      // Garantit que l'administrateur principal reste utilisable.
      admin.id = 1;
      admin.username = 'admin';
      admin.role = 'admin';
      admin.active = true;
      admin.permissions = { dashboard:true, products:true, sales:true, purchases:true,
        customers:true, suppliers:true, cash:true, reports:true,
        users:true, settings:true, ...(admin.permissions || {}) };
      if (!admin.password) admin.password = 'admin123';
    }
    const usedIds = new Set();
    let nextId = 2;
    users = users.map((u, i) => {
      let id = (i === 0 && String(u.username || '').trim().toLowerCase() === 'admin') ? 1 : Number(u.id);
      if (!Number.isFinite(id) || id <= 0 || usedIds.has(id) || id === 1 && i !== 0) {
        while (usedIds.has(nextId) || nextId === 1) nextId++;
        id = nextId++;
      }
      usedIds.add(id);
      return {
        ...u, id,
        username: String(u.username || '').trim(),
        name: String(u.name || u.username || 'Utilisateur').trim(),
        active: u.active !== false,
        permissions: u.permissions || {}
      };
    });
    this.set(this.KEYS.users, users);

    if (!this.get(this.KEYS.categories)) {
      this.set(this.KEYS.categories, [
        {id:1,name:'Chargeurs',active:true},{id:2,name:'Câbles',active:true},
        {id:3,name:'Écouteurs',active:true},{id:4,name:'Coques',active:true},
        {id:5,name:'Vitres de protection',active:true},{id:6,name:'Powerbanks',active:true},
        {id:7,name:'Cartes mémoire',active:true},{id:8,name:'Clés USB',active:true},
        {id:9,name:'Montres connectées',active:true},{id:10,name:'Autres',active:true}
      ]);
    }
    if (!this.get(this.KEYS.products)) this.set(this.KEYS.products, []);
    if (!this.get(this.KEYS.customers)) this.set(this.KEYS.customers, []);
    if (!this.get(this.KEYS.suppliers)) this.set(this.KEYS.suppliers, []);
    if (!this.get(this.KEYS.sales)) this.set(this.KEYS.sales, []);
    if (!this.get(this.KEYS.purchases)) this.set(this.KEYS.purchases, []);
    if (!this.get(this.KEYS.cash)) this.set(this.KEYS.cash, { balance: 0, entries: [] });
    if (!this.get(this.KEYS.expenses)) this.set(this.KEYS.expenses, []);
    if (!this.get(this.KEYS.stockMovements)) this.set(this.KEYS.stockMovements, []);
    if (!this.get(this.KEYS.activityLog)) this.set(this.KEYS.activityLog, []);
    if (!this.get(this.KEYS.notifications)) this.set(this.KEYS.notifications, []);
  },

  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  getSettings() { return this.get(this.KEYS.settings) || {}; },
  saveSettings(s) { this.set(this.KEYS.settings, s); },

  // Users
  getUsers() { return this.get(this.KEYS.users) || []; },
  saveUsers(u) { this.set(this.KEYS.users, u); },
  addUser(u) { const users = this.getUsers(); u.id = Date.now(); users.push(u); this.saveUsers(users); return u; },
  updateUser(id, data) {
    const users = this.getUsers().map(u => u.id === id ? {...u, ...data} : u);
    this.saveUsers(users);
  },
  deleteUser(id) { this.saveUsers(this.getUsers().filter(u => u.id !== id)); },

  // Categories
  getCategories() { return this.get(this.KEYS.categories) || []; },
  saveCategories(c) { this.set(this.KEYS.categories, c); },
  addCategory(c) { const cats = this.getCategories(); c.id = Date.now(); cats.push(c); this.saveCategories(cats); return c; },
  updateCategory(id, data) { this.saveCategories(this.getCategories().map(c => c.id===id?{...c,...data}:c)); },
  deleteCategory(id) { this.saveCategories(this.getCategories().filter(c=>c.id!==id)); },

  // Products
  getProducts() { return this.get(this.KEYS.products) || []; },
  saveProducts(p) { this.set(this.KEYS.products, p); },
  addProduct(p) {
    const products = this.getProducts();
    p.id = Date.now();
    p.code = 'P' + String(products.length+1).padStart(4,'0');
    p.dateAdded = new Date().toISOString();
    products.push(p);
    this.saveProducts(products);
    this.addStockMovement({ productId: p.id, type: 'initial', qty: p.stock, date: new Date().toISOString(), note: 'Stock initial' });
    return p;
  },
  updateProduct(id, data) { this.saveProducts(this.getProducts().map(p=>p.id===id?{...p,...data}:p)); },
  deleteProduct(id) { this.saveProducts(this.getProducts().filter(p=>p.id!==id)); },
  getProductById(id) { return this.getProducts().find(p=>p.id===id); },

  // Stock Movements
  getStockMovements() { return this.get(this.KEYS.stockMovements) || []; },
  addStockMovement(m) {
    const mvs = this.getStockMovements();
    m.id = Date.now() + Math.random();
    mvs.push(m);
    this.set(this.KEYS.stockMovements, mvs);
  },

  // Customers
  getCustomers() { return this.get(this.KEYS.customers) || []; },
  saveCustomers(c) { this.set(this.KEYS.customers, c); },
  addCustomer(c) { const cs = this.getCustomers(); c.id = Date.now(); c.dateAdded = new Date().toISOString(); c.credit = 0; cs.push(c); this.saveCustomers(cs); return c; },
  updateCustomer(id, data) { this.saveCustomers(this.getCustomers().map(c=>c.id===id?{...c,...data}:c)); },
  deleteCustomer(id) { this.saveCustomers(this.getCustomers().filter(c=>c.id!==id)); },
  getCustomerById(id) { return this.getCustomers().find(c=>c.id===id); },

  // Suppliers
  getSuppliers() { return this.get(this.KEYS.suppliers) || []; },
  saveSuppliers(s) { this.set(this.KEYS.suppliers, s); },
  addSupplier(s) { const ss = this.getSuppliers(); s.id = Date.now(); ss.push(s); this.saveSuppliers(ss); return s; },
  updateSupplier(id, data) { this.saveSuppliers(this.getSuppliers().map(s=>s.id===id?{...s,...data}:s)); },
  deleteSupplier(id) { this.saveSuppliers(this.getSuppliers().filter(s=>s.id!==id)); },

  // Sales
  getSales() { return this.get(this.KEYS.sales) || []; },
  saveSales(s) { this.set(this.KEYS.sales, s); },
  addSale(sale) {
    const sales = this.getSales();
    const settings = this.getSettings();
    sale.id = Date.now();
    sale.number = settings.receiptPrefix + '-' + new Date().getFullYear() + '-' + String(settings.counterReceipt).padStart(5,'0');
    sale.invoiceNumber = settings.invoicePrefix + '-' + new Date().getFullYear() + '-' + String(settings.counterInvoice).padStart(5,'0');
    sale.date = new Date().toISOString();
    sale.status = 'completed';
    sales.push(sale);
    this.saveSales(sales);
    // Update stock
    sale.items.forEach(item => {
      const p = this.getProductById(item.productId);
      if (p) {
        this.updateProduct(p.id, { stock: (p.stock || 0) - item.qty });
        this.addStockMovement({ productId: p.id, type: 'sale', qty: -item.qty, date: sale.date, ref: sale.number });
      }
    });
    // Update cash
    const cash = this.get(this.KEYS.cash);
    cash.balance += sale.amountPaid || sale.total;
    cash.entries.push({ type: 'in', amount: sale.amountPaid || sale.total, ref: sale.number, date: sale.date, note: 'Vente' });
    this.set(this.KEYS.cash, cash);
    // Update counters
    settings.counterReceipt++;
    settings.counterInvoice++;
    this.saveSettings(settings);
    return sale;
  },
  cancelSale(id) {
    const sales = this.getSales().map(s => {
      if (s.id === id) {
        // Restore stock
        s.items.forEach(item => {
          const p = this.getProductById(item.productId);
          if (p) this.updateProduct(p.id, { stock: (p.stock || 0) + item.qty });
        });
        return { ...s, status: 'cancelled' };
      }
      return s;
    });
    this.saveSales(sales);
  },

  // Purchases
  getPurchases() { return this.get(this.KEYS.purchases) || []; },
  savePurchases(p) { this.set(this.KEYS.purchases, p); },
  addPurchase(purchase) {
    const purchases = this.getPurchases();
    const settings = this.getSettings();
    purchase.id = Date.now();
    purchase.number = 'ACH-' + new Date().getFullYear() + '-' + String(settings.counterPurchase).padStart(5,'0');
    purchase.date = new Date().toISOString();
    purchases.push(purchase);
    this.savePurchases(purchases);
    // Update stock
    purchase.items.forEach(item => {
      const p = this.getProductById(item.productId);
      if (p) {
        this.updateProduct(p.id, { stock: (p.stock||0) + item.qty, purchasePrice: item.price });
        this.addStockMovement({ productId: p.id, type: 'purchase', qty: item.qty, date: purchase.date, ref: purchase.number });
      }
    });
    // Update cash
    const cash = this.get(this.KEYS.cash);
    cash.balance -= purchase.total;
    cash.entries.push({ type: 'out', amount: purchase.total, ref: purchase.number, date: purchase.date, note: 'Achat stock' });
    this.set(this.KEYS.cash, cash);
    settings.counterPurchase++;
    this.saveSettings(settings);
    return purchase;
  },

  // Cash
  getCash() { return this.get(this.KEYS.cash) || { balance: 0, entries: [] }; },
  addExpense(exp) {
    const expenses = this.get(this.KEYS.expenses) || [];
    exp.id = Date.now(); exp.date = new Date().toISOString();
    expenses.push(exp);
    this.set(this.KEYS.expenses, expenses);
    const cash = this.getCash();
    cash.balance -= exp.amount;
    cash.entries.push({ type: 'out', amount: exp.amount, date: exp.date, note: exp.description });
    this.set(this.KEYS.cash, cash);
    return exp;
  },
  getExpenses() { return this.get(this.KEYS.expenses) || []; },

  // Activity log
  log(action, detail) {
    const logs = this.get(this.KEYS.activityLog) || [];
    const user = Auth ? Auth.getCurrentUser() : null;
    logs.unshift({ id: Date.now(), date: new Date().toISOString(), user: user?.name || 'Système', action, detail });
    if (logs.length > 500) logs.pop();
    this.set(this.KEYS.activityLog, logs);
  },
  getLogs() { return this.get(this.KEYS.activityLog) || []; },

  // Notifications
  getNotifications() {
    const products = this.getProducts();
    const notes = [];
    products.forEach(p => {
      if (p.stock === 0) notes.push({ type: 'danger', msg: `${p.name} est épuisé` });
      else if (p.stock <= (p.alertThreshold || 3)) notes.push({ type: 'warning', msg: `${p.name} — stock faible (${p.stock})` });
    });
    const customers = this.getCustomers();
    customers.forEach(c => { if (c.credit > 0) notes.push({ type: 'info', msg: `${c.name} a une dette de ${fmt(c.credit)}` }); });
    return notes;
  },

  // Stats
  getStats() {
    const today = new Date().toDateString();
    const sales = this.getSales().filter(s => s.status !== 'cancelled');
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const products = this.getProducts();
    const cash = this.getCash();
    const totalStock = products.reduce((a,p) => a + (p.stock||0) * (p.purchasePrice||0), 0);
    const totalRevenue = sales.reduce((a,s) => a + (s.total||0), 0);
    const totalCost = sales.reduce((a,s) => {
      return a + (s.items||[]).reduce((b,i) => {
        const p = this.getProductById(i.productId);
        return b + (p?.purchasePrice||0) * i.qty;
      }, 0);
    }, 0);
    return {
      todayRevenue: todaySales.reduce((a,s)=>a+(s.total||0),0),
      todaySalesCount: todaySales.length,
      totalRevenue,
      totalProfit: totalRevenue - totalCost,
      cashBalance: cash.balance,
      productCount: products.length,
      lowStock: products.filter(p=>p.stock>0&&p.stock<=(p.alertThreshold||3)).length,
      outOfStock: products.filter(p=>p.stock===0).length,
      customerCount: this.getCustomers().length,
      totalStock,
    };
  },

  // Backup
  exportData() {
    const data = {};
    Object.entries(this.KEYS).forEach(([k,v]) => { data[k] = this.get(v); });
    return JSON.stringify(data, null, 2);
  },
  importData(json) {
    const data = JSON.parse(json);
    Object.entries(this.KEYS).forEach(([k,v]) => { if (data[k]) this.set(v, data[k]); });
  },
};

function fmt(n) {
  const s = DB.getSettings();
  return Number(n||0).toLocaleString('fr-FR') + ' ' + (s.currency || 'FCFA');
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '';
}
function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('fr-FR') : '';
}
function genId() { return Date.now() + Math.floor(Math.random()*1000); }
