import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
