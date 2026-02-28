import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [TrackingGateway],
})
export class AppModule {}
