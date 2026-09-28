// ============================================================
// Auth.js — Gestion des sessions utilisateurs
// ============================================================
const Auth = {
  SESSION_KEY: 'boutique_session',

  login(username, password) {
    const users = DB.getUsers();
    const cleanUsername = String(username ?? '').trim().toLowerCase();
    const cleanPassword = String(password ?? '');
    const user = users.find(u => String(u.username ?? '').trim().toLowerCase() === cleanUsername && String(u.password ?? '') === cleanPassword && u.active !== false);
    if (user) {
      const session = { userId: user.id, username: user.username, name: user.name, role: user.role, permissions: user.permissions };
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      DB.log('Connexion', `${user.name} s'est connecté`);
      return user;
    }
    return null;
  },

  logout() {
    const u = this.getCurrentUser();
    if (u) DB.log('Déconnexion', `${u.name} s'est déconnecté`);
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = '../index.html';
  },

  getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)); } catch { return null; }
  },

  isLoggedIn() { return !!this.getCurrentUser(); },

  requireAuth() {
    const settings = DB.getSettings();
    if (settings.loginRequired && !this.isLoggedIn()) {
      window.location.href = '../index.html';
    }
  },

  can(permission) {
    const u = this.getCurrentUser();
    if (!u) return false;
    if (u.role === 'admin') return true;
    return u.permissions && u.permissions[permission];
  },

  isAdmin() { const u = this.getCurrentUser(); return u && u.role === 'admin'; },
};
