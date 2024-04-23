import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private mailer: MailerService,
        private config: ConfigService,
    ) {}

    async mailConfirm(email: string, userUuid: string, token: string) {
        const body = {
            from: 'huynhvo47@gmail.com',
            to: email,
            text: 'Verify your email address',
            html: `<br>Click here to verify your mail: </br><a href="http://localhost:4000/api/auth/verify/${userUuid}/${token}">Verify your mail</a>`,
        };

        await this.sendMail(body);
    }

    async sendMail(body: any) {
        await this.mailer.sendMail(body);
    }
}
