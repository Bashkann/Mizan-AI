import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Sidebar with collapse/expand functionality.
 * Collapsed: 60px, icons only. Expanded: 260px, full labels.
 * Persists state to localStorage.
 */
export default function Sidebar({ history = [], onNewQuery }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const navigate = useNavigate();

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  const handleNewQuery = () => {
    setMobileOpen(false);
    if (onNewQuery) onNewQuery();
    else navigate('/dashboard');
  };

  const handleHistoryClick = (item) => {
    setMobileOpen(false);
    navigate('/dashboard', { state: { query: item.query } });
  };

  const truncate = (text, maxLen = 50) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
  };

  const sidebarContent = (
    <>
      {/* Logo + collapse toggle */}
      <div className={`sidebar-logo-section ${collapsed ? 'sidebar-logo-section--collapsed' : ''}`}>
        <NavLink to="/dashboard" className="sidebar-logo-link" onClick={() => setMobileOpen(false)}>
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
              <circle cx="20" cy="6" r="3" fill="#C9A84C" />
              <line x1="20" y1="9" x2="20" y2="34" stroke="#C9A84C" strokeWidth="2" />
              <line x1="8" y1="14" x2="32" y2="14" stroke="#C9A84C" strokeWidth="2" />
              <path d="M5 14 L8 24 L11 14" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <path d="M4 24 Q8 30 12 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <path d="M29 14 L32 24 L35 14" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <path d="M28 24 Q32 30 36 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <rect x="14" y="33" width="12" height="3" rx="1.5" fill="#C9A84C" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <h1 className="sidebar-logo-title">MİZAN AI</h1>
              <p className="sidebar-logo-subtitle">Hukuk Asistanı</p>
            </div>
          )}
        </NavLink>

        {/* Collapse/Expand button — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn hidden lg:flex"
          aria-label={collapsed ? 'Genişlet' : 'Daralt'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            )}
          </svg>
        </button>
      </div>

      {/* New Query */}
      <div className="sidebar-new-query">
        <button onClick={handleNewQuery} className="sidebar-new-query-btn" title="Yeni Sorgu">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {!collapsed && <span>Yeni Sorgu</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`
          }
          title="Ana Sayfa"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          {!collapsed && <span>Ana Sayfa</span>}
        </NavLink>
        <NavLink
          to="/history"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`
          }
          title="Geçmiş"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!collapsed && <span>Geçmiş</span>}
        </NavLink>
      </nav>

      {/* History */}
      {!collapsed && (
        <div className="sidebar-history">
          <h3 className="sidebar-history-title">Son Sorgular</h3>
          {history.length === 0 ? (
            <p className="sidebar-history-empty">Henüz sorgu yok</p>
          ) : (
            <ul className="sidebar-history-list">
              {history.slice(0, 10).map((item, index) => (
                <li key={item.id || index}>
                  <button
                    onClick={() => handleHistoryClick(item)}
                    className="sidebar-history-item"
                    title={item.query}
                  >
                    {truncate(item.query)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* User */}
      <div className={`sidebar-user ${collapsed ? 'sidebar-user--collapsed' : ''}`}>
        {!collapsed ? (
          <>
            <div className="sidebar-user-info">
              {user?.picture ? (
                <img src={user.picture} alt={user.name || 'Kullanıcı'} className="sidebar-user-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="sidebar-user-avatar-placeholder">
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'K'}</span>
                </div>
              )}
              <div className="sidebar-user-text">
                <p className="sidebar-user-name">{user?.name || 'Kullanıcı'}</p>
                <p className="sidebar-user-email">{user?.email || ''}</p>
              </div>
            </div>
            <button onClick={logout} className="sidebar-logout-btn">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Çıkış Yap
            </button>
          </>
        ) : (
          <div className="sidebar-user-collapsed-avatar">
            {user?.picture ? (
              <img src={user.picture} alt="" className="sidebar-user-avatar" referrerPolicy="no-referrer" title={user.name} />
            ) : (
              <div className="sidebar-user-avatar-placeholder" title={user?.name}>
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'K'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-surface border border-border text-text-primary hover:text-primary transition-colors cursor-pointer"
        aria-label="Menü"
      >
        {mobileOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-aside ${collapsed ? 'sidebar-aside--collapsed' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
