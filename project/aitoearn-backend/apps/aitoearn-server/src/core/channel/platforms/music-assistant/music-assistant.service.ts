import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import {
  MusicAssistantActiveQueue,
  MusicAssistantConnection,
  MusicAssistantEnqueueOption,
} from './music-assistant.types'

const REQUEST_TIMEOUT_MS = 15 * 1000

interface MusicAssistantInboundMessage {
  message_id?: string
  result?: unknown
  error_code?: string
  details?: string
}

/**
 * Music Assistant 平台服务。
 *
 * Music Assistant 是一个自托管音乐服务器，通过 WebSocket JSON API 控制（默认 ws://host:8095/ws）。
 * 这里以「一次请求一条连接」的方式封装命令：建立连接 -> 等待服务器信息 -> 发送命令 -> 等待匹配结果 -> 关闭。
 */
@Injectable()
export class MusicAssistantService {
  private readonly logger = new Logger(MusicAssistantService.name)

  /**
   * 将用户提供的 HTTP(S) 地址转换为 Music Assistant 的 WebSocket 端点。
   */
  private buildSocketUrl(connection: MusicAssistantConnection): string {
    const url = new URL(connection.baseUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/ws'
    }
    // 令牌用于反向代理 / 鉴权场景，按查询参数透传
    if (connection.token) {
      url.searchParams.set('token', connection.token)
    }
    return url.toString()
  }

  /**
   * 发送单条命令并等待结果。
   * @param connection 服务器连接信息
   * @param command 命令名，例如 player_queues/play_media
   * @param args 命令参数
   */
  private request<T>(
    connection: MusicAssistantConnection,
    command: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const socketUrl = this.buildSocketUrl(connection)
    const messageId = randomUUID()

    return new Promise<T>((resolve, reject) => {
      const ws = new WebSocket(socketUrl)
      let settled = false
      let commandSent = false
      let timer: ReturnType<typeof setTimeout>

      const finish = (handler: () => void) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        try {
          ws.close()
        }
        catch {
          // 忽略关闭异常
        }
        handler()
      }

      timer = setTimeout(() => {
        finish(() => reject(new Error(`Music Assistant 命令 ${command} 超时`)))
      }, REQUEST_TIMEOUT_MS)

      ws.addEventListener('message', (event: MessageEvent) => {
        if (typeof event.data !== 'string') {
          return
        }
        let payload: MusicAssistantInboundMessage
        try {
          payload = JSON.parse(event.data) as MusicAssistantInboundMessage
        }
        catch {
          return
        }

        // 首条消息为服务器信息，握手完成后再发送命令
        if (!commandSent && payload.message_id === undefined) {
          commandSent = true
          ws.send(JSON.stringify({ message_id: messageId, command, args }))
          return
        }

        if (payload.message_id !== messageId) {
          return
        }

        if (payload.error_code !== undefined) {
          const errorCode = payload.error_code
          const details = payload.details ?? ''
          finish(() => reject(new Error(
            `Music Assistant 命令 ${command} 失败: ${errorCode} ${details}`.trim(),
          )))
          return
        }

        finish(() => resolve(payload.result as T))
      })

      ws.addEventListener('error', () => {
        finish(() => reject(new Error(`Music Assistant 连接失败: ${socketUrl}`)))
      })

      ws.addEventListener('close', () => {
        finish(() => reject(new Error(`Music Assistant 连接在收到响应前关闭: ${command}`)))
      })
    })
  }

  /**
   * 在指定播放器上播放媒体（即「发布」到 Music Assistant）。
   * @param connection 服务器连接信息
   * @param playerId 目标播放器 / 队列 ID
   * @param media 媒体 URI（可为公开可访问的音视频地址）
   * @param option 入队方式
   */
  async playMedia(
    connection: MusicAssistantConnection,
    playerId: string,
    media: string,
    option: MusicAssistantEnqueueOption = 'play',
  ): Promise<void> {
    this.logger.log(`Music Assistant playMedia player=${playerId} option=${option}`)
    await this.request<unknown>(connection, 'player_queues/play_media', {
      queue_id: playerId,
      media,
      option,
    })
  }

  /**
   * 获取播放器当前激活的队列，用于校验媒体是否已成功入队。
   * @param connection 服务器连接信息
   * @param playerId 目标播放器 / 队列 ID
   */
  async getActiveQueue(
    connection: MusicAssistantConnection,
    playerId: string,
  ): Promise<MusicAssistantActiveQueue | null> {
    const result = await this.request<MusicAssistantActiveQueue | null>(
      connection,
      'player_queues/get_active_queue',
      { queue_id: playerId },
    )
    return result ?? null
  }
}
