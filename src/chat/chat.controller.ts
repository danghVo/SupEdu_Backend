import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('chat')
export class ChatController {
    constructor(private service: ChatService) {}

    @Get('infor')
    async getChatInfor(@Req() req: Request & { user: { uuid: string } }) {
        return await this.service.getChatInfor(req.user.uuid);
    }

    @Public()
    @Get('avail')
    async getAvailChat() {
        const res = await this.service.getAvailChat();

        return res;
    }

    @Post('/send')
    async sendMessage(
        @Req() req: Request & { user: { uuid: string } },
        @Body() body: { message: string; toUuid: string },
    ) {
        return await this.service.sendMessage(req.user.uuid, body);
    }

    @Get('history/:withUuid')
    async getHistoryChat(@Param('withUuid') withUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.service.getHistoryChat(req.user.uuid, withUuid);
    }
}
