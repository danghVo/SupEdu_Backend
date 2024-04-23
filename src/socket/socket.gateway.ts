import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('message')
    handleMessage(client: any, payload: any): string {
        return 'Hello!';
    }

    // @SubscribeMessage('events')
    // async
}
