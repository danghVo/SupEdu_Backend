import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { AwsController } from './aws.controller';
import { FileModule } from 'src/file/file.module';

@Module({
    // imports: [FileModule],
    controllers: [AwsController],
    providers: [AwsService],
    exports: [AwsService],
})
export class AwsModule {}
