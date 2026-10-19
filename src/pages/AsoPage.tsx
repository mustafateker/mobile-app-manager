import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, CircleAlert, KeyRound, RefreshCw, Server } from 'lucide-react';
import { api } from '../api';
import type { ManagedApp } from '../types';

type Status = { configured: boolean; connected: boolean; error?: string };
export function AsoPage() {
  const [status, setStatus] = useState<Status | null>(null); const [apps, setApps] = useState<ManagedApp[]>([]); const [note, setNote] = useState('');
  const load = () => Promise.all([api<Status>('/v1/aso/status'), api<ManagedApp[]>('/v1/apps')]).then(([s, a]) => { setStatus(s); setApps(a); });
  useEffect(() => { load(); }, []);
  const importApp = async (id: string) => { setNote('AsoBeast içe aktarımı başlatılıyor…'); try { await api(`/v1/apps/${id}/aso/import`, { method: 'POST' }); setNote('Uygulama AsoBeast’e aktarıldı.'); load(); } catch (e) { setNote(e instanceof Error ? e.message : 'İşlem başarısız.'); } };
  return <div className="page"><section className="hero-row"><div><span className="eyebrow">ASO OTOMASYONU</span><h1>AsoBeast merkezi</h1><p>Mağaza görünürlüğünü, anahtar kelimeleri ve günlük takip işlerini buradan yönet.</p></div><button className="secondary" onClick={load}><RefreshCw size={16} /> Yenile</button></section>
    <section className={`connection-card ${status?.connected ? 'connected' : ''}`}><div className="connection-logo"><Bot /></div><div><span className="eyebrow">ENTEGRASYON DURUMU</span><h2>{status?.connected ? 'Bağlantı hazır' : status?.configured ? 'Bağlantı kurulamadı' : 'API token bekleniyor'}</h2><p>{status?.connected ? 'AsoBeast API yanıt veriyor. Otomasyonları çalıştırabilirsin.' : 'AsoBeast panelinde bir read/write token oluşturup sunucu ortamına ekle.'}</p></div><span className={`connection-badge ${status?.connected ? 'ok' : ''}`}>{status?.connected ? <CheckCircle2 /> : <CircleAlert />}{status?.connected ? 'Çevrimiçi' : 'Kurulum gerekli'}</span></section>
    <section className="setup-grid"><article><span><KeyRound /></span><h3>1. API token oluştur</h3><p>AsoBeast Settings ekranından Mobile Ops adına read/write token üret.</p></article><article><span><Server /></span><h3>2. Sunucuya ekle</h3><p>Token backend ortamında saklanır, hiçbir zaman tarayıcıya gönderilmez.</p></article><article><span><Bot /></span><h3>3. Uygulamaları bağla</h3><p>Mağaza URL’si olan ürünleri tek tıkla AsoBeast’e aktar.</p></article></section>
    {note && <div className="notice" aria-live="polite">{note}</div>}<section className="table-card"><div className="table-title"><div><span className="eyebrow">UYGULAMA EŞLEŞTİRMELERİ</span><h2>ASO bağlantıları</h2></div></div><div className="responsive-table"><table><thead><tr><th>Uygulama</th><th>Mağaza kaydı</th><th>AsoBeast</th><th></th></tr></thead><tbody>{apps.map((app) => <tr key={app.id}><td><span className="mini-app" style={{ background: app.color }}>{app.name[0]}</span><strong>{app.name}</strong></td><td>{app.appStoreUrl || app.playStoreUrl ? 'Hazır' : 'URL bekleniyor'}</td><td><span className={app.asoBeastAppId ? 'tag ok' : 'tag'}>{app.asoBeastAppId ? 'Bağlı' : 'Bağlı değil'}</span></td><td><button className="text-button" disabled={!status?.connected || Boolean(app.asoBeastAppId)} onClick={() => importApp(app.id)}>{app.asoBeastAppId ? 'Aktif' : 'AsoBeast’e aktar'}</button></td></tr>)}</tbody></table></div></section>
  </div>;
}
