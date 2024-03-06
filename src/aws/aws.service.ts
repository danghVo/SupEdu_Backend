import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { FileService } from 'src/file/file.service';

@Injectable()
export class AwsService {
    private s3: S3Client;

    constructor(
        private config: ConfigService,
        // private file: FileService,
    ) {
        this.s3 = new S3Client({
            region: this.config.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.config.get('AWS_ACCESS_KEY'),
                secretAccessKey: this.config.get('AWS_SECRET_KEY'),
            },
        });
    }

    async getFile(fileKey: string) {
        const file = await this.s3.send(
            new GetObjectCommand({
                Bucket: 'supedu-files',
                Key: fileKey,
            }),
        );

        return file.Body.transformToString();
    }

    async uploadFile(files: any) {
        for await (const file of files) {
            const uploadParams = {
                Bucket: 'supedu-files',
                Key: file.originalname,
                Body: file.buffer,
            };

            try {
                const result = await this.s3.send(new PutObjectCommand(uploadParams));

                console.log(result);
            } catch (error) {
                console.log(error);
            }
        }

        return files.map((file) => file);
    }

    async deleteFile(files: any) {}
}
