import {
  Vault,
  LayoutDashboard,
  Coins,
  Users,
  Scroll,
  Activity,
  Settings,
  Globe,
  ChevronRight,
} from 'lucide-react'
import './DashboardLayout.css'

export function DashboardLayout({
  children,
  t,
  lang,
  onToggleLang,
  activeNav = 'assets',
}) {
  const navItems = [
    { key: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard size={18} /> },
    { key: 'assets', label: t.nav.assets, icon: <Coins size={18} /> },
    { key: 'beneficiaries', label: t.nav.beneficiaries, icon: <Users size={18} /> },
    { key: 'will', label: t.nav.will, icon: <Scroll size={18} /> },
    { key: 'dms', label: t.nav.dms, icon: <Activity size={18} /> },
    { key: 'settings', label: t.nav.settings, icon: <Settings size={18} /> },
  ]

  return (
    <div className="lv-shell">
      {/* Sidebar 248px adhering to AGENTS.md */}
      <aside className="lv-sidebar">
        <div className="lv-sidebar__brand">
          <div className="lv-brand-logo-mark">
            <Vault size={22} />
          </div>
          <div className="lv-brand-info">
            <span className="lv-brand-name">{t.brandName}</span>
            <span className="lv-brand-tagline">{t.brandTagline}</span>
          </div>
        </div>

        <nav className="lv-sidebar__nav" aria-label="Main Navigation">
          <ul className="lv-nav-list">
            {navItems.map((item) => {
              const isActive = item.key === activeNav
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`lv-nav-item ${isActive ? 'lv-nav-item--active' : ''}`}
                  >
                    <span className="lv-nav-icon">{item.icon}</span>
                    <span className="lv-nav-text">{item.label}</span>
                    {isActive && <span className="lv-nav-indicator" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="lv-main-container">
        {/* Topbar 64-72px */}
        <header className="lv-topbar">
          <div className="lv-topbar__breadcrumbs">
            <span className="lv-breadcrumb-item">{t.brandName}</span>
            <ChevronRight size={14} className="lv-breadcrumb-sep" />
            <span className="lv-breadcrumb-current">{t.assets.title}</span>
          </div>

          <div className="lv-topbar__actions">
            {/* Language switch */}
            <button
              type="button"
              className="lv-lang-btn"
              onClick={onToggleLang}
              aria-label={t.header.langToggleAria}
            >
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* User role profile badge */}
            <div className="lv-user-profile">
              <div className="lv-user-avatar">VO</div>
              <div className="lv-user-meta">
                <span className="lv-user-name">Nguyễn Văn An</span>
                <span className="lv-user-role">{t.header.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="lv-content-viewport">{children}</main>
      </div>
    </div>
  )
}
