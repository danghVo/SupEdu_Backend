import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, CommentDto } from './dto';
import { Role } from 'src/guard/Role/role.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RoleGuard } from 'src/guard/Role/role.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { SubmitExerciseDto } from './dto/submitExercise.dto';
import { MarkScoreDto } from './dto/markScore.dto';

@Controller('post')
export class PostController {
    constructor(private post: PostService) {}

    @Get('/all/:classUuid')
    async getAllPost(@Param('classUuid') classUuid: string) {
        return await this.post.getAllPosted(classUuid);
    }

    @Role('TEACHER')
    @UseInterceptors(FilesInterceptor('files'))
    @UseGuards(RoleGuard)
    @Post('/:classUuid')
    async createPost(
        @Body() body: CreatePostDto,
        @Param('classUuid') classUuid: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.post.createPost(req.user.uuid, classUuid, body, files);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Patch('/:classUuid/:postUuid')
    async updatePost(
        @Body() body: UpdatePostDto,
        @Param('postUuid') postUuid: string,
        @Param('classUuid') classUuid: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.post.updatePost(req.user.uuid, classUuid, postUuid, body, files);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Delete('/:classUuid/:postUuid')
    async deletePost(
        @Param('postUuid') postUuid: string,
        @Param('classUuid') classUuid: string,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.post.deletePost(req.user.uuid, classUuid, postUuid);
    }

    // exercise
    @Public()
    @Get('all/exercises/:classUuid')
    async getAllExercise(@Param('classUuid') classUuid: string) {
        return await this.post.getAllExercise(classUuid);
    }

    @Get('/exercise/:postUuid')
    async getExercise(@Param('postUuid') postUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.post.getExercise(postUuid, req.user.uuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Get('/submit/:postUuid')
    async getAllSubmit(@Param('postUuid') postUuid: string) {
        return await this.post.getAllSubmit(postUuid);
    }

    @Role('TEACHER')
    @UseGuards(RoleGuard)
    @Patch('/:classUuid/submit/mark/:submitUuid')
    async markScore(
        @Param('submitUuid') submitUuid: string,
        @Param('classUuid') classUuid: string,
        @Body() body: MarkScoreDto,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        return await this.post.markScore(req.user.uuid, classUuid, submitUuid, body);
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post('/submit/:postUuid')
    async submitExercise(
        @Param('postUuid') postUuid: string,
        @Req() req: Request & { user: { uuid: string } },
        @Body() body: SubmitExerciseDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return await this.post.submitExercise(postUuid, req.user.uuid, body, files);
    }

    @Get('/vote/:voteUuid')
    async getVote(@Param('voteUuid') voteUuid: string, @Req() req: Request & { user: { uuid: string } }) {
        return await this.post.getVoteData(voteUuid, req.user.uuid);
    }

    @Put('/vote/:voteUuid')
    async vote(
        @Param('voteUuid') voteUuid: string,
        @Req() req: Request & { user: { uuid: string } },
        @Body() body: { optionUuid: string | null },
    ) {
        return await this.post.chooseOption(voteUuid, req.user.uuid, body?.optionUuid);
    }

    @Get('/comment/:postUuid')
    async getComments(@Param('postUuid') postUuid: string) {
        return await this.post.getComments(postUuid);
    }

    @Post('/comment/:postUuid')
    async comment(
        @Param('postUuid') postUuid: string,
        @Req() req: Request & { user: { uuid: string } },
        @Body() body: CommentDto,
    ) {
        return await this.post.comment(postUuid, req.user.uuid, body);
    }

    @Get(':classUuid/task')
    async getTaskInDate(@Query() query: { date: string }, @Param('classUuid') classUuid: string) {
        return await this.post.getTaskInDate(classUuid, query.date);
    }

    @Get(':postUuid/check')
    async checkExistPost(@Param('postUuid') postUuid: string) {
        return await this.post.checkExistPost(postUuid);
    }
}
