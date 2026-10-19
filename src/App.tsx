import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, ApiError } from './api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppsPage } from './pages/AppsPage';
import { AsoPage } from './pages/AsoPage';
import { AsoBeastPanelPage } from './pages/AsoBeastPanelPage';
import { SettingsPage } from './pages/SettingsPage';
import { Shell } from './components/Shell';

export function App() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>('loading');
  useEffect(() => { api('/v1/auth/session').then(() => setAuth('in')).catch((e) => setAuth(e instanceof ApiError && e.status === 401 ? 'out' : 'out')); }, []);
  if (auth === 'loading') return <div className="boot"><div className="brand-mark">M</div><p>Kontrol merkezi hazırlanıyor…</p></div>;
  if (auth === 'out') return <LoginPage onLogin={() => setAuth('in')} />;
  return <Shell onLogout={() => setAuth('out')}><Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/apps" element={<AppsPage />} />
    <Route path="/aso" element={<AsoPage />} />
    <Route path="/asobeast" element={<AsoBeastPanelPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Shell>;
}
