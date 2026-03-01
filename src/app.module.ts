import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [TrackingGateway, LivekitService],
  controllers: [LivekitController],
})
export class AppModule {}
