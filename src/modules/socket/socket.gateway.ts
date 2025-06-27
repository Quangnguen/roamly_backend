import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// ✨ Extend Socket interface
interface ExtendedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    console.log('🚀 Socket Gateway initialized');
  }

  handleConnection(client: ExtendedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        console.log('❌ No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      console.log(`🔌 User ${userId} connected with socket ${client.id}`);

      this.userSockets.set(userId, client.id);
      client.userId = userId; // ✅ No more TypeScript error

      console.log(`📊 Current connected users:`, Array.from(this.userSockets.keys()));

      // Test emit ngay khi connect
      client.emit('connection_success', { userId, socketId: client.id });
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: ExtendedSocket) {
    if (client.userId) {
      console.log(`🔌 User ${client.userId} disconnected`);
      this.userSockets.delete(client.userId);
      console.log(`📊 Remaining users:`, Array.from(this.userSockets.keys()));
    }
  }

  // Emit tới một user cụ thể
  emitToUser(userId: string, event: string, data: any) {
    console.log(`🎯 Attempting to emit "${event}" to user ${userId}:`, data);

    const socketId = this.userSockets.get(userId);

    if (socketId) {
      console.log(`✅ Found socket ${socketId} for user ${userId}`);
      this.server.to(socketId).emit(event, data);
      console.log(`📤 Successfully emitted "${event}" to socket ${socketId}`);
    } else {
      console.log(`❌ No socket found for user ${userId}`);
      console.log(`🔍 Available users:`, Array.from(this.userSockets.keys()));
      console.log(`🔍 Looking for user: "${userId}" (type: ${typeof userId})`);
    }
  }

  // ✨ Broadcast tới tất cả users
  broadcastToAll(event: string, data: any) {
    console.log(`📡 Broadcasting "${event}" to all connected clients:`, data);
    console.log(`📊 Connected users count: ${this.userSockets.size}`);
    
    this.server.emit(event, data);
    
    console.log(`📤 Successfully broadcasted "${event}" to all clients`);
  }

  // ✨ Broadcast tới tất cả users ngoại trừ sender
  broadcastToAllExcept(excludeUserId: string, event: string, data: any) {
    console.log(`📡 Broadcasting "${event}" to all except user ${excludeUserId}:`, data);
    
    const excludeSocketId = this.userSockets.get(excludeUserId);
    
    if (excludeSocketId) {
      this.server.except(excludeSocketId).emit(event, data);
      console.log(`📤 Broadcasted "${event}" to all except socket ${excludeSocketId}`);
    } else {
      // Nếu không tìm thấy socket của user cần exclude, broadcast tới tất cả
      this.server.emit(event, data);
      console.log(`📤 User ${excludeUserId} not found, broadcasted to all`);
    }
  }

  // ✨ Utility methods
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Test methods
  @SubscribeMessage('test_connection')
  handleTestConnection(client: ExtendedSocket, data: any) {
    console.log(`🧪 Test connection from ${client.userId}:`, data);
    client.emit('test_response', { 
      message: 'Test successful', 
      userId: client.userId,
      onlineUsers: this.getOnlineUsersCount()
    });
  }

  @SubscribeMessage('test_broadcast')
  handleTestBroadcast(client: ExtendedSocket, data: any) {
    console.log(`🧪 Test broadcast from ${client.userId}:`, data);
    
    this.broadcastToAll('test_broadcast_response', {
      message: 'Broadcast test from ' + client.userId,
      sender: client.userId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}