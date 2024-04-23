import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { Role } from 'src/guard/Role/role.decorator';
import { RoleGuard } from 'src/guard/Role/role.guard';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('class')
export class ClassController {
    constructor(private classService: ClassService) {}

    @Get('all')
    @Public()
    async getAllClasses() {
        return await this.classService.getAllClasses();
    }

    @Post('')
    @Role('TEACHER')
    @UseGuards(RoleGuard)
    async createClass(@Body() createClassDto: CreateClassDto, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.createClass(createClassDto, req.user.uuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Get('own/all')
    async getAllClassesOfTeacher(@Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getAllOwnClasses(req.user.uuid);
    }

    @Get('join/all')
    async getAllJoinedClasses(@Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getAllJoinedClasses(req.user.uuid);
    }

    @Get('waiting/all')
    async getAllWaitingClasses(@Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getAllWaitingClasses(req.user.uuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Patch(':classUuid')
    async updateClassInfor(
        @Body() updateClassDto: UpdateClassDto,
        @Param('classUuid') classUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.updateClass(req.user.uuid, updateClassDto, classUuid);
    }

    @Post('/join/:classUuid')
    async joinClass(
        @Body() payload: { password: string },
        @Param('classUuid') classUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.joinClass(payload.password, classUuid, req.user.uuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Patch('/:classUuid/approve/:userUuid')
    async responseJoinRequest(
        @Body() payload: { approve: boolean },
        @Param('classUuid') classUuid: string,
        @Param('userUuid') userUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.responseJoinRequest(req.user.uuid, classUuid, userUuid, payload.approve);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Put('/:classUuid/member')
    async addMemberToClass(
        @Param('classUuid') classUuid: string,
        @Body() payload: { email: string },
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.addMemberToClass(req.user.uuid, classUuid, payload.email);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Delete('/:classUuid/member/:userUuid')
    async removeMemberFromClass(
        @Param('classUuid') classUuid: string,
        @Param('userUuid') userUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.removeMemberFromClass(req.user.uuid, classUuid, userUuid);
    }

    @Get('/:classUuid')
    async getClassDetail(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getClassDetail(req.user.uuid, classUuid);
    }

    @Get('/:classUuid/members')
    async getMembersOfClass(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getMembersOfClass(classUuid, req.user.uuid);
    }

    @Delete('leave/:classUuid')
    async leaveClass(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.leaveClass(req.user.uuid, classUuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Delete(':classUuid')
    async deleteClass(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.deleteClass(classUuid, req.user.uuid);
    }

    @Get(':classUuid/calendar')
    async getCalender(@Param('classUuid') classUuid: string) {
        return await this.classService.getCalender(classUuid);
    }
}
