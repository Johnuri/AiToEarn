/**
 * Music Assistant 自托管音乐服务器的连接与命令类型定义。
 * 协议参考 Music Assistant 的 WebSocket JSON API（默认端口 8095，路径 /ws）。
 */

export interface MusicAssistantConnection {
  baseUrl: string
  token?: string
}

export type MusicAssistantEnqueueOption = 'play' | 'replace' | 'next' | 'add'

export interface MusicAssistantCommandMessage {
  message_id: string
  command: string
  args?: Record<string, unknown>
}

export interface MusicAssistantSuccessMessage {
  message_id: string
  result?: unknown
}

export interface MusicAssistantErrorMessage {
  message_id: string
  error_code: string
  details?: string
}

export interface MusicAssistantServerInfoMessage {
  server_id: string
  server_version: string
  schema_version: number
}

export interface MusicAssistantQueueItem {
  queue_item_id: string
  uri?: string
  name?: string
}

export interface MusicAssistantActiveQueue {
  queue_id: string
  active: boolean
  current_item?: MusicAssistantQueueItem
}
