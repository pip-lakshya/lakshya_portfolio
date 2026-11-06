import { useEffect, useState } from 'react'
import certificationData from '../../content/certifications.json'

type Certificate = typeof certificationData.items[number]

export function CertificateGallery() {
  const [selected, setSelected] = useState<Certificate | null>(null)
  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  return <>
    <section className="portfolio-certificates section-pad" id="certificates">
      <div className="section-heading"><span className="section-kicker">06 / CERTIFICATES</span><span className="heading-rule" /></div>
      <div className="certificate-heading"><h2>Learning, in<br /><em>practice.</em></h2><p>Six certificate spaces are reserved for the original NPTEL records. Uploads and verified details are needed before any course results are shown.</p></div>
      <div className="certificate-grid">{certificationData.items.map((certificate, index) => <article className="certificate-card" key={certificate.id}>
        {certificate.image ? <button className="certificate-preview" type="button" onClick={() => setSelected(certificate)} aria-label={`View ${certificate.title ?? 'certificate'}`}><img src={certificate.image} alt={certificate.title ?? 'NPTEL certificate'} loading="lazy" /><span>VIEW CERTIFICATE ↗</span></button> : <div className="certificate-placeholder"><span>NPTEL / 0{index + 1}</span><strong>Certificate details<br />pending upload</strong><small>ORIGINAL CERTIFICATE IMAGE REQUIRED</small></div>}
        <div className="certificate-caption"><span>NPTEL · CERTIFICATE 0{index + 1}</span>{certificate.title && <h3>{certificate.title}</h3>}{certificate.score && <p>{certificate.score}</p>}</div>
      </article>)}</div>
    </section>
    {selected?.image && <div className="certificate-lightbox" role="dialog" aria-modal="true" aria-label={selected.title ?? 'Certificate preview'} onClick={() => setSelected(null)}><button type="button" onClick={() => setSelected(null)} aria-label="Close certificate">×</button><img src={selected.image} alt={selected.title ?? 'NPTEL certificate'} onClick={(event) => event.stopPropagation()} /></div>}
  </>
}
