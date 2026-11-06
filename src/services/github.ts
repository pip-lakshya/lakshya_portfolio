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

export type GitHubDirectoryData = {
  repositories: PublicRepository[]
  source: 'live' | 'cache' | 'static'
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
}

const staticRepositories = inventory.repositories as PublicRepository[]
const allowed = new Set(staticRepositories.map((repo) => repo.name.toLowerCase()))
const cacheKey = 'lakshya.github.repository-directory.v2'
const cacheDuration = 6 * 60 * 60 * 1000

function readCache(): (GitHubDirectoryData & { fetchedAt: number }) | null {
  try {
    const value = localStorage.getItem(cacheKey)
    if (!value) return null
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed.repositories) || typeof parsed.fetchedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(data: GitHubDirectoryData & { fetchedAt: number }) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data))
  } catch {
    // Storage is optional. The local inventory still renders without it.
  }
}

function staticResult(error: string | null = null): GitHubDirectoryData {
  return { repositories: staticRepositories, source: 'static', error, fetchedAt: null }
}

export async function loadGitHubDirectory(force = false): Promise<GitHubDirectoryData> {
  const cached = readCache()
  if (!force && cached && Date.now() - cached.fetchedAt < cacheDuration) {
    return { ...cached, source: 'cache' }
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(
      'https://api.github.com/users/pip-lakshya/repos?per_page=100&type=public&sort=updated',
      { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal },
    )
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) throw new Error('GitHub repository metadata is temporarily rate limited.')
      throw new Error('GitHub repository metadata returned ' + response.status + '.')
    }

    const apiRepositories = await response.json() as ApiRepository[]
    const liveByName = new Map(
      apiRepositories
        .filter((repo) => !repo.private && allowed.has(repo.name.toLowerCase()))
        .map((repo) => [repo.name.toLowerCase(), repo]),
    )
    const repositories = staticRepositories.map((fallback) => {
      const live = liveByName.get(fallback.name.toLowerCase())
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
    const result: GitHubDirectoryData & { fetchedAt: number } = {
      repositories,
      source: 'live',
      error: null,
      fetchedAt: Date.now(),
    }
    writeCache(result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub metadata is unavailable.'
    if (cached) return { ...cached, source: 'cache', error: message }
    return staticResult(message)
  } finally {
    window.clearTimeout(timeout)
  }
}
