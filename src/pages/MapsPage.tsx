import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import type { MapsJob, MapsJobStatus, MapsPlace, MapsResults, MapsStatus } from '../types';

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
  presetId: string;
};

type LocationPreset = {
  id: string;
  label: string;
  lat: string;
  lng: string;
  zoom: number;
  lang: string;
};

const locationPresets: LocationPreset[] = [
  { id: 'custom', label: 'Özel / Manuel Koordinat', lat: '', lng: '', zoom: 15, lang: 'tr' },
  { id: 'de-country', label: '🇩🇪 Almanya (Ülke Geneli)', lat: '51.165691', lng: '10.451526', zoom: 6, lang: 'de' },
  { id: 'de-berlin', label: '🇩🇪 Berlin, Almanya', lat: '52.520008', lng: '13.404954', zoom: 12, lang: 'de' },
  { id: 'de-munich', label: '🇩🇪 Münih, Almanya', lat: '48.137154', lng: '11.576124', zoom: 12, lang: 'de' },
  { id: 'de-frankfurt', label: '🇩🇪 Frankfurt, Almanya', lat: '50.110924', lng: '8.682127', zoom: 12, lang: 'de' },
  { id: 'de-hamburg', label: '🇩🇪 Hamburg, Almanya', lat: '53.551086', lng: '9.993682', zoom: 12, lang: 'de' },
  { id: 'de-cologne', label: '🇩🇪 Köln, Almanya', lat: '50.937531', lng: '6.960279', zoom: 12, lang: 'de' },
  { id: 'tr-country', label: '🇹🇷 Türkiye (Ülke Geneli)', lat: '38.963745', lng: '35.243322', zoom: 6, lang: 'tr' },
  { id: 'tr-istanbul', label: '🇹🇷 İstanbul, Türkiye', lat: '41.008238', lng: '28.978359', zoom: 12, lang: 'tr' },
  { id: 'tr-ankara', label: '🇹🇷 Ankara, Türkiye', lat: '39.933364', lng: '32.859742', zoom: 12, lang: 'tr' },
  { id: 'tr-izmir', label: '🇹🇷 İzmir, Türkiye', lat: '38.423734', lng: '27.142826', zoom: 12, lang: 'tr' },
  { id: 'us-country', label: '🇺🇸 ABD (Ülke Geneli)', lat: '37.090240', lng: '-95.712891', zoom: 4, lang: 'en' },
  { id: 'us-nyc', label: '🇺🇸 New York, ABD', lat: '40.712776', lng: '-74.005974', zoom: 12, lang: 'en' },
  { id: 'uk-london', label: '🇬🇧 Londra, Birleşik Krallık', lat: '51.507351', lng: '-0.127758', zoom: 12, lang: 'en' },
  { id: 'fr-paris', label: '🇫🇷 Paris, Fransa', lat: '48.856614', lng: '2.352222', zoom: 12, lang: 'fr' },
  { id: 'nl-amsterdam', label: '🇳🇱 Amsterdam, Hollanda', lat: '52.367573', lng: '4.904139', zoom: 12, lang: 'en' },
  { id: 'it-rome', label: '🇮🇹 Roma, İtalya', lat: '41.902784', lng: '12.496366', zoom: 12, lang: 'it' },
  { id: 'es-madrid', label: '🇪🇸 Madrid, İspanya', lat: '40.416775', lng: '-3.703790', zoom: 12, lang: 'es' },
];

const initialForm: JobForm = {
  keywords: '', language: 'tr', depth: 5, maxTimeSeconds: 600,
  latitude: '', longitude: '', zoom: 15, radius: 10000,
  fastMode: false, email: false, extraReviews: false,
  presetId: 'custom',
};

const statusLabel: Record<MapsJobStatus, string> = {
  queued: 'Sırada', running: 'Taranıyor', completed: 'Tamamlandı',
  failed: 'Başarısız', cancelled: 'İptal edildi',
};

const activeStatuses = new Set<MapsJobStatus>(['queued', 'running']);
const resultsPageSize = 50;

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value));
}

