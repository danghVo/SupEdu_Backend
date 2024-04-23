import { Controller, Delete, Get, Patch, Req, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
    constructor(private service: NotificationService) {}

    @Get('/all')
    async getNotification(@Req() req: Request & { user: { uuid: string } }) {
        return await this.service.getNotification(req.user.uuid);
    }

    @Patch('/read/:notifyUuid')
    async readNotification(@Req() req: Request & { user: { uuid: string } }, @Param('notifyUuid') notifyUuid: string) {
        return await this.service.readNotification(req.user.uuid, notifyUuid);
    }

    @Delete('/delete/:notifyUuid')
    async deleteNotification(
        @Req() req: Request & { user: { uuid: string } },
        @Param('notifyUuid') notifyUuid: string,
    ) {
        return await this.service.deleteNotification(req.user.uuid, notifyUuid);
    }

    @Delete('/all')
    async deleteAllNotification(@Req() req: Request & { user: { uuid: string } }) {
        return await this.service.deleteAllNotification(req.user.uuid);
    }
}
