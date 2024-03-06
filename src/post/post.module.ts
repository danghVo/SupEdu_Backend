import { Module } from '@nestjs/common';
import { PostController } from './controller';
import { PostService } from './service';
import { AwsModule } from 'src/aws/aws.module';

@Module({
    imports: [AwsModule],
    controllers: [PostController],
    providers: [PostService],
    exports: [PostService],
})
export class PostModule {}
