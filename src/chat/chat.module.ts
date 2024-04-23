import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SocketModule } from 'src/socket/socket.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { AwsModule } from 'src/aws/aws.module';

@Module({
    imports: [SocketModule, PrismaModule, NotificationModule, AwsModule],
    providers: [ChatService],
    controllers: [ChatController],
})
export class ChatModule {}
