/**
 * GitHubRankingPageContent - GitHub 仓库排行榜
 * 按 star 数展示 GitHub 最受欢迎的仓库，支持搜索和语言筛选
 */
'use client'

import { ExternalLink, GitFork, Github, Search, Star, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface GitHubRepo {
  id: number
  rank: number
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  html_url: string
  topics: string[]
  updated_at: string
  open_issues_count: number
  size: number
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
}

function formatStars(n: number): string {
  if (n >= 1000)
    return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function RepoCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="h-8 w-8 shrink-0 rounded" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

interface RepoCardProps {
  repo: GitHubRepo
}

function RepoCard({ repo }: RepoCardProps) {
  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? '#8b949e') : null

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      {/* Rank badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
        {repo.rank}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Title + external link */}
        <div className="flex items-center gap-2">
          <Github size={16} className="shrink-0 text-muted-foreground" />
          <span className="truncate font-semibold text-foreground group-hover:text-primary">
            {repo.full_name}
          </span>
          <ExternalLink size={14} className="ml-auto shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>

        {/* Description */}
        {repo.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{repo.description}</p>
        )}

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 5).map(t => (
              <Badge key={t} variant="secondary" className="px-1.5 py-0 text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {/* Stars */}
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {formatStars(repo.stargazers_count)}
          </span>

          {/* Forks */}
          <span className="flex items-center gap-1">
            <GitFork size={13} />
            {formatStars(repo.forks_count)}
          </span>

          {/* Language */}
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: langColor ?? undefined }}
              />
              {repo.language}
            </span>
          )}

          {/* Last updated */}
          <span className="ml-auto">Updated {formatDate(repo.updated_at)}</span>
        </div>
      </div>
    </a>
  )
}

const GITHUB_SEARCH_URL
  = 'https://api.github.com/search/repositories?q=stars:%3E1000&sort=stars&order=desc&per_page=100'

async function fetchTopRepos(): Promise<GitHubRepo[]> {
  const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const results: GitHubRepo[] = []

  for (const page of pages) {
    try {
      const res = await fetch(`${GITHUB_SEARCH_URL}&page=${page}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        next: { revalidate: 3600 },
      })
      if (!res.ok)
        break
      const json = await res.json()
      const items = (json.items || []) as Omit<GitHubRepo, 'rank'>[]
      results.push(...items.map((item, i) => ({ ...item, rank: results.length + i + 1 })))
      if (results.length >= 1000)
        break
    }
    catch {
      break
    }
  }

  return results
}

export function GitHubRankingPageContent() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(50)

  const loadRepos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchTopRepos()
      setRepos(data)
    }
    catch {
      setError('Failed to fetch repositories. GitHub API rate limit may have been reached.')
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])

  const languages = useMemo(() => {
    const counts = new Map<string, number>()
    repos.forEach((r) => {
      if (r.language)
        counts.set(r.language, (counts.get(r.language) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([lang]) => lang)
  }, [repos])

  const filtered = useMemo(() => {
    let list = repos
    if (selectedLang)
      list = list.filter(r => r.language === selectedLang)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        r =>
          r.full_name.toLowerCase().includes(q)
          || (r.description ?? '').toLowerCase().includes(q)
          || r.topics.some(topic => topic.includes(q)),
      )
    }
    return list
  }, [repos, search, selectedLang])

  const visible = filtered.slice(0, visibleCount)

  const handleClearSearch = () => {
    setSearch('')
    setSelectedLang(null)
  }

  const hasFilter = search.trim() || selectedLang

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Github size={28} className="text-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">GitHub Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Top repositories ranked by stars
          </p>
        </div>
        {!isLoading && (
          <span className="ml-auto rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {repos.length.toLocaleString()}
            {' '}
            repos
          </span>
        )}
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Language filter chips */}
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(prev => prev === lang ? null : lang)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedLang === lang
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: LANGUAGE_COLORS[lang] ?? '#8b949e' }}
                />
                {lang}
              </button>
            ))}
          </div>
        )}

        {/* Active filter summary */}
        {hasFilter && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing
              {' '}
              {filtered.length}
              {' '}
              result
              {filtered.length !== 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClearSearch}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-xs" onClick={loadRepos}>
            Retry
          </Button>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <RepoCardSkeleton key={i} />)
          : visible.map(repo => <RepoCard key={repo.id} repo={repo} />)}
      </div>

      {/* Load more */}
      {!isLoading && filtered.length > visibleCount && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount(prev => prev + 50)}
          >
            Load more (
            {filtered.length - visibleCount}
            {' '}
            remaining)
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Github size={40} className="opacity-30" />
          <p>No repositories found</p>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
