import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { PostModule } from 'src/post/post.module';
import { AwsModule } from 'src/aws/aws.module';

@Module({
    imports: [PostModule, AwsModule],
    controllers: [ClassController],
    providers: [ClassService],
})
export class ClassModule {}
