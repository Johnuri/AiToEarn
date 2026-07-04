import type { Metadata } from 'next'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { GitHubRankingPageContent } from './GitHubRankingPageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  return {
    title: 'GitHub Ranking - Top Repositories by Stars',
    description: 'Browse the top GitHub repositories ranked by star count. Filter by language and search across thousands of popular open source projects.',
    keywords: 'github ranking, top repositories, open source, stars, popular repos',
  }
}

export default function GitHubRankingPage() {
  return <GitHubRankingPageContent />
}
