import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { PostService } from 'src/post/service';
import { PostModule } from 'src/post/post.module';

@Module({
    imports: [PostModule],
    controllers: [ClassController],
    providers: [ClassService],
})
export class ClassModule {}
