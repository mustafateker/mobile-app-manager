import { useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { api } from '../api';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@triworkster.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); onLogin(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Giriş başarısız.'); }
    finally { setLoading(false); }
  };
  return <main className="login-page"><section className="login-brand"><div className="brand-pill"><Activity size={17} /> TRIWORKSTER MOBILE OPS</div><h1>Uygulamalarını<br /><em>tek ritimde</em> yönet.</h1><p>iOS, Android ve ASO operasyonları için sakin, hızlı ve tek bir kontrol merkezi.</p><div className="orbit"><div className="orbit-core">M</div><span className="orbit-one">iOS</span><span className="orbit-two">ASO</span><span className="orbit-three">Android</span></div></section>
    <section className="login-panel"><form onSubmit={submit}><div className="login-logo"><span><Activity /></span><div><strong>Mobile Ops</strong><small>Yönetici konsolu</small></div></div><h2>Tekrar hoş geldin</h2><p>Uygulama portföyüne devam etmek için giriş yap.</p>
      <label>E-posta<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></div></label>
      <label>Şifre<div className="input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Panele gir'} <ArrowRight size={18} /></button>
    </form></section></main>;
}
