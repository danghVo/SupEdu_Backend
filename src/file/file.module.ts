import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { AwsModule } from 'src/aws/aws.module';

@Module({
    imports: [AwsModule],
    providers: [FileService],
    controllers: [FileController],
    exports: [FileService],
})
export class FileModule {}
