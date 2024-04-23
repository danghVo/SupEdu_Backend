import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guard/auth.guard';
import { MailModule } from 'src/mail/mail.module';
import { SocketModule } from 'src/socket/socket.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [JwtModule.register({}), MailModule, SocketModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AuthModule {}
