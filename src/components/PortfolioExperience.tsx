import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import profile from '../../content/profile.json'
import projectsData from '../../content/projects.json'
import experienceData from '../../content/experience.json'
import achievementsData from '../../content/achievements.json'
import educationData from '../../content/education.json'
import skillsData from '../../content/skills.json'
import socialData from '../../content/social-links.json'
import { GitHubExplorer } from './GitHubExplorer'
import { CertificateGallery } from './CertificateGallery'
import { LinkedInActivity } from './LinkedInActivity'
import { IdentityCursor } from './IdentityCursor'
import { PortraitGallery } from './PortraitGallery'

type Link = { label: string; url: string; verificationRequired?: boolean }
const links = socialData.links as Link[]
const social = (label: string) => links.find((link) => link.label === label)
const projectSet = projectsData.projects
const experience = experienceData.entries
const recognitionHighlights = achievementsData.publicHighlights
const education = educationData.items
const skills = skillsData.groups

gsap.registerPlugin(ScrollTrigger)

const sections = [
  ['home', 'Home'], ['about', 'About'], ['work', 'Work'], ['github', 'GitHub'], ['experience', 'Experience'],
  ['recognition', 'Recognition'], ['certificates', 'Certificates'], ['arsenal', 'Technology'], ['education', 'Education'], ['contact', 'Contact'],
] as const

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">{children}<span aria-hidden="true"> ↗</span></a>
}

