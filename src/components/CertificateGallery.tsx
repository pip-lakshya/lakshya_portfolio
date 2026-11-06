import { useEffect, useState } from 'react'
import certificationData from '../../content/certifications.json'

type Certificate = typeof certificationData.items[number]
type Category = 'all' | 'additional' | 'nptel'

export function CertificateGallery() {
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [category, setCategory] = useState<Category>('all')
  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const nptel = certificationData.items
  const additional = certificationData.additionalCertificates as Certificate[]
  const visibleNptel = category === 'additional' ? [] : nptel
  const visibleAdditional = category === 'nptel' ? [] : additional

  return <>
    <section className="portfolio-certificates section-pad" id="certificates">
      <div className="section-heading"><span className="section-kicker">06 / CERTIFICATES</span><span className="heading-rule" /></div>
      <div className="certificate-heading"><h2>Learning, in<br /><em>practice.</em></h2><p>Certificate groups remain together here. Original files are needed before course names, grades, or awards can be stated.</p></div>
      <div className="certificate-categories" role="tablist" aria-label="Certificate categories">
        <button type="button" role="tab" aria-selected={category === 'all'} onClick={() => setCategory('all')}>ALL CERTIFICATES <span>{additional.length + nptel.length}</span></button>
        <button type="button" role="tab" aria-selected={category === 'additional'} onClick={() => setCategory('additional')}>ADDITIONAL <span>{additional.length}</span></button>
        <button type="button" role="tab" aria-selected={category === 'nptel'} onClick={() => setCategory('nptel')}>NPTEL <span>{nptel.length}</span></button>
      </div>
      {visibleAdditional.length > 0 && <div className="certificate-group"><h3>Additional certificates</h3><div className="certificate-grid">{visibleAdditional.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} onOpen={setSelected} />)}</div></div>}
      {visibleAdditional.length === 0 && category === 'additional' && <p className="certificate-empty" role="status">No additional certificate records or assets were included in the current project files.</p>}
      {visibleNptel.length > 0 && <div className="certificate-group"><h3>NPTEL certificates</h3><div className="certificate-grid">{visibleNptel.map((certificate, index) => <CertificateCard key={certificate.id} certificate={certificate} index={index} onOpen={setSelected} />)}</div></div>}
    </section>
    {selected?.image && <div className="certificate-lightbox" role="dialog" aria-modal="true" aria-label={selected.title ?? 'Certificate preview'} onClick={() => setSelected(null)}><button type="button" onClick={() => setSelected(null)} aria-label="Close certificate">×</button><img src={selected.image} alt={selected.title ?? 'Certificate'} onClick={(event) => event.stopPropagation()} /></div>}
  </>
}

function CertificateCard({ certificate, index, onOpen }: { certificate: Certificate; index?: number; onOpen: (certificate: Certificate) => void }) {
  const number = index === undefined ? null : String(index + 1).padStart(2, '0')
  return <article className="certificate-card">
    {certificate.image
      ? <button className="certificate-preview" type="button" onClick={() => onOpen(certificate)} aria-label={'View ' + (certificate.title ?? 'certificate')}><img src={certificate.image} alt={certificate.title ?? 'Certificate'} loading="lazy" /><span>VIEW CERTIFICATE ↗</span></button>
      : <div className="certificate-placeholder"><span>{number ? 'NPTEL / ' + number : certificate.provider}</span><strong>Certificate details<br />pending upload</strong><small>ORIGINAL CERTIFICATE IMAGE REQUIRED</small></div>}
    <div className="certificate-caption"><span>{certificate.provider}{number ? ' · CERTIFICATE ' + number : ''}</span>{certificate.title && <h4>{certificate.title}</h4>}{certificate.institution && <p>{certificate.institution}</p>}{certificate.score && <p>{certificate.score}</p>}</div>
  </article>
}