function placeEmails(place: MapsPlace): string[] {
  const value = place.emails ?? place.raw.emails;
  if (Array.isArray(value)) return value.map(String).map((email) => email.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value.split(/[,;]/).map((email) => email.trim()).filter(Boolean);
}

function websiteLabel(value: string): string {
  try { return new URL(value).hostname.replace(/^www\./, ''); }
  catch { return value; }
}

export function MapsPage() {
  const [status, setStatus] = useState<MapsStatus | null>(null);
  const [jobs, setJobs] = useState<MapsJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<MapsResults | null>(null);
  const [resultsOffset, setResultsOffset] = useState(0);
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

  const loadResults = useCallback(async (jobId: string, offset: number, quiet = false) => {
    if (!quiet) setResultsLoading(true);
    try {
      setResults(await api<MapsResults>(`/v1/maps/jobs/${jobId}/results?limit=${resultsPageSize}&offset=${offset}`));
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
    void loadResults(selectedJob.id, resultsOffset);
  }, [selectedJob?.id, selectedJob?.status, resultsOffset, loadResults]);
  useEffect(() => {
    if (!hasActiveJobs) return undefined;
    const timer = window.setInterval(() => { void loadJobs(true); }, 5000);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs, loadJobs]);

  const handlePresetChange = (presetId: string) => {
    const preset = locationPresets.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.id === 'custom') {
      setForm((current) => ({ ...current, presetId: 'custom' }));
    } else {
      setForm((current) => ({
        ...current,
        presetId: preset.id,
        latitude: preset.lat,
        longitude: preset.lng,
        zoom: preset.zoom,
        language: preset.lang,
      }));
    }
  };

  const handleCoordPaste = (value: string) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^([-+]?[0-9]*[.,]?[0-9]+)[,\s/|]+([-+]?[0-9]*[.,]?[0-9]+)$/);
    if (match && match[1] && match[2]) {
      const lat = match[1].replace(',', '.');
      const lng = match[2].replace(',', '.');
      setForm((current) => ({ ...current, presetId: 'custom', latitude: lat, longitude: lng }));
      return true;
    }
    return false;
  };

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError(''); setMessage('');
    const keywords = form.keywords.split(/\r?\n/).map((keyword) => keyword.trim()).filter(Boolean);

    const rawLat = form.latitude.trim().replace(',', '.');
    const rawLon = form.longitude.trim().replace(',', '.');
    const hasLat = rawLat !== '';
    const hasLon = rawLon !== '';

    if (hasLat !== hasLon) {
      setError('Enlem ve boylam birlikte girilmelidir (veya ikisi de boş bırakılmalıdır).');
      setSubmitting(false);
      return;
    }

    if (form.fastMode && (!hasLat || !hasLon)) {
      setError('Hızlı mod için enlem ve boylam zorunludur.');
      setSubmitting(false);
      return;
    }

    let latNum: number | undefined;
    let lonNum: number | undefined;

    if (hasLat) {
      latNum = Number(rawLat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        setError('Geçersiz enlem değeri. -90 ile 90 arasında bir sayı girin.');
        setSubmitting(false);
        return;
      }
    }

    if (hasLon) {
      lonNum = Number(rawLon);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        setError('Geçersiz boylam değeri. -180 ile 180 arasında bir sayı girin.');
        setSubmitting(false);
        return;
      }
    }

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
          ...(latNum !== undefined ? { latitude: latNum } : {}),
          ...(lonNum !== undefined ? { longitude: lonNum } : {}),
        }),
      });
      setForm((current) => ({ ...initialForm, language: current.language, presetId: current.presetId }));
      setResultsOffset(0);
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
      setResultsOffset(0);
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
        <label>Arama kelimeleri <small>Her satıra bir sorgu</small><textarea required rows={6} placeholder={'Berlin cafe\nZahnarzt München\nMünchen software agentur\nKadıköy kahve dükkanı'} value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} /></label>
        <p className="field-hint" style={{ marginTop: '-4px', marginBottom: '12px', color: '#53665b' }}>
          💡 Belirli bir ülkede arama yapmak için aşağıdaki konum şablonunu (örn. Almanya) seçebilir veya doğrudan enlem/boylam girebilirsiniz.
        </p>
        <div className="form-grid"><label>Dil<select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>
          <option value="de">Almanca (de)</option>
          <option value="en">İngilizce (en)</option>
          <option value="tr">Türkçe (tr)</option>
          <option value="fr">Fransızca (fr)</option>
          <option value="es">İspanyolca (es)</option>
          <option value="it">İtalyanca (it)</option>
          <option value="nl">Felemenkçe (nl)</option>
          <option value="ru">Rusça (ru)</option>
          <option value="ar">Arapça (ar)</option>
        </select></label><label>Tarama derinliği<input type="number" min="1" max="100" value={form.depth} onChange={(event) => setForm({ ...form, depth: Number(event.target.value) })} /></label></div>
        <div className="form-grid"><label>Süre sınırı (sn)<input type="number" min="60" max="7200" value={form.maxTimeSeconds} onChange={(event) => setForm({ ...form, maxTimeSeconds: Number(event.target.value) })} /></label><label>Yakınlık yarıçapı (m)<input type="number" min="1" max="100000" value={form.radius} onChange={(event) => setForm({ ...form, radius: Number(event.target.value) })} /></label></div>
        <details className="maps-advanced" open><summary>Hedef Ülke / Konum ve gelişmiş seçenekler</summary>
          <label>Hedef Ülke / Şehir Şablonu<select value={form.presetId} onChange={(event) => handlePresetChange(event.target.value)}>
            {locationPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </select></label>
          <div className="form-grid">
            <label>Enlem (Latitude) <small>Virgüllü koordinat yapıştırılabilir</small><input type="text" placeholder="51.165691 (Almanya)" value={form.latitude} onChange={(event) => { if (!handleCoordPaste(event.target.value)) { setForm({ ...form, presetId: 'custom', latitude: event.target.value }); } }} /></label>
            <label>Boylam (Longitude)<input type="text" placeholder="10.451526 (Almanya)" value={form.longitude} onChange={(event) => { if (!handleCoordPaste(event.target.value)) { setForm({ ...form, presetId: 'custom', longitude: event.target.value }); } }} /></label>
          </div>
          <label>Harita yakınlaştırma (Zoom) <small>{form.zoom <= 7 ? 'Ülke geneli' : form.zoom <= 13 ? 'Şehir geneli' : 'Cadde / Mahalle'}</small><input type="number" min="1" max="21" value={form.zoom} onChange={(event) => setForm({ ...form, zoom: Number(event.target.value) })} /></label>
          <p className="field-hint" style={{ color: '#53665b' }}>💡 Zoom rehberi: 4–6 Ülke geneli (örn. Almanya için 6), 10–13 Şehir (örn. Berlin için 12), 14–16 Mahalle/Cadde.</p>
          <div className="check-grid"><label><input type="checkbox" checked={form.fastMode} onChange={(event) => setForm({ ...form, fastMode: event.target.checked })} /> Hızlı mod</label><label><input type="checkbox" checked={form.email} onChange={(event) => setForm({ ...form, email: event.target.checked })} /> E-posta ara</label><label><input type="checkbox" checked={form.extraReviews} onChange={(event) => setForm({ ...form, extraReviews: event.target.checked })} /> Ek yorumlar</label></div>
          {form.fastMode && <p className="field-hint">Hızlı mod için enlem ve boylam zorunludur.</p>}
        </details>
        <button className="primary" disabled={submitting || !status?.connected}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}{submitting ? 'Sıraya alınıyor…' : 'Taramayı başlat'}</button>
      </form>

      <section className="maps-jobs-card">
        <div className="maps-card-head"><div><span className="eyebrow">İŞ GEÇMİŞİ</span><h2>Taramalar</h2></div><span className="job-count">{jobs.length}</span></div>
        {loading ? <div className="maps-empty"><LoaderCircle className="spin" /><p>İşler yükleniyor…</p></div> : jobs.length === 0 ? <div className="maps-empty"><Search /><strong>Henüz tarama yok</strong><p>İlk sorgunu soldaki formdan başlat.</p></div> : <div className="maps-job-list">{jobs.map((job) => <button type="button" key={job.id} className={`maps-job-row ${selectedId === job.id ? 'selected' : ''}`} onClick={() => { setResultsOffset(0); setSelectedId(job.id); }}><span className={`job-state ${job.status}`}>{activeStatuses.has(job.status) ? <LoaderCircle className="spin" /> : job.status === 'completed' ? <CheckCircle2 /> : <CircleAlert />}</span><span className="job-main"><strong>{job.params.keywords?.join(', ') || 'Adsız tarama'}</strong><small><Clock3 /> {formatDate(job.created_at)} · {job.result_count} sonuç</small></span><span className={`job-status ${job.status}`}>{statusLabel[job.status]}</span></button>)}</div>}
      </section>
    </section>

    {selectedJob && <section className="maps-results-card">
      <div className="maps-results-head"><div><span className="eyebrow">SEÇİLİ TARAMA</span><h2>{selectedJob.params.keywords?.join(', ') || 'Tarama sonuçları'}</h2><p>{statusLabel[selectedJob.status]} · {selectedJob.result_count} işletme · {formatDate(selectedJob.created_at)}</p></div><div>{selectedJob.status === 'completed' && <button className="secondary" onClick={() => download(selectedJob)}><Download size={16} /> CSV indir</button>}<button className="icon-button danger" onClick={() => deleteJob(selectedJob)} aria-label="Tarama işini sil"><Trash2 /></button></div></div>
      {selectedJob.error_message && <div className="form-error maps-alert"><CircleAlert size={16} /> {selectedJob.error_message}</div>}
      {activeStatuses.has(selectedJob.status) && <div className="maps-progress"><LoaderCircle className="spin" /><div><strong>Tarama devam ediyor</strong><p>Sonuçlar tamamlandığında burada görünecek.</p></div></div>}
      {selectedJob.status === 'completed' && (resultsLoading ? <div className="maps-empty"><LoaderCircle className="spin" /><p>Sonuçlar yükleniyor…</p></div> : results && results.items.length > 0 ? <><div className="responsive-table"><table><thead><tr><th>İşletme</th><th>Kategori</th><th>Adres</th><th>Telefon</th><th>E-posta</th><th>Website</th><th>Puan</th></tr></thead><tbody>{results.items.map((place) => { const emails = placeEmails(place); return <tr key={place.id}><td><strong>{place.title ?? 'İsimsiz işletme'}</strong></td><td>{place.category ?? '—'}</td><td className="maps-address" title={place.address ?? undefined}>{place.address ?? '—'}</td><td>{place.phone ? <a className="contact-link" href={`tel:${place.phone}`}>{place.phone}</a> : '—'}</td><td>{emails.length > 0 ? <span className="email-list">{emails.map((email) => <a key={email} className="contact-link" href={`mailto:${email}`}>{email}</a>)}</span> : '—'}</td><td>{place.website ? <a className="contact-link website-link" href={place.website} target="_blank" rel="noreferrer">{websiteLabel(place.website)} <ExternalLink /></a> : '—'}</td><td>{place.review_rating ?? '—'}{place.review_count != null && <small className="review-count"> ({place.review_count})</small>}</td></tr>; })}</tbody></table></div><div className="maps-pagination"><span>{results.offset + 1}–{Math.min(results.offset + results.items.length, results.total)} / {results.total} işletme</span><div><button className="secondary" disabled={results.offset === 0} onClick={() => setResultsOffset(Math.max(0, resultsOffset - resultsPageSize))}><ChevronLeft /> Önceki</button><button className="secondary" disabled={results.offset + results.items.length >= results.total} onClick={() => setResultsOffset(resultsOffset + resultsPageSize)}>Sonraki <ChevronRight /></button></div></div></> : <div className="maps-empty"><Search /><strong>Sonuç bulunamadı</strong><p>Bu tarama tamamlandı ancak kayıt üretmedi.</p></div>)}
    </section>}
  </div>;
}
