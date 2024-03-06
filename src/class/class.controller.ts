import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { Role } from 'src/guard/Role/role.decorator';
import { takeCoverage } from 'v8';

@Controller('class')
export class ClassController {
    constructor(private classService: ClassService) {}

    @Role('TEACHER')
    @Post('create')
    async createClass(@Body() createClassDto: CreateClassDto, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.createClass(createClassDto, req.user.uuid);
    }

    @Role('TEACHER')
    @Get('owner/all')
    async getAllClassesOfTeacher(@Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getAllOwnClasses(req.user.uuid);
    }

    @Role('STUDENT')
    @Get('all')
    async getAllJoinedClasses(@Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getAllJoinedClasses(req.user.uuid);
    }

    @Role('TEACHER')
    @Patch('update/:classUuid')
    async updateClassInfor(
        @Body() createClassDto: UpdateClassDto,
        classUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.updateClass(createClassDto, classUuid, req.user.uuid);
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
    @Patch('/:classUuid/approve/:studentUuid')
    async responseJoinRequest(
        @Body() payload: { approve: boolean },
        @Param('classUuid') classUuid: string,
        @Param('studentUuid') studentUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.classService.responseJoinRequest(req.user.uuid, classUuid, studentUuid, payload.approve);
    }

    @Get('/:classUuid')
    async getClassDetail(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.getClassDetail(req.user.uuid, classUuid);
    }

    @Delete('leave/:classUuid')
    async leaveClass(@Param('classUuid') classUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.classService.leaveClass(req.user.uuid, classUuid);
    }
}
