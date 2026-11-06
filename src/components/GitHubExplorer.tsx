import { useEffect, useMemo, useState } from 'react'
import repoInventory from '../../content/github-repositories.json'
import { loadGitHubPortfolioData, type CommitActivity, type GitHubPortfolioData, type PublicRepository } from '../services/github'

type Day = { date: string; events: CommitActivity[] }

const EMPTY_ACTIVITY: CommitActivity[] = []

const shortDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'))
const updatedDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))

function buildWeeks(activity: CommitActivity[]) {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 363)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  const end = new Date(today)
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()))
  const byDate = new Map<string, CommitActivity[]>()
  for (const event of activity) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event])
  const weeks: Day[][] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const week: Day[] = []
    for (let day = 0; day < 7; day += 1) {
      const date = cursor.toISOString().slice(0, 10)
      week.push({ date, events: byDate.get(date) ?? [] })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function monthPositions(weeks: Day[][]) {
  const positions: { name: string; column: number }[] = []
  weeks.forEach((week, column) => {
    for (const day of week) {
      const date = new Date(day.date + 'T00:00:00Z')
      if (date.getUTCDate() === 1) {
        positions.push({ name: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date), column })
      }
    }
  })
  return positions
}

function Level({ count }: { count: number }) {
  if (!count) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export function GitHubExplorer() {
  const [data, setData] = useState<GitHubPortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')

  const refresh = async (force = false) => {
    setLoading(true)
    const next = await loadGitHubPortfolioData(force)
    setData(next)
    setActiveDate(null)
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    loadGitHubPortfolioData().then((next) => {
      if (!alive) return
      setData(next)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const activity = data?.activity ?? EMPTY_ACTIVITY
  const weeks = useMemo(() => buildWeeks(activity), [activity])
  const months = useMemo(() => monthPositions(weeks), [weeks])
  const activeDays = useMemo(() => activity.reduce<Set<string>>((set, event) => set.add(event.date), new Set()), [activity])
  const dailyEvents = useMemo(() => {
    const map = new Map<string, CommitActivity[]>()
    activity.forEach((event) => map.set(event.date, [...(map.get(event.date) ?? []), event]))
    return map
  }, [activity])

  const languages = useMemo(() => [...new Set((data?.repositories ?? []).map((repo) => repo.language).filter((item): item is string => Boolean(item)))].sort(), [data])
  const repositories = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const result = (data?.repositories ?? repoInventory.repositories as PublicRepository[])
      .filter((repo) => (!needle || repo.name.toLowerCase().includes(needle) || (repo.description ?? '').toLowerCase().includes(needle)))
      .filter((repo) => language === 'all' || repo.language === language)
    return result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      return (b.updatedAt ? Date.parse(b.updatedAt) : 0) - (a.updatedAt ? Date.parse(a.updatedAt) : 0)
    })
  }, [data, language, search, sort])

  const selectedEvents = activeDate ? dailyEvents.get(activeDate) ?? [] : []
  const isCurrentYear = Number(weeks.at(-1)?.[6]?.date.slice(0, 4) ?? 0)

  return <section className="portfolio-github section-pad" id="github">
    <div className="section-heading"><span className="section-kicker">03 / ON GITHUB</span><span className="heading-rule" /><span className="github-mark" aria-hidden="true">GH</span></div>
    <div className="github-intro"><div><span className="section-kicker">A WORKING NOTEBOOK</span><h2>Built in the<br /><em>open.</em></h2></div><div className="github-intro-note"><p>Selected repositories from my developer practice — tools, experiments, and products in progress.</p><a href="https://github.com/pip-lakshya" target="_blank" rel="noreferrer">VISIT GITHUB PROFILE <span aria-hidden="true">↗</span></a></div></div>

    <div className="contribution-panel">
      <div className="contribution-heading"><div><h3>Commit activity</h3><p>Last 12 months · {isCurrentYear}</p></div><a href="https://github.com/pip-lakshya" target="_blank" rel="noreferrer">VIEW PROFILE ↗</a></div>
      {loading && <p className="github-status" role="status">Loading public GitHub data…</p>}
      {!loading && data?.source === 'static' && <div className="github-status github-status--notice" role="status"><p>Live GitHub activity is unavailable. The calendar is left empty rather than showing invented activity; the repository directory below uses the supplied public inventory.</p><button type="button" onClick={() => void refresh(true)}>RETRY</button></div>}
      {!loading && data?.source !== 'static' && <div className="github-status" role="status"><span>{data?.activity.length ? `${activeDays.size} active dates in returned default-branch commits` : 'No default-branch commit records returned for this period.'}</span><span>{data?.source === 'cache' ? 'CACHED PUBLIC API DATA' : 'PUBLIC GITHUB API'}</span></div>}
      {!loading && data?.error && data.source !== 'static' && <p className="github-status github-status--notice">{data.error}</p>}
      {!loading && data?.source !== 'static' && <p className="github-status github-scope-note">Calendar uses actual default-branch commit records from up to eight recently updated public repositories; it is not an account-wide contribution total.</p>}
      {!loading && data?.source !== 'static' && data?.partial && <p className="github-status github-status--notice">The public API returned partial results; cells represent commit records retrieved, not a complete contribution total.</p>}
      <div className="heatmap-scroll" aria-label="Scrollable contribution calendar">
        <div className="heatmap" style={{ '--week-count': weeks.length } as React.CSSProperties}>
          <div className="heatmap-months" aria-hidden="true"><span />{months.map((month) => <span key={month.name + month.column} style={{ gridColumn: month.column + 2 }}>{month.name}</span>)}</div>
          <div className="heatmap-weeks">
            <div className="heatmap-weekdays" aria-hidden="true"><span>Sun</span><span /><span>Tue</span><span /><span>Thu</span><span /><span>Sat</span></div>
            {weeks.map((week) => <div className="heatmap-week" role="group" aria-label={`Week of ${shortDate(week[0].date)}`} key={week[0].date}>
              {week.map((day) => {
                const count = day.events.length
                const outside = day.date > new Date().toISOString().slice(0, 10) || day.date < new Date(Date.now() - 364 * 86400000).toISOString().slice(0, 10)
                const label = count ? `${shortDate(day.date)}: ${count} returned default-branch commit ${count === 1 ? 'record' : 'records'}` : `${shortDate(day.date)}: no returned commit records`
                return <button type="button" key={day.date} className="heatmap-day" data-level={Level({ count })} data-active={activeDate === day.date} disabled={outside || loading || !data || (data.source === 'static' && !count)} aria-label={label} aria-describedby={activeDate === day.date && count ? 'activity-detail' : undefined} onPointerEnter={(event) => event.pointerType !== 'touch' && count && setActiveDate(day.date)} onFocus={() => count && setActiveDate(day.date)} onClick={() => count && setActiveDate((current) => current === day.date ? null : day.date)} />
              })}
            </div>)}
          </div>
        </div>
      </div>
      {!loading && data?.source !== 'static' && <div className="heatmap-legend"><span>LESS</span>{[0,1,2,3,4].map((level) => <i key={level} data-level={level} />)}<span>MORE</span><span className="heatmap-source">Default-branch commit dates, from GitHub’s public API.</span></div>}
      {activeDate && selectedEvents.length > 0 && <div className="activity-detail" id="activity-detail" role="status">
        <div className="activity-detail-heading"><strong>{shortDate(activeDate).toUpperCase()}</strong><span>{selectedEvents.length}{data?.partial ? '+' : ''} returned commit {selectedEvents.length === 1 ? 'record' : 'records'}</span></div>
        <ul>{selectedEvents.map((event, index) => <li key={event.url + index}><a href={event.url} target="_blank" rel="noreferrer"><strong>{event.repository}</strong><span>{event.language ?? 'Language unavailable'}</span><span>{event.message ?? 'Commit activity'}</span><b aria-hidden="true">↗</b></a></li>)}</ul>
      </div>}
    </div>

    <div className="repository-directory">
      <div className="directory-heading"><div><span className="section-kicker">THE PUBLIC REPOSITORIES</span><h3>All public work <span>({repoInventory.repositories.length})</span></h3></div><a href="https://github.com/pip-lakshya" target="_blank" rel="noreferrer">GITHUB PROFILE ↗</a></div>
      <div className="repository-filters">
        <label><span>SEARCH</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or description" /></label>
        <label><span>LANGUAGE</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="all">All languages</option>{languages.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>SORT</span><select value={sort} onChange={(event) => setSort(event.target.value as 'updated' | 'name')}><option value="updated">Recently updated</option><option value="name">Name A–Z</option></select></label>
        <button type="button" onClick={() => { setSearch(''); setLanguage('all'); setSort('updated') }}>CLEAR FILTERS</button>
      </div>
      {!loading && repositories.length === 0 && <p className="directory-empty">No repositories match these filters.</p>}
      <div className="repository-directory-grid">{repositories.map((repo) => <RepositoryCard repo={repo} key={repo.name} />)}</div>
      {loading && <p className="github-status" role="status">Repository details are loading; the supplied public repository list remains available.</p>}
    </div>
  </section>
}

function RepositoryCard({ repo }: { repo: PublicRepository }) {
  return <article className="repository-card">
    <div className="repository-top"><span className="repository-index">PUBLIC REPOSITORY</span><span className="repository-brackets" aria-hidden="true">{ }</span></div>
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
