import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
    imports: [PrismaModule, SocketModule],
    exports: [NotificationService],
    providers: [NotificationService],
    controllers: [NotificationController],
})
export class NotificationModule {}
