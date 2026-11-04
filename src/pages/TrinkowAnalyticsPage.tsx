import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  KeyRound,
  Layers,
  RefreshCw,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { api } from '../api';
import type { AnalyticsOverview } from '../types';

export function TrinkowAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [modalOpen, setModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchData = (range = timeRange) => {
    setLoading(true);
    api<AnalyticsOverview>(`/v1/analytics/trinkow?time_range=${range}`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Analytics fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      await api('/v1/analytics/config', {
        method: 'POST',
        body: JSON.stringify({ personalApiKey: apiKeyInput.trim(), projectId: '333929' }),
      });
      setSaveMessage('API anahtarı kaydedildi! Veriler yenileniyor…');
      setTimeout(() => {
        setModalOpen(false);
        setSaveMessage(null);
        fetchData(timeRange);
      }, 1000);
    } catch {
      setSaveMessage('Kaydedilemedi. Lütfen anahtar formatını kontrol edin.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!data && loading) {
    return (
      <div className="page-loading">
        <RefreshCw className="spin" size={24} />
        <p style={{ marginTop: 12 }}>Trinkow kullanıcı verileri analiz ediliyor…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="form-error">Veri yüklenemedi. Lütfen backend bağlantınızı kontrol edin.</div>
      </div>
    );
  }

  const { config, paywall, screens, recentEvents } = data;

  return (
    <div className="page">
      {/* 1. HERO ROW */}
      <section className="hero-row">
        <div>
          <span className="eyebrow">
            <span style={{ background: config.connected ? '#34d399' : '#f59e0b' }} />
            {config.connected ? 'POSTHOG CANLI BAĞLANTI AKTİF' : 'POSTHOG ENTEGRASYON MODU'}
          </span>
          <h1>Trinkow Analitik & Davranış</h1>
          <p>Kullanıcıların uygulama içi sayfaları, satın alma hunisi ve terk oranları.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Time range switcher */}
          <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 3, border: '1px solid var(--line)' }}>
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                style={{
                  border: 0,
                  borderRadius: 9,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: timeRange === r ? 'var(--ink)' : 'transparent',
                  color: timeRange === r ? 'white' : '#6b7a72',
                  transition: '0.15s',
                }}
              >
                {r === '24h' ? '24 Saat' : r === '7d' ? '7 Gün' : '30 Gün'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="secondary compact"
            onClick={() => fetchData(timeRange)}
            title="Yenile"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="secondary compact"
            onClick={() => setModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <KeyRound size={15} />
            <span>{config.hasApiKey ? 'API Anahtarı' : 'API Bağla'}</span>
          </button>
        </div>
      </section>

      {/* 2. AI BEHAVIORAL SUMMARY BANNER */}
      <section
        style={{
          background: 'linear-gradient(135deg, #13241b 0%, #0d1a13 100%)',
          color: 'white',
          borderRadius: 18,
          padding: '20px 24px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          border: '1px solid #233d2e',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: 'rgba(185, 243, 106, 0.15)',
            color: 'var(--lime)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 800, color: 'var(--lime)' }}>
              OTOMATİK DAVRANIŞ ANALİZİ
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#d8e5dc' }}>
            {data.behaviorSummary}
          </p>
        </div>
      </section>

      {/* 3. KPI CARDS */}
      <section className="metrics">
        <div>
          <span className="metric-icon blue"><Activity /></span>
          <p>Toplam Olay</p>
          <strong>{data.totalEvents.toLocaleString('tr-TR')}</strong>
          <small>Seçili dönemde kaydedilen eylemler</small>
        </div>
        <div>
          <span className="metric-icon green"><Users /></span>
          <p>Aktif Kullanıcı</p>
          <strong>{data.activeUsers.toLocaleString('tr-TR')}</strong>
          <small>Tekil cihaz / kullanıcı oturumu</small>
        </div>
        <div>
          <span className="metric-icon violet"><Compass /></span>
          <p>En Çok Gezilen Ekran</p>
          <strong style={{ fontSize: 20, lineHeight: 'normal', marginTop: 14 }}>{data.topScreen}</strong>
          <small>En yüksek kullanıcı trafiği</small>
        </div>
        <div>
          <span className="metric-icon amber"><Crown /></span>
          <p>Paywall Dönüşümü</p>
          <strong>%{paywall.overallConversion}</strong>
          <small>{paywall.steps[3]?.count ?? 0} başarılı Premium satış</small>
        </div>
      </section>

      {/* 4. PAYWALL CONVERSION & DROPOFF FUNNEL */}
      <div style={{ marginBottom: 38 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow"><CreditCard size={13} /> SATIN ALMA DÖNÜŞÜM HUNİSİ</span>
            <h2>Müşteri Nerede Vazgeçiyor? (Paywall Drop-off)</h2>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid #e1e6e1',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          {/* Funnel Steps */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {paywall.steps.map((st, i) => (
              <div
                key={st.stepId}
                style={{
                  background: '#f8faf8',
                  borderRadius: 14,
                  padding: '16px 18px',
                  border: '1px solid #edf2ee',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: 'var(--ink)',
                      color: 'var(--lime)',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {st.stepId}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#387b52' }}>
                    %{st.conversionRate}
                  </span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <small style={{ color: '#7a8780', fontSize: 11, display: 'block' }}>{st.title}</small>
                  <strong style={{ fontSize: 24, fontFamily: 'Inter', color: 'var(--ink)', display: 'block', marginTop: 3 }}>
                    {st.count.toLocaleString('tr-TR')}
                  </strong>
                </div>

                {/* Drop-off badge (if not last step) */}
                {i < paywall.steps.length - 1 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '5px 8px',
                      borderRadius: 8,
                      background: '#fff2ee',
                      color: '#a84635',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowDownRight size={12} />
                    <span>%{st.dropoffRate} terk ({st.dropoffCount} kişi)</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Terk ve Tercih Dağılımı Çubukları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              paddingTop: 18,
              borderTop: '1px solid #edf1ed',
            }}
          >
            {/* Terk Nedenleri */}
            <div style={{ background: '#fafbfa', padding: 16, borderRadius: 12, border: '1px solid #edf0ed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertCircle size={15} color="#b85d38" />
                <strong style={{ fontSize: 13, color: '#44514a' }}>Vazgeçme Detayları (Drop-off Nedenleri)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>"Atla / Ücretsiz Devam" ile Çıkanlar:</span>
                <strong>{paywall.dismissReasons.atla ?? 0} kişi</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>Sol Üst "X" (Kapat) ile Çıkanlar:</span>
                <strong>{paywall.dismissReasons.kapat ?? 0} kişi</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b85d38' }}>
                <span>Mağazada Son Anda Vazgeçenler:</span>
                <strong>{paywall.cancelledCount} kişi</strong>
              </div>
            </div>

            {/* Tercih Edilen Paketler */}
            <div style={{ background: '#fafbfa', padding: 16, borderRadius: 12, border: '1px solid #edf0ed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Crown size={15} color="#b87518" />
                <strong style={{ fontSize: 13, color: '#44514a' }}>İncelenen & Seçilen Planlar</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>Yıllık Plan (%50 İndirimli / Denemeli):</span>
                <strong>{paywall.selectedPackages.yillik ?? 0} seçim</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>Aylık Standart Plan:</span>
                <strong>{paywall.selectedPackages.aylik ?? 0} seçim</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#278754' }}>
                <span>Net Tamamlanan Satış:</span>
                <strong>{paywall.steps[3]?.count ?? 0} adet</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SCREEN VISITS TABLE & RECENT EVENTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Ekran Ziyaretleri Tablosu */}
        <div className="table-card">
          <div className="table-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="eyebrow"><Layers size={13} /> SAYFA TAKİBİ</span>
              <h2>Ekran Ziyaretleri</h2>
            </div>
            <span style={{ fontSize: 11, color: '#7a857f' }}>Toplam {screens.length} sayfa</span>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Ekran / Sayfa</th>
                  <th>Görüntüleme</th>
                  <th>Tekil Kullanıcı</th>
                  <th style={{ width: 140 }}>Trafik Payı</th>
                </tr>
              </thead>
              <tbody>
                {screens.map((sc) => (
                  <tr key={sc.screen}>
                    <td>
                      <div>
                        <strong>{sc.screenTitle}</strong>
                        <div style={{ fontSize: 10, color: '#88948d', fontFamily: 'monospace', marginTop: 2 }}>
                          {sc.screen}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{sc.views.toLocaleString('tr-TR')}</strong>
                    </td>
                    <td>{sc.uniqueVisitors.toLocaleString('tr-TR')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#eaf0ea', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sc.percentage}%`, background: 'var(--green)', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, minWidth: 32 }}>%{sc.percentage}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Canlı Akış / Son Kullanıcı Hareketleri */}
        <div className="table-card">
          <div className="table-title">
            <span className="eyebrow"><Clock size={13} /> GERÇEK ZAMANLI</span>
            <h2>Son Kullanıcı Hareketleri</h2>
          </div>

          <div style={{ maxHeight: 520, overflow: 'auto', padding: '8px 16px' }}>
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 6px',
                  borderBottom: '1px solid #edf1ed',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: ev.event.includes('premium') ? '#e7f7ec' : ev.event.includes('paywall') ? '#fff3dd' : '#f0f3f1',
                    color: ev.event.includes('premium') ? '#278754' : ev.event.includes('paywall') ? '#b87518' : '#45594f',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {ev.event.includes('premium') ? <Crown size={15} /> : ev.event.includes('screen') ? <Eye size={15} /> : <Smartphone size={15} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: 12, color: 'var(--ink)' }}>{ev.eventDisplay}</strong>
                    <small style={{ fontSize: 9, color: '#8d9892' }}>{ev.timestamp}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#7a8781', marginTop: 2 }}>
                    {ev.screenName && <span>{ev.screenName}</span>}
                    {ev.city && <span>• {ev.city}</span>}
                    {ev.deviceType && <span>• {ev.os}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. MODAL: POSTHOG API KEY CONFIGURATION */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-button close" onClick={() => setModalOpen(false)}>
              <X size={17} />
            </button>
            <span className="eyebrow"><KeyRound size={13} /> POSTHOG CANLI BAĞLANTI</span>
            <h2>PostHog API Anahtarını Tanımla</h2>
            <p>
              Canlı sorgular ve verilerin otomatik çekilmesi için PostHog panelinizden oluşturulmuş
              <strong> Personal API Key (phx_...)</strong> anahtarına ihtiyaç vardır.
            </p>

            <form onSubmit={handleSaveConfig} style={{ marginTop: 20 }}>
              <div style={{ background: '#f0f4f1', padding: 14, borderRadius: 12, marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#43544b' }}>
                  <strong>Nasıl Alınır?</strong>
                  <br />
                  1. <a href="https://eu.posthog.com/settings/user-api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    PostHog Kişisel API Anahtarları <ExternalLink size={12} />
                  </a> sayfasına gidin.
                  <br />
                  2. <strong>Create personal API key</strong> butonuna basıp bir anahtar üretin.
                  <br />
                  3. <code>phx_</code> ile başlayan anahtarı aşağıdaki kutuya yapıştırın.
                </p>
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Personal API Key:
                <input
                  type="password"
                  placeholder="phx_xxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    marginTop: 6,
                    fontFamily: 'monospace',
                  }}
                />
              </label>

              {saveMessage && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#eaf6ec', color: '#278754', fontSize: 12, fontWeight: 600 }}>
                  {saveMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="primary" style={{ flex: 1 }} disabled={saveLoading || !apiKeyInput.trim()}>
                  {saveLoading ? 'Kaydediliyor…' : 'Anahtarı Kaydet ve Bağlan'}
                </button>
                <button type="button" className="secondary" onClick={() => setModalOpen(false)}>
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
