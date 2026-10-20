import type { ReactNode } from 'react';
import { Activity, AppWindow, Bot, LayoutDashboard, LogOut, MapPinned, Settings, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { api } from '../api';

const links = [
  { to: '/', label: 'Genel Bakış', icon: LayoutDashboard },
  { to: '/apps', label: 'Uygulamalar', icon: AppWindow },
  { to: '/aso', label: 'ASO Merkezi', icon: Sparkles },
  { to: '/maps', label: 'Maps Tarama', icon: MapPinned },
  { to: '/asobeast', label: 'AsoBeast Paneli', icon: Bot },
  { to: '/settings', label: 'Ayarlar', icon: Settings },
];

export function Shell({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const logout = async () => { await api('/v1/auth/logout', { method: 'POST' }); onLogout(); };
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><span className="logo-box"><Activity size={20} /></span><span><strong>Mobile Ops</strong><small>TRIWORKSTER</small></span></div>
      <nav aria-label="Ana menü">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-foot"><span className="online-dot" /> Sistem çevrimiçi</div>
      <button className="logout" onClick={logout}><LogOut size={17} /> Çıkış yap</button>
    </aside>
    <main id="main-content" className="main"><header className="topbar"><div><small>TRIWORKSTER / MOBILE</small><strong>Uygulama Operasyon Merkezi</strong></div><div className="operator"><span>MA</span><div><strong>Mustafa</strong><small>Yönetici</small></div></div></header>{children}</main>
    <nav className="mobile-nav" aria-label="Mobil menü">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
  </div>;
}
