import { ExternalLink } from 'lucide-react';

const ASOBEAST_URL = 'https://apps.triworkster.com:8443';

export function AsoBeastPanelPage() {
  return <section className="asobeast-panel">
    <header>
      <div>
        <span className="eyebrow">TAM ASO ÇALIŞMA ALANI</span>
        <strong>AsoBeast</strong>
      </div>
      <a className="secondary compact" href={ASOBEAST_URL} target="_blank" rel="noreferrer">
        Yeni sekmede aç <ExternalLink size={15} />
      </a>
    </header>
    <iframe
      src={ASOBEAST_URL}
      title="AsoBeast yönetim paneli"
      allow="clipboard-read; clipboard-write"
    />
  </section>;
}