export function PortfolioExperience({ onReplay }: { onReplay: () => void }) {
  const [active, setActive] = useState('home')
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !rootRef.current) return
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.project-feature, .repository-card, .experience-item, .achievement-item, .skill-group, .education-card').forEach((element) => {
        gsap.fromTo(element, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } })
      })
    }, rootRef)
    return () => context.revert()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(visible.target.id)
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .1, .25, .5] })
    sections.forEach(([id]) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return <div className="portfolio-shell" ref={rootRef}>
    <IdentityCursor />
    <nav className="portfolio-nav" aria-label="Main navigation">
      <a className="nav-monogram" href="#home" aria-label="Lakshya Bhandari, home">LB<span>.</span></a>
      <div className="nav-links">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}</div>
      <button className="nav-replay" type="button" onClick={onReplay} aria-label="Replay the cinematic introduction">↻ <span>INTRO</span></button>
      <a className="nav-contact" href="#contact">Let’s talk <span>↗</span></a>
    </nav>

    <section className="portfolio-hero" id="home">
      <div className="hero-copy">
        <span className="section-kicker"><i /> {profile.location}</span>
        <p className="hero-overline">{profile.professionalIdentity.join(' · ').toUpperCase()}</p>
        <h1>Ideas into<br /><em>living systems.</em></h1>
        <p className="hero-intro">I’m <strong>{profile.name}</strong> — a developer and technology enthusiast exploring the space between data, intelligent products, and thoughtful design.</p>
        <p className="hero-manifesto">Building useful things. Learning in public. Staying curious about what comes next.</p>
        <div className="hero-links">{['GitHub', 'LinkedIn', 'Email'].map((label) => { const link = social(label); return link ? <External key={label} href={link.url}>{label}</External> : null })}</div>
        <a className="hero-scroll" href="#about"><span>SCROLL TO EXPLORE</span><i /></a>
      </div>
      <figure className="hero-portrait"><img src="/images/yellow_blazer.png" alt="Lakshya Bhandari in a yellow blazer" fetchPriority="high" /><figcaption><span>LAKSHYA BHANDARI</span><span>JAIPUR · INDIA</span></figcaption><div className="portrait-index">01 / PERSONAL ARCHIVE</div></figure>
      <div className="hero-side-note">A DIGITAL PRACTICE<br />IN CONSTANT MOTION</div>
    </section>

    <section className="portfolio-about section-pad" id="about">
      <div className="section-heading"><span className="section-kicker">01 / A LITTLE CONTEXT</span><span className="heading-rule" /></div>
      <div className="about-grid">
        <PortraitGallery />
        <div className="about-copy"><h2>Technology is most exciting when it <em>helps someone.</em></h2><p>I’m pursuing a B.Tech in Computer Science Engineering (Data Science) at SKIT Jaipur, with a growing interest in data engineering, AI/ML, full-stack development, and emerging technology.</p><p>I enjoy turning open-ended problems into practical products — from software and connected devices to ideas shaped in hackathons. Entrepreneurship and student leadership have taught me to build with people, not just for a screen.</p><div className="about-note"><span>BASED IN</span><strong>{profile.location}</strong><span>STUDYING</span><strong>{education[0]?.degree ?? 'Education details to be confirmed'}</strong></div></div>
      </div>
    </section>

    <section className="portfolio-work section-pad" id="work">
      <div className="section-heading"><span className="section-kicker">02 / SELECTED WORK</span><span className="heading-rule" /><span className="section-count">({String(projectSet.length).padStart(2,'0')})</span></div>
      <div className="work-intro"><h2>Ideas, given<br /><em>somewhere to go.</em></h2><p>A selection of projects exploring safety, identity, and more human-centered technology.</p></div>
      <div className="project-list">{projectSet.map((project, index) => <article className={`project-feature project-feature--${index+1}`} key={project.id}>
        <div className="project-visual"><span className="project-number">0{index+1}</span><div className="project-orbit" aria-hidden="true"><i /><i /><i /></div><span className="project-category">{project.technologies.slice(0,2).join(' / ')}</span></div>
        <div className="project-copy"><span className="section-kicker">{project.technologies.slice(0, 2).join(' · ')}</span><h3>{project.name}</h3>{project.description && <p>{project.description}</p>}<div className="project-tech">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div><div className="project-links">{project.links.github && <External href={project.links.github}>GitHub</External>}{project.links.liveDemo && <External href={project.links.liveDemo}>Visit project</External>}</div></div>
      </article>)}</div>
      <p className="content-caveat">Project descriptions and technologies follow the available project summaries.</p>
    </section>

    <GitHubExplorer />

    <section className="portfolio-experience section-pad" id="experience">
      <div className="section-heading"><span className="section-kicker">04 / EXPERIENCE & LEADERSHIP</span><span className="heading-rule" /></div>
      <div className="experience-layout"><h2>Learning to lead<br /><em>by doing.</em></h2><div className="experience-list">{experience.map((item, index) => (
        <article className="experience-item" key={item.organization}><span className="experience-index">0{index + 1}</span><div><h3>{item.organization}</h3>{item.publicRoles?.map((role) => <div className="role-line" key={role}><strong>{role}</strong></div>)}</div><span className="experience-arrow">↗</span></article>
      ))}</div></div>
    </section>

    <section className="portfolio-recognition section-pad" id="recognition">
      <div className="section-heading"><span className="section-kicker">05 / RECOGNITION</span><span className="heading-rule" /></div><div className="recognition-heading"><h2>Recognition<br /><em>& milestones.</em></h2><p>Milestones shown through the work and communities already named in the portfolio.</p></div>
      <div className="achievement-grid">{recognitionHighlights.map((highlight) => <article className="achievement-item achievement-item--highlight" key={highlight.id}><span className="achievement-mark" aria-hidden="true">✳</span><span className="achievement-no">{highlight.label}</span><h3>{highlight.title}</h3><ul>{highlight.items.map((item) => <li key={item.label}><a href={item.href}>{item.label}<span aria-hidden="true">↗</span></a></li>)}</ul></article>)}
      <p className="recognition-context">Awards, rankings, and scores are omitted until their original source records are available.</p></div>
    </section>

    <CertificateGallery />

    <section className="portfolio-skills section-pad" id="arsenal">
      <div className="section-heading"><span className="section-kicker">07 / TECHNOLOGY INDEX</span><span className="heading-rule" /></div><div className="skills-layout"><h2>Tools for<br /><em>what’s next.</em></h2><div className="skill-groups">{skills.map((group) => <div className="skill-group" key={group.name}><h3>{group.name}</h3><div>{group.items.map((skill) => <span key={skill}>{skill}</span>)}</div></div>)}</div></div><p className="content-caveat">Technologies shown here are drawn from the project descriptions; no proficiency ranking is implied.</p>
    </section>

    <section className="portfolio-education section-pad" id="education">
      <div className="section-heading"><span className="section-kicker">08 / EDUCATION</span><span className="heading-rule" /></div><div className="education-layout"><h2>Grounded in<br /><em>the fundamentals.</em></h2>{education.map((item) => <article className="education-card" key={item.institution}><span>{item.startYear} — {item.expectedEndYear} / EXPECTED</span><h3>{item.degree}</h3><p>{item.institution}</p>{item.cgpa && !item.cgpa.verificationRequired && <p className="education-score">CGPA <strong>{item.cgpa.value}</strong><small>through semester {item.cgpa.throughSemester}</small></p>}</article>)}</div>
    </section>

    <footer className="portfolio-contact section-pad" id="contact">
      <div className="section-heading"><span className="section-kicker">09 / OPEN CHANNEL</span><span className="heading-rule" /></div><div className="contact-main"><p className="section-kicker">GOOD WORK STARTS WITH A CONVERSATION</p><h2>Have a thoughtful<br /><em>problem in mind?</em></h2><a className="contact-email" href={profile.email ? `mailto:${profile.email}` : '#contact'}>{profile.email ?? 'Get in touch'} <span>↗</span></a></div><div className="contact-footer"><span>{profile.name} · {profile.location}</span><div>{['GitHub','LinkedIn'].map((label) => { const link=social(label); return link ? <External href={link.url} key={label}>{label}</External> : null })}</div><button type="button" onClick={onReplay}>REPLAY INTRO ↻</button><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
    <LinkedInActivity />
  </div>
}
