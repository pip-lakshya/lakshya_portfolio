import { useEffect, useMemo, useState } from 'react'
import repoInventory from '../../content/github-repositories.json'
import { loadGitHubDirectory, type GitHubDirectoryData, type PublicRepository } from '../services/github'
import { ProjectActivityHeatmap } from './ProjectActivityHeatmap'

const fallbackRepositories = repoInventory.repositories as PublicRepository[]
const updatedDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))

export function GitHubExplorer() {
  const [data, setData] = useState<GitHubDirectoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')

  useEffect(() => {
    let alive = true
    loadGitHubDirectory().then((next) => {
      if (!alive) return
      setData(next)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const allRepositories = data?.repositories ?? fallbackRepositories
  const languages = useMemo(
    () => [...new Set(allRepositories.map((repo) => repo.language).filter((item): item is string => Boolean(item)))].sort(),
    [allRepositories],
  )
  const repositories = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allRepositories
      .filter((repo) => !needle || repo.name.toLowerCase().includes(needle))
      .filter((repo) => language === 'all' || repo.language === language)
      .toSorted((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        return (b.updatedAt ? Date.parse(b.updatedAt) : 0) - (a.updatedAt ? Date.parse(a.updatedAt) : 0)
      })
  }, [allRepositories, language, search, sort])

  return <section className="portfolio-github section-pad" id="github">
    <div className="section-heading"><span className="section-kicker">03 / ON GITHUB</span><span className="heading-rule" /><span className="github-mark" aria-hidden="true">GH</span></div>
    <div className="github-intro"><div><span className="section-kicker">A WORKING NOTEBOOK</span><h2>Built in the<br /><em>open.</em></h2></div><div className="github-intro-note"><p>Selected repositories from my developer practice — tools, experiments, and products in progress.</p><a href="https://github.com/pip-lakshya" target="_blank" rel="noreferrer">VISIT GITHUB PROFILE <span aria-hidden="true">↗</span></a></div></div>

    <ProjectActivityHeatmap />

    <div className="repository-directory" id="selected-repositories">
      <div className="directory-heading"><div><span className="section-kicker">THE CURATED DIRECTORY</span><h3>All selected repositories <span>({fallbackRepositories.length})</span></h3></div><a href="https://github.com/pip-lakshya" target="_blank" rel="noreferrer">GITHUB PROFILE ↗</a></div>
      {loading && <p className="github-status" role="status">Loading verified public repository metadata. The curated local list is already available.</p>}
      {!loading && data?.source === 'static' && <p className="github-status github-status--notice" role="status">Showing the curated local inventory. Programming language and update metadata were not available, so those fields are omitted.</p>}
      {!loading && data?.error && data.source !== 'static' && <p className="github-status github-status--notice" role="status">Showing cached repository details. {data.error}</p>}
      <div className="repository-filters">
        <label><span>SEARCH BY NAME</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Repository name" /></label>
        <label><span>LANGUAGE</span><select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={!languages.length}><option value="all">All languages</option>{languages.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>SORT</span><select value={sort} onChange={(event) => setSort(event.target.value as 'updated' | 'name')}><option value="updated">Last updated</option><option value="name">Name A–Z</option></select></label>
        <button type="button" onClick={() => { setSearch(''); setLanguage('all'); setSort('updated') }}>CLEAR FILTERS</button>
      </div>
      {repositories.length === 0 && <p className="directory-empty" role="status">No selected repositories match this name.</p>}
      <div className="repository-directory-grid">{repositories.map((repo) => <RepositoryCard repo={repo} key={repo.name} />)}</div>
    </div>
  </section>
}

function RepositoryCard({ repo }: { repo: PublicRepository }) {
  return <article className="repository-card">
    <div className="repository-top"><span className="repository-index">SELECTED PUBLIC REPOSITORY</span><span className="repository-brackets" aria-hidden="true">{ }</span></div>
    <h4>{repo.name}</h4>
    {repo.description && <p>{repo.description}</p>}
    <div className="repository-tags">{repo.language && <span>{repo.language}</span>}</div>
    <div className="repository-meta">
      {repo.updatedAt && <span>UPDATED {updatedDate(repo.updatedAt)}</span>}
      {repo.stars !== null && <span>★ {repo.stars}</span>}
      {repo.forks !== null && <span>⑂ {repo.forks}</span>}
    </div>
    <a className="repository-link" href={repo.url} target="_blank" rel="noreferrer">OPEN REPOSITORY <span aria-hidden="true">↗</span></a>
  </article>
}
