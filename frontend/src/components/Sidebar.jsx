import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Sidebar component with logo, navigation, query history, and user profile.
 * Collapsible on mobile via hamburger menu.
 */
export default function Sidebar({ history = [], onNewQuery }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleNewQuery = () => {
    setMobileOpen(false);
    if (onNewQuery) {
      onNewQuery();
    } else {
      navigate('/dashboard');
    }
  };

  const handleHistoryClick = (item) => {
    setMobileOpen(false);
    navigate('/dashboard', { state: { query: item.query } });
  };

  // Truncate text to a max length with ellipsis
  const truncate = (text, maxLen = 60) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  const sidebarContent = (
    <>
      {/* Logo section */}
      <div className="px-5 py-6 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          {/* Scales of Justice icon */}
          <div className="w-9 h-9 shrink-0">
            <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
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
          <div>
            <h1 className="font-heading text-xl font-bold text-primary group-hover:text-primary-hover transition-colors">
              MİZAN AI
            </h1>
            <p className="text-[10px] text-text-muted tracking-widest uppercase">
              Hukuk Asistanı
            </p>
          </div>
        </NavLink>
      </div>

      {/* New Query button */}
      <div className="px-4 py-4">
        <button
          onClick={handleNewQuery}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-2.5
            bg-primary hover:bg-primary-hover text-bg-primary
            font-semibold text-sm rounded-lg
            transition-all duration-200 cursor-pointer
            focus-ring
          "
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yeni Sorgu
        </button>
      </div>

      {/* Navigation links */}
      <nav className="px-3 mb-2">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary-muted text-primary border-l-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Ana Sayfa
        </NavLink>
        <NavLink
          to="/history"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mt-1 ${
              isActive
                ? 'bg-primary-muted text-primary border-l-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Geçmiş
        </NavLink>
      </nav>

      {/* Query history section */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <h3 className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Son Sorgular
        </h3>
        {history.length === 0 ? (
          <p className="px-3 py-2 text-xs text-text-muted italic">
            Henüz sorgu yok
          </p>
        ) : (
          <ul className="space-y-0.5">
            {history.slice(0, 10).map((item, index) => (
              <li key={item.id || index}>
                <button
                  onClick={() => handleHistoryClick(item)}
                  className="
                    w-full text-left px-3 py-2 rounded-lg
                    text-xs text-text-secondary
                    hover:text-text-primary hover:bg-bg-surface-hover
                    transition-all duration-200 cursor-pointer
                    truncate block
                  "
                  title={item.query}
                >
                  {truncate(item.query)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User section at bottom */}
      <div className="border-t border-border p-4 mt-auto">
        <div className="flex items-center gap-3 mb-3">
          {/* User avatar */}
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'Kullanıcı'}
              className="w-8 h-8 rounded-full border border-border object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || 'K'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.name || 'Kullanıcı'}
            </p>
            <p className="text-xs text-text-muted truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="
            w-full flex items-center justify-center gap-2 px-3 py-2
            text-sm text-text-secondary
            hover:text-error hover:bg-error/10
            rounded-lg transition-all duration-200 cursor-pointer
          "
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="
          lg:hidden fixed top-4 left-4 z-50
          p-2 rounded-lg bg-bg-surface border border-border
          text-text-primary hover:text-primary
          transition-colors cursor-pointer
        "
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
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-72 h-screen bg-bg-surface border-r border-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
