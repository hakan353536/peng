import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Get('token')
  async getToken(
    @Query('room') room: string,
    @Query('participant') participant: string,
    @Query('role') role: string,
  ) {
    if (!room || !participant || !role) {
      throw new BadRequestException('room, participant and role are required parameters.');
    }

    const isPublisher = role === 'publisher';
    const token = await this.livekitService.createToken(room, participant, isPublisher);
    
    return { token };
  }
}
