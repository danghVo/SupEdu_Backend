import { Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorator/public.decorator';
import { AwsService } from './aws.service';

@Controller('aws')
export class AwsController {
    constructor(private aws: AwsService) {}

    @UseInterceptors(FilesInterceptor('files'))
    @Post('upload')
    @Public()
    async uploadFile(@UploadedFiles() files: any) {
        const fileUpload = await this.aws.uploadFile(files);

        return fileUpload;
    }

    @Get('get')
    @Public()
    async getFile() {
        const fileUpload = await this.aws.getFile('d33245f0f9153b148fe7c71a3e7e3d59');

        return fileUpload;
    }
}
