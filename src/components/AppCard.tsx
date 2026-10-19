import { ArrowUpRight, Bot, Smartphone } from 'lucide-react';
import type { ManagedApp } from '../types';

export function AppCard({ app, onSelect }: { app: ManagedApp; onSelect?: () => void }) {
  const ready = Number(Boolean(app.iosBundleId)) + Number(Boolean(app.androidPackage)) + Number(Boolean(app.asoBeastAppId));
  return <article className="app-card" style={{ '--app-color': app.color } as React.CSSProperties}>
    <div className="app-card-head"><div className="app-icon">{app.name.slice(0, 1)}</div><span className={`status ${app.status}`}>{app.status === 'live' ? 'Yayında' : app.status === 'review' ? 'İncelemede' : 'Geliştirme'}</span></div>
    <h3>{app.name}</h3><p>{app.iosBundleId ?? app.androidPackage ?? 'Mağaza kimliği bekleniyor'}</p>
    <div className="platform-row"><span className={app.iosBundleId ? 'ready' : ''}>iOS</span><span className={app.androidPackage ? 'ready' : ''}>Android</span><span className={app.asoBeastAppId ? 'ready' : ''}><Bot size={13} /> ASO</span></div>
    <div className="progress"><i style={{ width: `${ready / 3 * 100}%` }} /></div>
    <button className="text-button" onClick={onSelect}><Smartphone size={16} /> Uygulamayı yönet <ArrowUpRight size={15} /></button>
  </article>;
}
