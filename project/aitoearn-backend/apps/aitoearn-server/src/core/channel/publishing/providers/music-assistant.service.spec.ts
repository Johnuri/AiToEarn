import { PublishStatus } from '@yikart/mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublishingException } from '../publishing.exception'
import { MusicAssistantPubService } from './music-assistant.service'

vi.mock('@yikart/channel-db', () => ({
  mongodbConfigSchema: {},
  OAuth2CredentialRepository: class {},
  PostMediaContainerRepository: class {},
  PostCategory: { POST: 'POST', REELS: 'REELS', STORY: 'STORY' },
  PostMediaStatus: { FAILED: -1, CREATED: 0, IN_PROGRESS: 1, FINISHED: 2 },
  PostSubCategory: { PLAINTEXT: 'PLAINTEXT', PHOTO: 'PHOTO', VIDEO: 'VIDEO' },
}))

vi.mock('@yikart/mongodb', () => ({
  mongodbConfigSchema: {},
  AccountRepository: class {},
  PublishType: { VIDEO: 'video', ARTICLE: 'article' },
  PublishStatus: {
    FAILED: -1,
    WaitingForPublish: 0,
    PUBLISHED: 1,
    PUBLISHING: 2,
  },
}))

vi.mock('@yikart/assets', () => ({
  assetsConfigSchema: {},
  AssetsService: class {},
}))

vi.mock('../../../publish-record/publish-record.service', () => ({
  PublishRecordService: class {},
}))

function buildTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task_1',
    userId: 'user_1',
    accountId: 'account_1',
    videoUrl: 'media/song.mp4',
    option: {
      musicAssistant: {
        baseUrl: 'http://192.168.1.10:8095',
        playerId: 'player_1',
        mode: 'play',
      },
    },
    ...overrides,
  } as never
}

describe('musicAssistantPubService', () => {
  const musicAssistantService = {
    playMedia: vi.fn(),
    getActiveQueue: vi.fn(),
  }
  const assetsService = {
    buildUrl: vi.fn((url: string) => `https://cdn.example.com/${url}`),
  }

  let service: MusicAssistantPubService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MusicAssistantPubService(
      musicAssistantService as never,
      assetsService as never,
    )
  })

  it('plays media on the configured player and returns published', async () => {
    musicAssistantService.getActiveQueue.mockResolvedValue({
      queue_id: 'player_1',
      active: true,
      current_item: { queue_item_id: 'item_9', uri: 'https://cdn.example.com/media/song.mp4' },
    })

    const result = await service.immediatePublish(buildTask())

    expect(assetsService.buildUrl).toHaveBeenCalledWith('media/song.mp4')
    expect(musicAssistantService.playMedia).toHaveBeenCalledWith(
      { baseUrl: 'http://192.168.1.10:8095', token: undefined },
      'player_1',
      'https://cdn.example.com/media/song.mp4',
      'play',
    )
    expect(result.status).toBe(PublishStatus.PUBLISHED)
    expect(result.postId).toBe('item_9')
    expect(result.permalink).toBe('http://192.168.1.10:8095')
  })

  it('throws a non-retryable error when baseUrl is missing', async () => {
    const task = buildTask({ option: { musicAssistant: { playerId: 'player_1' } } })
    await expect(service.immediatePublish(task)).rejects.toBeInstanceOf(PublishingException)
    expect(musicAssistantService.playMedia).not.toHaveBeenCalled()
  })

  it('throws a non-retryable error when media url is missing', async () => {
    const task = buildTask({ videoUrl: undefined, coverUrl: undefined })
    await expect(service.immediatePublish(task)).rejects.toBeInstanceOf(PublishingException)
  })

  it('verifies publish success when an active queue exists', async () => {
    musicAssistantService.getActiveQueue.mockResolvedValue({ queue_id: 'player_1', active: true })

    const result = await service.verifyAndCompletePublish(buildTask())

    expect(result.success).toBe(true)
    expect(result.workLink).toBe('http://192.168.1.10:8095')
  })

  it('reports verification failure when no active queue is returned', async () => {
    musicAssistantService.getActiveQueue.mockResolvedValue(null)

    const result = await service.verifyAndCompletePublish(buildTask())

    expect(result.success).toBe(false)
  })
})
