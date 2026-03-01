import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  LocationUpdate,
  WebRTCOffer,
  WebRTCAnswer,
  WebRTCIceCandidate,
} from './shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeStreamers = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [vehicleId, socketId] of this.activeStreamers) {
      if (socketId === client.id) {
        this.activeStreamers.delete(vehicleId);
        this.server.emit(SocketEvents.WEBRTC_STOP_STREAM, { vehicleId });
        console.log(`Stream stopped (disconnect): ${vehicleId}`);
        break;
      }
    }
  }

  @SubscribeMessage(SocketEvents.LOCATION_UPDATE)
  handleLocationUpdate(@MessageBody() data: LocationUpdate, @ConnectedSocket() client: Socket) {
    const { vehicleId, position, speed } = data;
    const lat = (position as any).lat ?? position.latitude;
    const lng = (position as any).lng ?? position.longitude;
    console.log(`[GPS] ${vehicleId} | ${lat?.toFixed(4)}, ${lng?.toFixed(4)} | ${speed} km/h`);
    // Room-based ve global broadcast
    this.server.to(`vehicle:${vehicleId}`).emit(SocketEvents.LOCATION_DATA, data);
    this.server.to('fleet:global').emit(SocketEvents.LOCATION_DATA, data);
    if (data.tripId) {
      this.server.to(`trip:${data.tripId}`).emit(SocketEvents.LOCATION_DATA, data);
    }
  }

  @SubscribeMessage(SocketEvents.LOCATION_SUBSCRIBE)
  handleSubscribe(@MessageBody() data: { vehicleId?: string; tripId?: string; fleetId?: string }, @ConnectedSocket() client: Socket) {
    if (data.fleetId) client.join(`fleet:${data.fleetId}`);
    if (data.vehicleId) client.join(`vehicle:${data.vehicleId}`);
    if (data.tripId) client.join(`trip:${data.tripId}`);
    console.log(`[SUB] ${client.id} joined: ${data.fleetId ? 'fleet:' + data.fleetId : ''} ${data.vehicleId ? 'vehicle:' + data.vehicleId : ''}`);
  }

  @SubscribeMessage(SocketEvents.LOCATION_UNSUBSCRIBE)
  handleUnsubscribe(@MessageBody() data: { vehicleId?: string; tripId?: string }, @ConnectedSocket() client: Socket) {
    if (data.vehicleId) client.leave(`vehicle:${data.vehicleId}`);
    if (data.tripId) client.leave(`trip:${data.tripId}`);
  }

  @SubscribeMessage(SocketEvents.WEBRTC_START_STREAM)
  handleStartStream(@MessageBody() data: { vehicleId: string }, @ConnectedSocket() client: Socket) {
    this.activeStreamers.set(data.vehicleId, client.id);
    console.log(`Stream started: ${data.vehicleId}`);
    this.server.emit(SocketEvents.WEBRTC_STREAM_LIST, { activeStreams: Array.from(this.activeStreamers.keys()) });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_STOP_STREAM)
  handleStopStream(@MessageBody() data: { vehicleId: string }) {
    this.activeStreamers.delete(data.vehicleId);
    console.log(`Stream stopped: ${data.vehicleId}`);
    this.server.emit(SocketEvents.WEBRTC_STREAM_LIST, { activeStreams: Array.from(this.activeStreamers.keys()) });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_REQUEST_STREAM)
  handleRequestStream(@MessageBody() data: { vehicleId: string; viewerId: string }, @ConnectedSocket() client: Socket) {
    const streamerSocketId = this.activeStreamers.get(data.vehicleId);
    if (!streamerSocketId) {
      client.emit('error', { message: `Vehicle ${data.vehicleId} is not streaming` });
      return;
    }
    this.server.to(streamerSocketId).emit(SocketEvents.WEBRTC_REQUEST_STREAM, { vehicleId: data.vehicleId, viewerId: data.viewerId });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_OFFER)
  handleOffer(@MessageBody() data: WebRTCOffer) {
    this.server.emit(`webrtc:offer:${data.viewerId}`, { vehicleId: data.vehicleId, viewerId: data.viewerId, sdp: data.sdp });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ANSWER)
  handleAnswer(@MessageBody() data: WebRTCAnswer) {
    const streamerSocketId = this.activeStreamers.get(data.vehicleId);
    if (!streamerSocketId) return;
    this.server.to(streamerSocketId).emit(SocketEvents.WEBRTC_ANSWER, { vehicleId: data.vehicleId, viewerId: data.viewerId, sdp: data.sdp });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ICE_CANDIDATE)
  handleIceCandidate(@MessageBody() data: WebRTCIceCandidate, @ConnectedSocket() client: Socket) {
    const streamerSocketId = this.activeStreamers.get(data.vehicleId);
    if (client.id === streamerSocketId) {
      this.server.emit(`webrtc:ice-candidate:${data.viewerId}`, { vehicleId: data.vehicleId, viewerId: data.viewerId, candidate: data.candidate });
    } else if (streamerSocketId) {
      this.server.to(streamerSocketId).emit(SocketEvents.WEBRTC_ICE_CANDIDATE, { vehicleId: data.vehicleId, viewerId: data.viewerId, candidate: data.candidate });
    }
  }

  @SubscribeMessage(SocketEvents.WEBRTC_STREAM_LIST)
  handleStreamList(@ConnectedSocket() client: Socket) {
    client.emit(SocketEvents.WEBRTC_STREAM_LIST, { activeStreams: Array.from(this.activeStreamers.keys()) });
  }

  @SubscribeMessage('ai:simulate-alert')
  handleAiSimulateAlert(@MessageBody() data: any) {
    this.server.emit('ai:alert', data);
  }
}
