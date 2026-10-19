import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Bot, CheckCircle2, Clock3, Smartphone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { DashboardData } from '../types';
import { AppCard } from '../components/AppCard';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { api<DashboardData>('/v1/dashboard').then(setData); }, []);
  if (!data) return <div className="page-loading">Veriler toplanıyor…</div>;
  const linked = data.apps.filter((item) => item.asoBeastAppId).length;
  return <div className="page"><section className="hero-row"><div><span className="eyebrow"><span /> PAZARTESİ OPERASYON ÖZETİ</span><h1>Günaydın, Mustafa.</h1><p>Mobil ürünlerinin bugünkü durumu burada. Kritik bir sorun görünmüyor.</p></div><Link className="primary compact" to="/apps">Uygulama ekle <ArrowUpRight size={17} /></Link></section>
    <section className="metrics"><div><span className="metric-icon blue"><Smartphone /></span><p>Toplam uygulama</p><strong>{data.apps.length}</strong><small>iOS ve Android portföyü</small></div><div><span className="metric-icon green"><CheckCircle2 /></span><p>Yayındaki ürün</p><strong>{data.apps.filter((a) => a.status === 'live').length}</strong><small>Mağazalarda aktif</small></div><div><span className="metric-icon violet"><Bot /></span><p>ASO bağlantısı</p><strong>{linked}/{data.apps.length}</strong><small>{data.asobeast.connected ? 'AsoBeast çevrimiçi' : 'Kurulum bekleniyor'}</small></div><div><span className="metric-icon amber"><Clock3 /></span><p>Bekleyen işler</p><strong>{data.apps.filter((a) => !a.asoBeastAppId).length}</strong><small>Entegrasyon adımı</small></div></section>
    <section className="section-head"><div><span className="eyebrow"><Activity size={13} /> PORTFÖY</span><h2>Uygulamalar</h2></div><Link to="/apps">Tümünü gör <ArrowUpRight size={15} /></Link></section>
    <section className="app-grid">{data.apps.map((app) => <AppCard key={app.id} app={app} />)}<Link to="/apps" className="new-card"><span><Sparkles /></span><strong>Yeni uygulama ekle</strong><p>iOS veya Android ürününü portföye bağla.</p></Link></section>
    <section className={`integration-banner ${data.asobeast.connected ? 'connected' : ''}`}><div className="integration-icon"><Bot /></div><div><span className="eyebrow">OTOMASYON MOTORU</span><h3>{data.asobeast.connected ? 'AsoBeast bağlı ve veri akışı açık' : 'AsoBeast bağlantısını tamamla'}</h3><p>{data.asobeast.connected ? `${data.asobeast.remoteAppCount} mağaza kaydı takip ediliyor.` : 'Anahtar kelime sıralamaları, audit ve günlük ASO takibi için API token gerekiyor.'}</p></div><Link to="/aso" className="secondary">Entegrasyona git <ArrowUpRight size={16} /></Link></section>
  </div>;
}
