import { Module } from '@nestjs/common'
import { MusicAssistantService } from './music-assistant.service'

@Module({
  providers: [MusicAssistantService],
  exports: [MusicAssistantService],
})
export class MusicAssistantModule {}
