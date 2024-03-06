import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FileService {
    constructor(private prisma: PrismaService) {}

    // async getFile(fileUuid: String, postUuid: String) {
    //     const file = await this.prisma.file.findUnique({
    //         file.uuid === fileUuid

    //     })
    // }

    async saveFileName(files: Array<string>, postUuid?: string) {}
}
