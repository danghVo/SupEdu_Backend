import { ForbiddenException, Injectable } from '@nestjs/common';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectAclCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ConfigService } from '@nestjs/config';
import { createReadStream, ReadStream } from 'fs';

@Injectable()
export class AwsService {
    private s3: S3Client;

    constructor(private config: ConfigService) {
        this.s3 = new S3Client({
            region: this.config.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.config.get('AWS_ACCESS_KEY'),
                secretAccessKey: this.config.get('AWS_SECRET_KEY'),
            },
        });
    }

    async getImage(uuid: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: 'supedu',
                Key: uuid,
            });

            const url = await getSignedUrl(this.s3, command);

            return url;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra khi lấy ảnh');
        }
    }

    async uploadImage(userUuid: string, image: any) {
        const key = `images/${userUuid}/${image.originalname}`;

        const uploadParams = {
            Bucket: 'supedu',
            Key: key,
            Body: image.buffer,
            ContentType: image.mimetype,
        };

        try {
            await this.s3.send(new PutObjectCommand(uploadParams));

            return key;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra khi upload ảnh');
        }
    }

    async uploadAvatar(userUuid: string, image: any) {
        const key = `avatars/${userUuid}`;

        const uploadParams = {
            Bucket: 'supedu',
            Key: key,
            Body: image.buffer,
            ContentType: image.mimetype,
        };

        try {
            await this.s3.send(new PutObjectCommand(uploadParams));

            return key;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra khi upload ảnh đại diện');
        }
    }

    async getFiles(files: any) {
        const fileWithUrl = [];
        try {
            for await (const file of files) {
                const command = new GetObjectCommand({
                    Bucket: 'supedu',
                    Key: file.uuid,
                });

                file.path = await getSignedUrl(this.s3, command);

                fileWithUrl.push(file);
            }

            return fileWithUrl;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra khi lấy file');
        }
    }

    async uploadFile(userUuid: string, file: Express.Multer.File) {
        const key = `files/${userUuid}/${file.originalname}`;

        const uploadParams = {
            Bucket: 'supedu',
            Key: key,
            Body: file.buffer,
        };

        try {
            await this.s3.send(new PutObjectCommand(uploadParams));

            return key;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra khi upload file');
        }
    }

    async deleteFiles(fileKey: Array<string>) {
        for await (const key of fileKey) {
            const command = new DeleteObjectCommand({
                Bucket: 'supedu',
                Key: key,
            });

            await this.s3.send(command);
        }
    }
}
