import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { api } from '../api';
import type { ManagedApp } from '../types';
import { AppCard } from '../components/AppCard';

type AppForm = {
  name: string; slug: string; iosBundleId: string; androidPackage: string;
  appStoreUrl: string; playStoreUrl: string; asoBeastAppId: string;
  color: string; status: ManagedApp['status'];
};

const blank: AppForm = { name: '', slug: '', iosBundleId: '', androidPackage: '', appStoreUrl: '', playStoreUrl: '', asoBeastAppId: '', color: '#2563eb', status: 'development' };

export function AppsPage() {
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppForm>(blank);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () => api<ManagedApp[]>('/v1/apps').then(setApps);
  useEffect(() => { load(); }, []);

  const close = () => { setOpen(false); setEditingId(null); setForm(blank); setError(''); };
  const add = () => { setEditingId(null); setForm(blank); setError(''); setOpen(true); };
  const edit = (app: ManagedApp) => {
    setEditingId(app.id);
    setError('');
    setForm({ name: app.name, slug: app.slug, iosBundleId: app.iosBundleId ?? '', androidPackage: app.androidPackage ?? '', appStoreUrl: app.appStoreUrl ?? '', playStoreUrl: app.playStoreUrl ?? '', asoBeastAppId: app.asoBeastAppId ?? '', color: app.color, status: app.status });
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const wasEditing = Boolean(editingId);
    setSaving(true);
    setError('');
    try {
      await api(editingId ? `/v1/apps/${editingId}` : '/v1/apps', {
        method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(form),
      });
      close();
      setMessage(wasEditing ? 'Uygulama güncellendi.' : 'Uygulama portföye eklendi.');
      await load();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Değişiklikler kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="page"><section className="hero-row"><div><span className="eyebrow">ÜRÜN PORTFÖYÜ</span><h1>Uygulamalar</h1><p>Mağaza kimlikleri, yayın durumu ve ASO bağlantılarını tek yerden izle.</p></div><button className="primary compact" onClick={add}><Plus size={17} /> Uygulama ekle</button></section>
    {message && <div className="success-message"><Check size={16} /> {message}</div>}<section className="app-grid">{apps.map((app) => <AppCard key={app.id} app={app} onSelect={() => edit(app)} />)}</section>
    {open && <div className="modal-backdrop" onMouseDown={close}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="app-form-title" onMouseDown={(e) => e.stopPropagation()}><button className="icon-button close" onClick={close} aria-label="Kapat"><X /></button><span className="eyebrow">{editingId ? 'ÜRÜN AYARLARI' : 'YENİ ÜRÜN'}</span><h2 id="app-form-title">{editingId ? 'Uygulamayı düzenle' : 'Uygulama ekle'}</h2><p>Kimlikleri şimdi girebilir, mağaza bağlantılarını sonra tamamlayabilirsin.</p><form className="app-form" onSubmit={save}>
      <label>Uygulama adı<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, ...(!editingId ? { slug: e.target.value.toLocaleLowerCase('tr').replaceAll('ı','i').replaceAll('ç','c').replaceAll('ş','s').replaceAll('ğ','g').replaceAll('ü','u').replaceAll('ö','o').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') } : {}) })} /></label>
      <label>Slug<input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label><div className="form-grid"><label>iOS bundle ID<input placeholder="com.firma.uygulama" value={form.iosBundleId} onChange={(e) => setForm({ ...form, iosBundleId: e.target.value })} /></label><label>Android package<input placeholder="com.firma.uygulama" value={form.androidPackage} onChange={(e) => setForm({ ...form, androidPackage: e.target.value })} /></label></div>
      <label>App Store URL<input type="url" value={form.appStoreUrl} onChange={(e) => setForm({ ...form, appStoreUrl: e.target.value })} /></label><label>Google Play URL<input type="url" value={form.playStoreUrl} onChange={(e) => setForm({ ...form, playStoreUrl: e.target.value })} /></label>
      <div className="form-grid"><label>Durum<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ManagedApp['status'] })}><option value="development">Geliştirme</option><option value="review">İncelemede</option><option value="live">Yayında</option></select></label><label>Renk<input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary" disabled={saving}>{saving ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Portföye ekle'}</button></form></div></div>}
  </div>;
}
