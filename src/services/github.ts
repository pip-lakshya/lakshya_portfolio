import inventory from '../../content/github-repositories.json'

export type PublicRepository = {
  name: string
  description: string | null
  language: string | null
  updatedAt: string | null
  stars: number | null
  forks: number | null
  url: string
}

export type CommitActivity = {
  date: string
  repository: string
  language: string | null
  message: string | null
  url: string
}

export type GitHubPortfolioData = {
  repositories: PublicRepository[]
  activity: CommitActivity[]
  source: 'live' | 'cache' | 'static'
  partial: boolean
  error: string | null
  fetchedAt: number | null
}

type ApiRepository = {
  name: string
  private: boolean
  html_url: string
  description: string | null
  language: string | null
  updated_at: string
  stargazers_count: number
  forks_count: number
  default_branch: string
}

type ApiCommit = {
  sha: string
  html_url: string
  commit: { author?: { date?: string } | null; committer?: { date?: string } | null; message?: string }
}

const staticRepositories = inventory.repositories as PublicRepository[]
const allowed = new Set(staticRepositories.map((repo) => repo.name.toLowerCase()))
const cacheKey = 'lakshya.github.public-data.v1'
const cacheDuration = 6 * 60 * 60 * 1000
const requestLimit = 20

function readCache(): (GitHubPortfolioData & { fetchedAt: number }) | null {
  try {
    const value = localStorage.getItem(cacheKey)
    if (!value) return null
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed.repositories) || !Array.isArray(parsed.activity) || typeof parsed.fetchedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(data: GitHubPortfolioData & { fetchedAt: number }) {
  try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* storage is optional */ }
}

function nextPage(link: string | null): string | null {
  if (!link) return null
  const entry = link.split(',').find((part) => part.includes('rel="next"'))
  return entry?.match(/<([^>]+)>/)?.[1] ?? null
}

async function request<T>(url: string, count: { value: number }): Promise<{ data: T; link: string | null }> {
  if (count.value >= requestLimit) throw new Error('GitHub public API request budget reached; activity data may be partial.')
  count.value += 1
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    })
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) throw new Error('GitHub API rate limit reached. Showing available public repository data.')
      throw new Error(`GitHub API returned ${response.status}.`)
    }
    return { data: await response.json() as T, link: response.headers.get('Link') }
  } finally {
    window.clearTimeout(timeout)
  }
}

function getStaticData(error: string | null = null): GitHubPortfolioData {
  return { repositories: staticRepositories, activity: [], source: 'static', partial: true, error, fetchedAt: null }
}

export async function loadGitHubPortfolioData(force = false): Promise<GitHubPortfolioData> {
  const cached = readCache()
  if (!force && cached && Date.now() - cached.fetchedAt < cacheDuration) return { ...cached, source: 'cache' }

  const requestCount = { value: 0 }
  try {
    const reposResponse = await request<ApiRepository[]>(
      'https://api.github.com/users/pip-lakshya/repos?per_page=100&type=public&sort=updated',
      requestCount,
    )
    const liveRepos = reposResponse.data.filter((repo) => !repo.private && allowed.has(repo.name.toLowerCase()))
    const byName = new Map(liveRepos.map((repo) => [repo.name.toLowerCase(), repo]))
    const repositories = staticRepositories.map((fallback) => {
      const live = byName.get(fallback.name.toLowerCase())
      if (!live) return fallback
      return {
        name: fallback.name,
        description: live.description || fallback.description,
        language: live.language,
        updatedAt: live.updated_at,
        stars: live.stargazers_count,
        forks: live.forks_count,
        url: live.html_url,
      }
    })

    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const activityRepositories = repositories
      .filter((repo) => byName.has(repo.name.toLowerCase()))
      .sort((a, b) => Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? ''))
      .slice(0, 8)
    const activity: CommitActivity[] = []
    const failures: string[] = []
    let nextRepository = 0
    let paginationLimited = false

    const worker = async () => {
      while (nextRepository < activityRepositories.length) {
        const repo = activityRepositories[nextRepository]
        nextRepository += 1
        if (!byName.has(repo.name.toLowerCase())) continue
        try {
          let url: string | null = `https://api.github.com/repos/pip-lakshya/${encodeURIComponent(repo.name)}/commits?per_page=100&since=${encodeURIComponent(since)}`
          while (url) {
            if (requestCount.value >= requestLimit) { paginationLimited = true; break }
            const page = await request<ApiCommit[]>(url, requestCount)
            for (const commit of page.data) {
              const date = commit.commit.author?.date ?? commit.commit.committer?.date
              if (!date) continue
              activity.push({
                date: date.slice(0, 10),
                repository: repo.name,
                language: repo.language,
                message: commit.commit.message?.split('\n')[0]?.slice(0, 180) ?? null,
                url: commit.html_url,
              })
            }
            url = nextPage(page.link)
            if (url && requestCount.value >= requestLimit) paginationLimited = true
          }
        } catch (error) {
          failures.push(error instanceof Error ? error.message : 'A repository activity request failed.')
        }
      }
    }

    await Promise.all(Array.from({ length: 5 }, worker))
    const partial = paginationLimited || failures.length > 0 || liveRepos.length < staticRepositories.length || activityRepositories.length < liveRepos.length
    const error = failures[0] ?? (paginationLimited ? 'The GitHub API request budget limited older commit pages; displayed activity only includes commits returned.' : null)
    const result: GitHubPortfolioData & { fetchedAt: number } = {
      repositories,
      activity,
      source: 'live',
      partial,
      error,
      fetchedAt: Date.now(),
    }
    writeCache(result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub data could not be loaded.'
    if (cached) return { ...cached, source: 'cache', partial: true, error: message }
    return getStaticData(message)
  }
}
