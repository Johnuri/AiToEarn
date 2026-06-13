import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { MusicAssistantService } from '../../platforms/music-assistant/music-assistant.service'
import { MusicAssistantConnection, MusicAssistantEnqueueOption } from '../../platforms/music-assistant/music-assistant.types'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

interface MusicAssistantOption {
  baseUrl?: string
  token?: string
  playerId?: string
  mode?: MusicAssistantEnqueueOption
}

@Injectable()
export class MusicAssistantPubService extends PublishService {
  private readonly logger = new Logger(MusicAssistantPubService.name)

  constructor(
    private readonly musicAssistantService: MusicAssistantService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  /**
   * 从发布任务的 option 中解析 Music Assistant 连接与目标播放器信息。
   */
  private resolveOption(publishTask: PublishRecord): {
    connection: MusicAssistantConnection
    playerId: string
    mode: MusicAssistantEnqueueOption
  } {
    const option = publishTask.option?.musicAssistant as MusicAssistantOption | undefined
    if (!option?.baseUrl) {
      throw PublishingException.nonRetryable('Music Assistant baseUrl is required')
    }
    if (!option.playerId) {
      throw PublishingException.nonRetryable('Music Assistant playerId is required')
    }
    return {
      connection: { baseUrl: option.baseUrl, token: option.token },
      playerId: option.playerId,
      mode: option.mode ?? 'play',
    }
  }

  /**
   * 解析待发布的媒体地址（视频优先，其次封面图）。
   */
  private resolveMediaUrl(publishTask: PublishRecord): string {
    const raw = publishTask.videoUrl || publishTask.coverUrl
    if (!raw) {
      throw PublishingException.nonRetryable('Music Assistant 发布缺少媒体地址')
    }
    return this.assetsService.buildUrl(raw)
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { connection, playerId, mode } = this.resolveOption(publishTask)
    const media = this.resolveMediaUrl(publishTask)

    this.logger.log(`Music Assistant immediatePublish task=${publishTask.id} player=${playerId}`)
    await this.musicAssistantService.playMedia(connection, playerId, media, mode)

    const activeQueue = await this.musicAssistantService.getActiveQueue(connection, playerId)
    const postId = activeQueue?.current_item?.queue_item_id || playerId

    return {
      postId,
      permalink: connection.baseUrl,
      status: PublishStatus.PUBLISHED,
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    let resolved: ReturnType<typeof this.resolveOption>
    try {
      resolved = this.resolveOption(publishRecord)
    }
    catch (error) {
      this.logger.error(error as Error, `Music Assistant 校验缺少必要参数 task=${publishRecord.id}`)
      return { success: false, errorMsg: '缺少必要参数' }
    }

    try {
      const activeQueue = await this.musicAssistantService.getActiveQueue(
        resolved.connection,
        resolved.playerId,
      )
      if (activeQueue && activeQueue.queue_id) {
        return { success: true, workLink: resolved.connection.baseUrl }
      }
      return { success: false, errorMsg: 'Music Assistant 播放器队列未激活' }
    }
    catch (error) {
      this.logger.error(error as Error, `验证 Music Assistant 发布状态失败 task=${publishRecord.id}`)
      return { success: false, errorMsg: `验证发布状态失败: ${(error as Error).message}` }
    }
  }
}
