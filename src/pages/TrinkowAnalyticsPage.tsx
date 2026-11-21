import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  KeyRound,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { api } from '../api';
import type { AnalyticsOverview, TrinkowUser, TrinkowUsersResponse } from '../types';

export function TrinkowAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('users');

  // Analytics tab state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [modalOpen, setModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Users tab state
  const [usersData, setUsersData] = useState<TrinkowUsersResponse | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<'all' | 'today' | 'premium' | 'suspended'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalUser, setDeleteModalUser] = useState<TrinkowUser | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = (page = userPage, filter = userFilter, search = userSearch) => {
    setUsersLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    if (filter !== 'all') {
      query.set('filter', filter);
    }
    if (search.trim()) {
      query.set('q', search.trim());
    }

    api<TrinkowUsersResponse>(`/v1/analytics/trinkow/users?${query.toString()}`)
      .then((res) => {
        setUsersData(res);
        setUsersLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Trinkow users fetch error:', err);
        setUsersLoading(false);
      });
  };

  // Fetch PostHog analytics
  const fetchAnalytics = (range = timeRange) => {
    setAnalyticsLoading(true);
    api<AnalyticsOverview>(`/v1/analytics/trinkow?time_range=${range}`)
      .then((res) => {
        setAnalyticsData(res);
        setAnalyticsLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Analytics fetch error:', err);
        setAnalyticsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers(userPage, userFilter, userSearch);
  }, [userPage, userFilter]);

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      fetchAnalytics(timeRange);
    }
  }, [activeTab, timeRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(1, userFilter, userSearch);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (user: TrinkowUser) => {
    const nextStatus = !user.suspended;
    const confirmMessage = nextStatus
      ? `"${user.email}" kullanıcısını askıya almak istediğinize emin misiniz? Kullanıcının oturumu anında sonlandırılacaktır.`
      : `"${user.email}" kullanıcısının askısını kaldırmak istediğinize emin misiniz?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await api(`/v1/analytics/trinkow/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ askida: nextStatus }),
      });
      setActionNotice(
        nextStatus
          ? `${user.email} hesabı askıya alındı ve oturumu sonlandırıldı.`
          : `${user.email} hesabının askısı kaldırıldı.`
      );
      setTimeout(() => setActionNotice(null), 4000);
      fetchUsers(userPage, userFilter, userSearch);
    } catch (err: any) {
      alert(`İşlem başarısız: ${err?.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalUser) return;
    if (!adminPasswordInput.trim()) {
      setDeleteError('Lütfen yönetici şifrenizi girin.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api(`/v1/analytics/trinkow/users/${deleteModalUser.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ adminPassword: adminPasswordInput }),
      });
      const deletedEmail = deleteModalUser.email;
      setDeleteModalUser(null);
      setAdminPasswordInput('');
      setActionNotice(`"${deletedEmail}" kullanıcısı ve tüm ilişkili verileri kalıcı olarak silindi.`);
      setTimeout(() => setActionNotice(null), 5000);
      fetchUsers(userPage, userFilter, userSearch);
    } catch (err: any) {
      setDeleteError(err?.message || 'Kullanıcı silinemedi. Lütfen şifrenizi kontrol edin.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
        fetchAnalytics(timeRange);
      }, 1000);
    } catch {
      setSaveMessage('Kaydedilemedi. Lütfen anahtar formatını kontrol edin.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="page">
      {/* 1. HERO ROW */}
      <section className="hero-row">
        <div>
          <span className="eyebrow">
            <span style={{ background: '#34d399' }} />
            TRINKOW CANLI YÖNETİM MERKEZİ
          </span>
          <h1>Trinkow Yönetim & Analitik</h1>
          <p>Kayıtlı kullanıcıları listeleme, premium üyelik takibi, hesap askıya alma, güvenli silme ve davranış analitiği.</p>
        </div>

        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#eef2ee', padding: 4, borderRadius: 14 }}>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 0,
              borderRadius: 10,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'users' ? 'white' : 'transparent',
              color: activeTab === 'users' ? 'var(--ink)' : '#617167',
              boxShadow: activeTab === 'users' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: '0.15s ease',
            }}
          >
            <Users size={16} />
            <span>Kullanıcı Yönetimi</span>
            {usersData && (
              <span
                style={{
                  background: activeTab === 'users' ? 'var(--ink)' : '#dce3dd',
                  color: activeTab === 'users' ? 'white' : '#526359',
                  borderRadius: 99,
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {usersData.total_users}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 0,
              borderRadius: 10,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'analytics' ? 'white' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--ink)' : '#617167',
              boxShadow: activeTab === 'analytics' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: '0.15s ease',
            }}
          >
            <Activity size={16} />
            <span>Davranış & Huni Analitiği</span>
          </button>
        </div>
      </section>

      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div
          style={{
            background: '#eaf6ec',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '12px 18px',
            borderRadius: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#28a745" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{ border: 0, background: 'none', cursor: 'pointer', color: '#155724' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: KULLANICI YÖNETİMİ                                */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <>
          {/* USER METRIC CARDS (CLICKABLE AS QUICK FILTERS) */}
          <section className="metrics" style={{ marginBottom: 28 }}>
            <div
              onClick={() => {
                setUserFilter('all');
                setUserPage(1);
              }}
              style={{
                cursor: 'pointer',
                borderColor: userFilter === 'all' ? 'var(--ink)' : '#e2e6e1',
                boxShadow: userFilter === 'all' ? '0 0 0 2px var(--ink)' : 'none',
              }}
            >
              <span className="metric-icon blue"><Users /></span>
              <p>Toplam Kayıtlı Kullanıcı</p>
              <strong>{usersData ? usersData.total_users.toLocaleString('tr-TR') : '…'}</strong>
              <small>Trinkow veritabanındaki tüm hesaplar</small>
            </div>

            <div
              onClick={() => {
                setUserFilter('today');
                setUserPage(1);
              }}
              style={{
                cursor: 'pointer',
                borderColor: userFilter === 'today' ? '#278754' : '#e2e6e1',
                boxShadow: userFilter === 'today' ? '0 0 0 2px #278754' : 'none',
              }}
            >
              <span className="metric-icon green"><Sparkles /></span>
              <p>Bugün Kaydolanlar</p>
              <strong>{usersData ? usersData.today_users.toLocaleString('tr-TR') : '…'}</strong>
              <small>Son 24 saatte / bugün açılan hesaplar</small>
            </div>

            <div
              onClick={() => {
                setUserFilter('premium');
                setUserPage(1);
              }}
              style={{
                cursor: 'pointer',
                borderColor: userFilter === 'premium' ? '#b87518' : '#e2e6e1',
                boxShadow: userFilter === 'premium' ? '0 0 0 2px #b87518' : 'none',
              }}
            >
              <span className="metric-icon amber"><Crown /></span>
              <p>Premium Üyeler</p>
              <strong>{usersData ? usersData.premium_users.toLocaleString('tr-TR') : '…'}</strong>
              <small>Aktif veya ömür boyu üyeler</small>
            </div>

            <div
              onClick={() => {
                setUserFilter('suspended');
                setUserPage(1);
              }}
              style={{
                cursor: 'pointer',
                borderColor: userFilter === 'suspended' ? '#d32f2f' : '#e2e6e1',
                boxShadow: userFilter === 'suspended' ? '0 0 0 2px #d32f2f' : 'none',
              }}
            >
              <span className="metric-icon" style={{ background: '#fdeded', color: '#d32f2f' }}>
                <UserX />
              </span>
              <p>Askıya Alınanlar</p>
              <strong>{usersData ? usersData.suspended_users.toLocaleString('tr-TR') : '…'}</strong>
              <small>Girişleri kısıtlanmış hesaplar</small>
            </div>
          </section>

          {/* SEARCH, FILTER & REFRESH BAR */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e1e6e1',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280 }}>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search size={16} style={{ position: 'absolute', left: 14, color: '#88958c' }} />
                <input
                  type="text"
                  placeholder="E-posta veya Kullanıcı ID ile ara..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 10,
                    border: '1px solid #d4ded6',
                    fontSize: 13,
                    background: '#fcfdfc',
                  }}
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch('');
                      setUserPage(1);
                      fetchUsers(1, userFilter, '');
                    }}
                    style={{
                      position: 'absolute',
                      right: 12,
                      border: 0,
                      background: 'none',
                      cursor: 'pointer',
                      color: '#88958c',
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <button type="submit" className="secondary compact" style={{ padding: '0 16px' }}>
                Ara
              </button>
            </form>

            {/* Filter pills & controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', background: '#f0f3f0', padding: 3, borderRadius: 10 }}>
                {(
                  [
                    { key: 'all', label: 'Tümü' },
                    { key: 'today', label: 'Bugün Kaydolan' },
                    { key: 'premium', label: 'Premium' },
                    { key: 'suspended', label: 'Askıda' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setUserFilter(tab.key);
                      setUserPage(1);
                    }}
                    style={{
                      border: 0,
                      borderRadius: 8,
                      padding: '6px 13px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: userFilter === tab.key ? 'white' : 'transparent',
                      color: userFilter === tab.key ? 'var(--ink)' : '#69796e',
                      boxShadow: userFilter === tab.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="secondary compact"
                onClick={() => fetchUsers(userPage, userFilter, userSearch)}
                title="Listeyi Yenile"
                disabled={usersLoading}
              >
                <RefreshCw size={15} className={usersLoading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* USERS TABLE CARD */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e1e6e1',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 960 }}>
                <thead>
                  <tr style={{ background: '#f9fbf9', borderBottom: '1px solid #e7ebe7' }}>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em' }}>
                      KULLANICI BİLGİSİ
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em' }}>
                      SAĞLAYICI
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em' }}>
                      KAYIT TARİHİ
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em' }}>
                      PREMIUM DURUMU
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em' }}>
                      HESAP DURUMU
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#748378', letterSpacing: '0.06em', textAlign: 'right' }}>
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading && (!usersData || usersData.items.length === 0) ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#78867c' }}>
                        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                        <p style={{ margin: 0, fontSize: 13 }}>Kullanıcılar yükleniyor…</p>
                      </td>
                    </tr>
                  ) : !usersData || usersData.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#78867c' }}>
                        <Users size={32} style={{ margin: '0 auto 10px', color: '#a6b3aa' }} />
                        <h4 style={{ margin: '0 0 6px', color: '#334139' }}>Eşleşen Kullanıcı Bulunamadı</h4>
                        <p style={{ margin: 0, fontSize: 12 }}>Arama veya filtre kriterlerinizi değiştirip tekrar deneyin.</p>
                      </td>
                    </tr>
                  ) : (
                    usersData.items.map((user) => {
                      const isAppleRelay = user.email.includes('privaterelay.appleid.com');
                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: '1px solid #eef2ee',
                            transition: '0.1s ease',
                            background: user.suspended ? '#fff9f9' : 'transparent',
                          }}
                        >
                          {/* USER INFO */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 12,
                                  background: user.suspended
                                    ? '#fee2e2'
                                    : user.premium.active
                                    ? '#fef3c7'
                                    : '#e8f3ea',
                                  color: user.suspended
                                    ? '#b91c1c'
                                    : user.premium.active
                                    ? '#92400e'
                                    : '#24663c',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontWeight: 800,
                                  fontSize: 14,
                                  flexShrink: 0,
                                }}
                              >
                                {user.premium.active ? (
                                  <Crown size={18} />
                                ) : (
                                  user.email.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <strong
                                    style={{
                                      fontSize: 13,
                                      color: '#1b2620',
                                      wordBreak: 'break-all',
                                    }}
                                  >
                                    {user.email}
                                  </strong>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(user.email, `email-${user.id}`)}
                                    title="E-postayı Kopyala"
                                    style={{ border: 0, background: 'none', cursor: 'pointer', color: '#88978d', padding: 2 }}
                                  >
                                    {copiedId === `email-${user.id}` ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                  </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <span style={{ fontSize: 11, color: '#808e84', fontFamily: 'monospace' }}>
                                    {user.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(user.id, `id-${user.id}`)}
                                    title="ID'yi Kopyala"
                                    style={{ border: 0, background: 'none', cursor: 'pointer', color: '#88978d', padding: 2 }}
                                  >
                                    {copiedId === `id-${user.id}` ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                                  </button>
                                  {isAppleRelay && (
                                    <span style={{ fontSize: 10, background: '#f1f3f1', color: '#68776d', padding: '1px 6px', borderRadius: 4 }}>
                                      Gizli Apple E-postası
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* AUTH PROVIDER */}
                          <td style={{ padding: '16px 20px' }}>
                            {user.provider === 'google' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                Google
                              </span>
                            ) : user.provider === 'apple' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#18181b',
                                  color: '#ffffff',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                Apple
                              </span>
                            ) : user.provider === 'demo' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#f4f4f5',
                                  color: '#71717a',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                Demo
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                E-posta
                              </span>
                            )}
                          </td>

                          {/* REGISTRATION DATE */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 650, color: '#243229' }}>
                                  {user.created_at
                                    ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '—'}
                                </span>
                                {user.is_today && (
                                  <span
                                    style={{
                                      background: '#dcfce7',
                                      color: '#166534',
                                      border: '1px solid #86efac',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: 6,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Bugün
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 11, color: '#88978c' }}>
                                {user.created_at
                                  ? new Date(user.created_at).toLocaleTimeString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            </div>
                          </td>

                          {/* PREMIUM STATUS */}
                          <td style={{ padding: '16px 20px' }}>
                            {user.premium.active ? (
                              <div>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    padding: '4px 9px',
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  <Crown size={13} />
                                  <span>Premium Aktif</span>
                                </span>
                                <div style={{ fontSize: 11, color: '#68776d', marginTop: 4 }}>
                                  {user.premium.lifetime ? (
                                    <span>Ömür Boyu Erişim</span>
                                  ) : user.premium.expires_at ? (
                                    <span>
                                      Bitiş:{' '}
                                      {new Date(user.premium.expires_at).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  ) : null}
                                  {user.premium.store && (
                                    <span style={{ marginLeft: 6, opacity: 0.8 }}>
                                      ({user.premium.store === 'play_store' ? 'Google Play' : 'App Store'})
                                    </span>
                                  )}
                                  {user.premium.environment === 'SANDBOX' && (
                                    <span style={{ marginLeft: 5, color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>
                                      [TEST]
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: '#f4f5f4',
                                    color: '#6c7a71',
                                    padding: '4px 9px',
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 650,
                                  }}
                                >
                                  Ücretsiz
                                </span>
                                {user.premium.expires_at && (
                                  <div style={{ fontSize: 10, color: '#97a39b', marginTop: 3 }}>
                                    Süresi doldu (
                                    {new Date(user.premium.expires_at).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    )
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* ACCOUNT STATUS (ACTIVE VS SUSPENDED) */}
                          <td style={{ padding: '16px 20px' }}>
                            {user.suspended ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                <AlertCircle size={13} />
                                <span>Askıya Alındı</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#e8f8ec',
                                  color: '#16a34a',
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle2 size={13} />
                                <span>Aktif</span>
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              {/* Suspend / Unsuspend button */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                title={user.suspended ? 'Hesap askısını kaldır' : 'Hesabı askıya al'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  border: '1px solid',
                                  borderColor: user.suspended ? '#86efac' : '#fed7aa',
                                  background: user.suspended ? '#f0fdf4' : '#fff7ed',
                                  color: user.suspended ? '#166534' : '#c2410c',
                                  borderRadius: 8,
                                  padding: '6px 11px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {user.suspended ? (
                                  <>
                                    <UserCheck size={13} />
                                    <span>Aktif Et</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX size={13} />
                                    <span>Askıya Al</span>
                                  </>
                                )}
                              </button>

                              {/* Delete button (Requires password confirmation) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteModalUser(user);
                                  setAdminPasswordInput('');
                                  setDeleteError(null);
                                }}
                                title="Kullanıcıyı ve verilerini kalıcı olarak sil"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  border: '1px solid #fecaca',
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                  borderRadius: 8,
                                  padding: '6px 11px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Sil</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {usersData && usersData.total_pages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: '#f9fbf9',
                  borderTop: '1px solid #e7ebe7',
                  fontSize: 12,
                  color: '#65746a',
                }}
              >
                <div>
                  Toplam <strong>{usersData.total_users}</strong> kullanıcıdan {(userPage - 1) * usersData.limit + 1} -{' '}
                  {Math.min(userPage * usersData.limit, usersData.total_users)} arası gösteriliyor
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage <= 1 || usersLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <ArrowLeft size={13} />
                    <span>Önceki</span>
                  </button>
                  <span style={{ fontWeight: 700, color: '#27342c' }}>
                    Sayfa {userPage} / {usersData.total_pages}
                  </span>
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => setUserPage((p) => Math.min(usersData.total_pages, p + 1))}
                    disabled={userPage >= usersData.total_pages || usersLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>Sonraki</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: POSTHOG DAVRANIŞ & HUNİ ANALİTİĞİ                 */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <>
          {analyticsLoading && !analyticsData ? (
            <div className="page-loading">
              <RefreshCw className="spin" size={24} />
              <p style={{ marginTop: 12 }}>Trinkow davranış verileri analiz ediliyor…</p>
            </div>
          ) : !analyticsData ? (
            <div className="form-error">Veri yüklenemedi. Lütfen backend bağlantınızı kontrol edin.</div>
          ) : (
            <>
              {/* TIME RANGE & CONFIG ROW */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
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
                  onClick={() => fetchAnalytics(timeRange)}
                  title="Yenile"
                  disabled={analyticsLoading}
                >
                  <RefreshCw size={15} className={analyticsLoading ? 'spin' : ''} />
                </button>

                <button
                  type="button"
                  className="secondary compact"
                  onClick={() => setModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <KeyRound size={15} />
                  <span>{analyticsData.config.hasApiKey ? 'API Anahtarı' : 'API Bağla'}</span>
                </button>
              </div>

              {/* AI BEHAVIORAL SUMMARY BANNER */}
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
                    {analyticsData.behaviorSummary}
                  </p>
                </div>
              </section>

              {/* KPI CARDS */}
              <section className="metrics">
                <div>
                  <span className="metric-icon blue"><Activity /></span>
                  <p>Toplam Olay</p>
                  <strong>{analyticsData.totalEvents.toLocaleString('tr-TR')}</strong>
                  <small>Seçili dönemde kaydedilen eylemler</small>
                </div>
                <div>
                  <span className="metric-icon green"><Users /></span>
                  <p>Aktif Kullanıcı</p>
                  <strong>{analyticsData.activeUsers.toLocaleString('tr-TR')}</strong>
                  <small>Tekil cihaz / kullanıcı oturumu</small>
                </div>
                <div>
                  <span className="metric-icon violet"><Compass /></span>
                  <p>En Çok Gezilen Ekran</p>
                  <strong style={{ fontSize: 20, lineHeight: 'normal', marginTop: 14 }}>{analyticsData.topScreen}</strong>
                  <small>En yüksek kullanıcı trafiği</small>
                </div>
                <div>
                  <span className="metric-icon amber"><Crown /></span>
                  <p>Paywall Dönüşümü</p>
                  <strong>%{analyticsData.paywall.overallConversion}</strong>
                  <small>{analyticsData.paywall.steps[3]?.count ?? 0} başarılı Premium satış</small>
                </div>
              </section>

              {/* PAYWALL FUNNEL */}
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    {analyticsData.paywall.steps.map((step, idx) => (
                      <div
                        key={step.stepId}
                        style={{
                          background: '#f8faf8',
                          border: '1px solid #e2e8e3',
                          borderRadius: 14,
                          padding: 16,
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--ink)',
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#68776e' }}>
                            {step.conversionRate}% dönüşüm
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 750, color: '#1a2720' }}>{step.title}</h4>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#132219' }}>{step.count.toLocaleString('tr-TR')}</div>
                        {idx > 0 && (
                          <div
                            style={{
                              marginTop: 10,
                              paddingTop: 8,
                              borderTop: '1px dashed #dce3dd',
                              fontSize: 11,
                              color: '#c2410c',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <ArrowDownRight size={13} />
                            <span>%{step.dropoffRate} terk ({step.dropoffCount} kişi)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reasons banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    <div style={{ background: '#fef3c7', borderRadius: 12, padding: 14, color: '#92400e' }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>KAPATILAN PAYWALL</div>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{analyticsData.paywall.dismissedCount}</div>
                      <small style={{ fontSize: 10, opacity: 0.85 }}>Satın almadan X veya geri ile kapatıldı</small>
                    </div>
                    <div style={{ background: '#fee2e2', borderRadius: 12, padding: 14, color: '#991b1b' }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>ÖDEME İPTALİ</div>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{analyticsData.paywall.cancelledCount}</div>
                      <small style={{ fontSize: 10, opacity: 0.85 }}>Google/Apple sheet'inde iptal edildi</small>
                    </div>
                    <div style={{ background: '#f3e8ff', borderRadius: 12, padding: 14, color: '#6b21a8' }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>BAŞARILI DÖNÜŞÜM</div>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>%{analyticsData.paywall.overallConversion}</div>
                      <small style={{ fontSize: 10, opacity: 0.85 }}>Paywall görenlerin satın alma oranı</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCREENS TABLE */}
              <div className="table-card" style={{ marginBottom: 38 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #edf0ed' }}>
                  <span className="eyebrow"><Layers size={13} /> EKRAN DAVRANIŞLARI</span>
                  <h2 style={{ margin: '5px 0 0' }}>Sayfa Sayfa Kullanıcı Akışı</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>EKRAN ADI</th>
                        <th>GÖSTERİM</th>
                        <th>TEKİL KULLANICI</th>
                        <th>TRAFİK PAYI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.screens.map((s) => (
                        <tr key={s.screen}>
                          <td>
                            <strong>{s.screenTitle}</strong>
                            <div style={{ fontSize: 11, color: '#88958c', fontFamily: 'monospace' }}>{s.screen}</div>
                          </td>
                          <td><strong>{s.views.toLocaleString('tr-TR')}</strong></td>
                          <td>{s.uniqueVisitors.toLocaleString('tr-TR')}</td>
                          <td style={{ minWidth: 160 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 6, background: '#e9ede9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${s.percentage}%`, height: '100%', background: 'var(--ink)' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#55635b' }}>%{s.percentage}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE EVENTS FEED */}
              <div className="table-card">
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #edf0ed' }}>
                  <span className="eyebrow"><Clock size={13} /> CANLI ETKİNLİK AKIŞI</span>
                  <h2 style={{ margin: '5px 0 0' }}>Gerçek Zamanlı Kullanıcı Eylemleri</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>OLAY</th>
                        <th>EKRAN</th>
                        <th>CİHAZ / OS</th>
                        <th>KONUM</th>
                        <th>ZAMAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.recentEvents.map((evt) => (
                        <tr key={evt.id}>
                          <td>
                            <strong style={{ color: '#16231d' }}>{evt.eventDisplay}</strong>
                            <div style={{ fontSize: 11, color: '#88958c', fontFamily: 'monospace' }}>{evt.event}</div>
                          </td>
                          <td>{evt.screenName || '—'}</td>
                          <td>{evt.deviceType || evt.os || 'Mobil Cihaz'}</td>
                          <td>{evt.city && evt.country ? `${evt.city}, ${evt.country}` : evt.country || '—'}</td>
                          <td>{new Date(evt.timestamp).toLocaleTimeString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* DELETE USER CONFIRMATION MODAL (WITH ADMIN PASSWORD RE-AUTH) */}
      {/* ========================================================= */}
      {deleteModalUser && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#991b1b' }}>Kullanıcıyı Kalıcı Olarak Sil</h2>
                <p style={{ margin: '4px 0 0', color: '#68776d', fontSize: 12 }}>
                  Bu işlem tüm verileri geri alınamaz biçimde silecektir.
                </p>
              </div>
            </div>

            {/* Warning Alert Box */}
            <div
              style={{
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: 12,
                padding: 14,
                marginBottom: 18,
                fontSize: 12,
                lineHeight: 1.5,
                color: '#9b2c2c',
              }}
            >
              <strong>DİKKAT:</strong> Bu kullanıcı silindiğinde:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                <li>Tüm harcamaları, kategorileri ve bütçe planları</li>
                <li>Apple yetkilendirme ve oturum tokenları</li>
                <li>RevenueCat müşteri abonelik kaydı</li>
              </ul>
              sunucudan <strong>bütünüyle ve kalıcı olarak kaldırılacaktır</strong>.
            </div>

            {/* Target User Details */}
            <div
              style={{
                background: '#f4f6f4',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: 12,
              }}
            >
              <div style={{ color: '#748378', fontSize: 11 }}>Silinecek Hesap:</div>
              <strong style={{ fontSize: 13, color: '#1d2a23' }}>{deleteModalUser.email}</strong>
              <div style={{ fontSize: 11, color: '#88978d', fontFamily: 'monospace', marginTop: 2 }}>
                ID: {deleteModalUser.id}
              </div>
            </div>

            <form onSubmit={handleDeleteUser}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#27342c' }}>
                Güvenlik Doğrulaması (Yönetici Şifreniz):
                <input
                  type="password"
                  placeholder="Yönetici şifrenizi girin..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #d4ded6',
                    marginTop: 6,
                    fontSize: 14,
                  }}
                />
              </label>

              {deleteError && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 8,
                    background: '#fde8e8',
                    color: '#9b1c1c',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setDeleteModalUser(null);
                    setAdminPasswordInput('');
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                  style={{ flex: 1 }}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={deleteLoading || !adminPasswordInput.trim()}
                  style={{
                    flex: 1.4,
                    background: '#dc2626',
                    color: 'white',
                    border: 0,
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontWeight: 750,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: deleteLoading || !adminPasswordInput.trim() ? 0.6 : 1,
                  }}
                >
                  {deleteLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Siliniyor…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Kullanıcıyı Kalıcı Sil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POSTHOG CONFIG MODAL                                      */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>PostHog Entegrasyonu</h2>
            <p>
              Canlı analitik ve paywall dönüşüm verilerini PostHog projenizden çekebilmek için Personal API Key tanımlayın.
            </p>

            <form onSubmit={handleSaveConfig} style={{ marginTop: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>
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
