import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  Play,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { api, downloadApiFile } from '../api';
import type { MapsJob, MapsJobStatus, MapsResults, MapsStatus } from '../types';

type JobForm = {
  keywords: string;
  language: string;
  depth: number;
  maxTimeSeconds: number;
  latitude: string;
  longitude: string;
  zoom: number;
  radius: number;
  fastMode: boolean;
  email: boolean;
  extraReviews: boolean;
};

const initialForm: JobForm = {
  keywords: '', language: 'tr', depth: 5, maxTimeSeconds: 600,
  latitude: '', longitude: '', zoom: 15, radius: 10000,
  fastMode: false, email: false, extraReviews: false,
};

const statusLabel: Record<MapsJobStatus, string> = {
  queued: 'Sırada', running: 'Taranıyor', completed: 'Tamamlandı',
  failed: 'Başarısız', cancelled: 'İptal edildi',
};

const activeStatuses = new Set<MapsJobStatus>(['queued', 'running']);

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value));
}

export function MapsPage() {
  const [status, setStatus] = useState<MapsStatus | null>(null);
  const [jobs, setJobs] = useState<MapsJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<MapsResults | null>(null);
  const [form, setForm] = useState<JobForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? null,
    [jobs, selectedId],
  );
  const hasActiveJobs = jobs.some((job) => activeStatuses.has(job.status));

  const loadJobs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const nextStatus = await api<MapsStatus>('/v1/maps/status');
      setStatus(nextStatus);
      if (!nextStatus.configured) {
        setJobs([]);
        setSelectedId(null);
        setError('');
        return;
      }
      const nextJobs = await api<MapsJob[]>('/v1/maps/jobs');
      setJobs(nextJobs);
      setSelectedId((current) => current && nextJobs.some((job) => job.id === current)
        ? current
        : nextJobs[0]?.id ?? null);
      setError('');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Maps verileri alınamadı.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async (jobId: string, quiet = false) => {
    if (!quiet) setResultsLoading(true);
    try {
      setResults(await api<MapsResults>(`/v1/maps/jobs/${jobId}/results?limit=100`));
    } catch (unknownError) {
      setResults(null);
      if (!quiet) setError(unknownError instanceof Error ? unknownError.message : 'Sonuçlar alınamadı.');
    } finally {
      if (!quiet) setResultsLoading(false);
    }
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);
  useEffect(() => {
    if (!selectedJob || selectedJob.status !== 'completed') { setResults(null); return; }
    void loadResults(selectedJob.id);
  }, [selectedJob?.id, selectedJob?.status, loadResults]);
  useEffect(() => {
    if (!hasActiveJobs) return undefined;
    const timer = window.setInterval(() => { void loadJobs(true); }, 5000);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs, loadJobs]);

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError(''); setMessage('');
    const keywords = form.keywords.split(/\r?\n/).map((keyword) => keyword.trim()).filter(Boolean);
    try {
      const job = await api<MapsJob>('/v1/maps/jobs', {
        method: 'POST',
        body: JSON.stringify({
          keywords,
          language: form.language,
          depth: form.depth,
          maxTimeSeconds: form.maxTimeSeconds,
          zoom: form.zoom,
          radius: form.radius,
          fastMode: form.fastMode,
          email: form.email,
          extraReviews: form.extraReviews,
          ...(form.latitude ? { latitude: Number(form.latitude) } : {}),
          ...(form.longitude ? { longitude: Number(form.longitude) } : {}),
        }),
      });
      setForm((current) => ({ ...initialForm, language: current.language }));
      setSelectedId(job.id);
      setMessage('Tarama işi sıraya alındı. Durum otomatik yenilenecek.');
      await loadJobs(true);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Tarama başlatılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteJob = async (job: MapsJob) => {
    if (!window.confirm('Bu tarama işi ve tüm sonuçları silinsin mi?')) return;
    try {
      await api(`/v1/maps/jobs/${job.id}`, { method: 'DELETE' });
      setMessage('Tarama işi silindi.');
      setResults(null);
      await loadJobs(true);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'İş silinemedi.');
    }
  };

  const download = async (job: MapsJob) => {
    try {
      await downloadApiFile(`/v1/maps/jobs/${job.id}/results.csv`, `maps-${job.id}.csv`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'CSV indirilemedi.');
    }
  };

  return <div className="page maps-page">
    <section className="hero-row"><div><span className="eyebrow"><span /> LEAD ARAŞTIRMA</span><h1>Google Maps tarama</h1><p>Lokasyon bazlı işletmeleri bul, sonuçları incele ve CSV olarak dışa aktar.</p></div><button className="secondary" onClick={() => loadJobs()} disabled={loading}><RefreshCw size={16} /> Yenile</button></section>

    <section className={`maps-connection ${status?.connected ? 'connected' : ''}`}>
      <span className="maps-connection-icon"><MapPinned /></span><div><small>SERVİS DURUMU</small><strong>{status?.connected ? 'Scraper hazır' : status?.configured ? 'Scraper yanıt vermiyor' : 'Scraper yapılandırılmadı'}</strong><p>{status?.connected ? 'Yeni işler kuyruklanabilir; çalışan işler 5 saniyede bir yenilenir.' : status?.error ?? 'Backend ortamına MAPS_BASE_URL ve MAPS_API_KEY ekleyin.'}</p></div><span className={`connection-badge ${status?.connected ? 'ok' : ''}`}>{status?.connected ? <CheckCircle2 /> : <CircleAlert />}{status?.connected ? 'Çevrimiçi' : 'Kontrol gerekli'}</span>
    </section>

    {message && <div className="success-message" aria-live="polite"><CheckCircle2 size={16} /> {message}</div>}
    {error && <div className="form-error maps-alert" role="alert"><CircleAlert size={16} /> {error}</div>}

    <section className="maps-workspace">
      <form className="maps-job-form" onSubmit={createJob}>
        <div className="maps-card-head"><div><span className="eyebrow">YENİ İŞ</span><h2>Tarama başlat</h2></div><span className="step-number">01</span></div>
        <label>Arama kelimeleri <small>Her satıra bir sorgu</small><textarea required rows={6} placeholder={'Kadıköy kahve dükkanı\nİstanbul mobil uygulama ajansı'} value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} /></label>
        <div className="form-grid"><label>Dil<select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="tr">Türkçe</option><option value="en">İngilizce</option><option value="de">Almanca</option><option value="fr">Fransızca</option></select></label><label>Tarama derinliği<input type="number" min="1" max="100" value={form.depth} onChange={(event) => setForm({ ...form, depth: Number(event.target.value) })} /></label></div>
        <div className="form-grid"><label>Süre sınırı (sn)<input type="number" min="60" max="7200" value={form.maxTimeSeconds} onChange={(event) => setForm({ ...form, maxTimeSeconds: Number(event.target.value) })} /></label><label>Yakınlık yarıçapı (m)<input type="number" min="1" max="100000" value={form.radius} onChange={(event) => setForm({ ...form, radius: Number(event.target.value) })} /></label></div>
        <details className="maps-advanced"><summary>Konum ve gelişmiş seçenekler</summary><div className="form-grid"><label>Enlem<input type="number" step="any" min="-90" max="90" placeholder="41.0082" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></label><label>Boylam<input type="number" step="any" min="-180" max="180" placeholder="28.9784" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></label></div><label>Harita yakınlaştırma<input type="number" min="1" max="21" value={form.zoom} onChange={(event) => setForm({ ...form, zoom: Number(event.target.value) })} /></label><div className="check-grid"><label><input type="checkbox" checked={form.fastMode} onChange={(event) => setForm({ ...form, fastMode: event.target.checked })} /> Hızlı mod</label><label><input type="checkbox" checked={form.email} onChange={(event) => setForm({ ...form, email: event.target.checked })} /> E-posta ara</label><label><input type="checkbox" checked={form.extraReviews} onChange={(event) => setForm({ ...form, extraReviews: event.target.checked })} /> Ek yorumlar</label></div>{form.fastMode && <p className="field-hint">Hızlı mod için enlem ve boylam zorunludur.</p>}</details>
        <button className="primary" disabled={submitting || !status?.connected}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}{submitting ? 'Sıraya alınıyor…' : 'Taramayı başlat'}</button>
      </form>

      <section className="maps-jobs-card">
        <div className="maps-card-head"><div><span className="eyebrow">İŞ GEÇMİŞİ</span><h2>Taramalar</h2></div><span className="job-count">{jobs.length}</span></div>
        {loading ? <div className="maps-empty"><LoaderCircle className="spin" /><p>İşler yükleniyor…</p></div> : jobs.length === 0 ? <div className="maps-empty"><Search /><strong>Henüz tarama yok</strong><p>İlk sorgunu soldaki formdan başlat.</p></div> : <div className="maps-job-list">{jobs.map((job) => <button type="button" key={job.id} className={`maps-job-row ${selectedId === job.id ? 'selected' : ''}`} onClick={() => setSelectedId(job.id)}><span className={`job-state ${job.status}`}>{activeStatuses.has(job.status) ? <LoaderCircle className="spin" /> : job.status === 'completed' ? <CheckCircle2 /> : <CircleAlert />}</span><span className="job-main"><strong>{job.params.keywords?.join(', ') || 'Adsız tarama'}</strong><small><Clock3 /> {formatDate(job.created_at)} · {job.result_count} sonuç</small></span><span className={`job-status ${job.status}`}>{statusLabel[job.status]}</span></button>)}</div>}
      </section>
    </section>

    {selectedJob && <section className="maps-results-card">
      <div className="maps-results-head"><div><span className="eyebrow">SEÇİLİ TARAMA</span><h2>{selectedJob.params.keywords?.join(', ') || 'Tarama sonuçları'}</h2><p>{statusLabel[selectedJob.status]} · {selectedJob.result_count} işletme · {formatDate(selectedJob.created_at)}</p></div><div>{selectedJob.status === 'completed' && <button className="secondary" onClick={() => download(selectedJob)}><Download size={16} /> CSV indir</button>}<button className="icon-button danger" onClick={() => deleteJob(selectedJob)} aria-label="Tarama işini sil"><Trash2 /></button></div></div>
      {selectedJob.error_message && <div className="form-error maps-alert"><CircleAlert size={16} /> {selectedJob.error_message}</div>}
      {activeStatuses.has(selectedJob.status) && <div className="maps-progress"><LoaderCircle className="spin" /><div><strong>Tarama devam ediyor</strong><p>Sonuçlar tamamlandığında burada görünecek.</p></div></div>}
      {selectedJob.status === 'completed' && (resultsLoading ? <div className="maps-empty"><LoaderCircle className="spin" /><p>Sonuçlar yükleniyor…</p></div> : results && results.items.length > 0 ? <div className="responsive-table"><table><thead><tr><th>İşletme</th><th>Kategori</th><th>Adres</th><th>Telefon</th><th>Puan</th><th></th></tr></thead><tbody>{results.items.map((place) => <tr key={place.id}><td><strong>{place.title ?? 'İsimsiz işletme'}</strong></td><td>{place.category ?? '—'}</td><td className="maps-address">{place.address ?? '—'}</td><td>{place.phone ?? '—'}</td><td>{place.review_rating ?? '—'}{place.review_count != null && <small className="review-count"> ({place.review_count})</small>}</td><td>{place.website && <a className="external-link" href={place.website} target="_blank" rel="noreferrer" aria-label={`${place.title ?? 'İşletme'} web sitesini aç`}><ExternalLink /></a>}</td></tr>)}</tbody></table></div> : <div className="maps-empty"><Search /><strong>Sonuç bulunamadı</strong><p>Bu tarama tamamlandı ancak kayıt üretmedi.</p></div>)}
    </section>}
  </div>;
}
