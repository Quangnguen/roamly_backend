// 📁 socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép tất cả origin trong development, production nên chỉ định cụ thể
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Hỗ trợ cả websocket và polling
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      console.log(
        `✅ Socket connected - User ${userId} - Socket ID: ${client.id}`,
      );
      console.log(`📊 Total connected users: ${this.connectedUsers.size}`);
    } else {
      console.log(
        `⚠️ Socket connection without userId - Socket ID: ${client.id}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(
          `❌ Socket disconnected - User ${userId} - Socket ID: ${client.id}`,
        );
        console.log(`📊 Total connected users: ${this.connectedUsers.size}`);
        break;
      }
    }
  }

  emitToUser(userId: string, event: string, payload: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      console.log(
        `📤 Emitting event "${event}" to user ${userId} (socket: ${socketId})`,
      );
      this.server.to(socketId).emit(event, payload);
    } else {
      console.log(
        `⚠️ Cannot emit event "${event}" - User ${userId} not connected`,
      );
      console.log(
        `📋 Currently connected users:`,
        Array.from(this.connectedUsers.keys()),
      );
    }
  }

  broadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
