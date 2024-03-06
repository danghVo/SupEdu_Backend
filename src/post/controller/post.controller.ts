import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { PostService } from '../service/post.service';
import { CreatePostDto } from '../dto';
import { Role } from 'src/guard/Role/role.decorator';

@Controller('class/:classUuid/post')
export class PostController {
    constructor(private post: PostService) {}

    @Role('TEACHER')
    @Post('create')
    async create(@Body() body: CreatePostDto, @Param('classUuid') classUuid: string, @Req() req: any) {
        return this.post.createPost(body, classUuid);
    }
}
