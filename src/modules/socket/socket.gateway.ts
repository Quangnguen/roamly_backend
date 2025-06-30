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
import { Cron } from '@nestjs/schedule';

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

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, any>(); // socketId -> socket

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    console.log('🚀 Socket Gateway initialized');
  }

  handleConnection(client: ExtendedSocket) {
    console.log('🚨 HANDLE CONNECTION CALLED - START'); // ✅ Thêm dòng này
    console.log('🔗 NEW CONNECTION ATTEMPT:', client.id);
    console.log('🔑 Full handshake:', JSON.stringify(client.handshake, null, 2));
    console.log('🔑 Auth data:', client.handshake.auth);
    console.log('🔑 Query params:', client.handshake.query);
    console.log('🔑 Headers:', client.handshake.headers);
    
    try {
      // ✅ Thử lấy token từ nhiều nguồn
      let token = client.handshake.auth.token || 
                  client.handshake.auth.authorization ||
                  client.handshake.query.token ||
                  client.handshake.headers.authorization;

      // ✅ Xử lý Bearer token format
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      console.log('🔑 Extracted token:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');

      if (!token) {
        console.log('❌ No token provided for socket:', client.id);
        console.log('❌ Available auth sources:', {
          'auth.token': !!client.handshake.auth.token,
          'auth.authorization': !!client.handshake.auth.authorization,
          'query.token': !!client.handshake.query.token,
          'headers.authorization': !!client.handshake.headers.authorization
        });
        
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      console.log('🔑 Attempting JWT verification...');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        console.log('❌ No userId found in JWT payload:', payload);
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect();
        return;
      }

      console.log('✅ JWT verified successfully!');
      console.log('👤 User ID:', userId);
      console.log('🔌 Socket ID:', client.id);

      // ✅ Kiểm tra user đã connect chưa (prevent duplicate)
      const existingSocketId = this.connectedUsers.get(userId);
      if (existingSocketId && existingSocketId !== client.id) {
        console.log(`⚠️ User ${userId} already connected with socket ${existingSocketId}`);
        console.log(`🔄 Disconnecting old socket and using new one`);
        
        // ✅ SỬA: Sử dụng sockets.get() để lấy socket instance
        const existingSocket = this.server.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect();
          console.log(`🔄 Disconnected old socket ${existingSocketId}`);
        }
      }

      this.connectedUsers.set(userId, client.id);
      this.userSockets.set(client.id, client);

      client.userId = userId;

      // ✅ Emit success event
      client.emit('connection_success', { 
        userId, 
        socketId: client.id,
        message: 'Socket connected successfully'
      });

      console.log('🎉 Connection setup completed for user:', userId);
      
    } catch (error) {
      console.error('❌ Socket connection error:');
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        console.error('❌ JWT Error - Invalid token format');
      } else if (error.name === 'TokenExpiredError') {
        console.error('❌ JWT Error - Token expired');
      } else if (error.name === 'NotBeforeError') {
        console.error('❌ JWT Error - Token not active');
      }
      
      client.emit('error', { 
        message: 'Authentication failed',
        error: error.message 
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: ExtendedSocket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
    
    // ✅ Find and remove user by socket ID
    let disconnectedUserId: string | null = null;
    
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`👋 User ${disconnectedUserId} disconnected`);
      this.connectedUsers.delete(disconnectedUserId);
    }
    
    this.userSockets.delete(client.id);
    
    console.log('🔍 Remaining connected users:', Array.from(this.connectedUsers.keys()));
  }

  // Emit tới một user cụ thể
  emitToUser(userId: string, event: string, data: any) {
    console.log(`🔍 Attempting to emit "${event}" to user: ${userId}`);
    console.log('🔍 Available users:', Array.from(this.connectedUsers.keys()));
    
    const socketId = this.connectedUsers.get(userId);
    
    if (!socketId) {
      console.log(`❌ No socket found for user ${userId}`);
      console.log('🔍 Available users:', Array.from(this.connectedUsers.keys()));
      
      // ✅ Không throw error, chỉ log và return
      return false;
    }

    const socket = this.userSockets.get(socketId);
    
    if (!socket || !socket.connected) {
      console.log(`❌ Socket disconnected for user ${userId}, cleaning up`);
      
      // ✅ Cleanup stale connections
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socketId);
      
      return false;
    }

    try {
      socket.emit(event, data);
      console.log(`✅ Emitted "${event}" to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error emitting to user ${userId}:`, error);
      
      // ✅ Cleanup on error
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socketId);
      
      return false;
    }
  }

  // ✨ Broadcast tới tất cả users
  broadcastToAll(event: string, data: any) {
    console.log(`📡 Broadcasting "${event}" to all connected clients:`, data);
    console.log(`📊 Connected users count: ${this.connectedUsers.size}`);
    
    this.server.emit(event, data);
    
    console.log(`📤 Successfully broadcasted "${event}" to all clients`);
  }

  // ✨ Broadcast tới tất cả users ngoại trừ sender
  broadcastToAllExcept(excludeUserId: string, event: string, data: any) {
    console.log(`📡 Broadcasting "${event}" to all except user ${excludeUserId}:`, data);
    
    const excludeSocketId = this.connectedUsers.get(excludeUserId);
    
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
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
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

  // ✅ Cleanup stale connections periodically
  @Cron('0 */5 * * * *') // Every 5 minutes
  async cleanupStaleConnections() {
    console.log('🧹 Cleaning up stale socket connections...');
    
    const staleUsers: string[] = [];
    
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      const socket = this.userSockets.get(socketId);
      
      if (!socket || !socket.connected) {
        staleUsers.push(userId);
      }
    }
    
    staleUsers.forEach(userId => {
      const socketId = this.connectedUsers.get(userId);
      this.connectedUsers.delete(userId);
      if (socketId) {
        this.userSockets.delete(socketId);
      }
    });
    
    if (staleUsers.length > 0) {
      console.log(`🧹 Cleaned up ${staleUsers.length} stale connections`);
    }
    
    console.log('🔍 Active connections:', this.connectedUsers.size);
  }

  // ✅ Get connection status
  getConnectionStatus() {
    return {
      totalConnections: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
      sockets: Array.from(this.userSockets.keys()),
    };
  }
}