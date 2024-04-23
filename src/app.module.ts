import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ClassModule } from './class/class.module';
import { PostModule } from './post/post.module';
import { AwsModule } from './aws/aws.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailModule } from './mail/mail.module';
import { SocketModule } from './socket/socket.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                service: 'Gmail',
                port: 465,
                auth: {
                    type: 'OAuth2',
                    clientSecret: process.env.MAIL_CLIENT_SECRET,
                    user: process.env.MAIL_USER,
                    clientId: process.env.MAIL_CLIENT_ID,
                    expires: 3599,
                    accessToken: process.env.MAIL_ACCESS_TOKEN,
                    refreshToken: process.env.MAIL_REFRESH_TOKEN,
                },
            },
            defaults: {
                from: 'No reply from SupEdu',
            },
        }),
        AuthModule,
        PrismaModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        UserModule,
        ClassModule,
        PostModule,
        AwsModule,
        MailModule,
        SocketModule,
        NotificationModule,
        ChatModule,
    ],
})
export class AppModule {}
