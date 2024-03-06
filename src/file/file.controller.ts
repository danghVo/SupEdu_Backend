import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { AwsService } from 'src/aws/aws.service';

@Controller('file')
export class FileController {
    constructor(private aws: AwsService) {}

    @Public()
    @Get('/:fileKey')
    async getFile(@Param('fileKey') fileKey: string) {
        const file = await this.aws.getFile(fileKey);

        return file;
    }
}
