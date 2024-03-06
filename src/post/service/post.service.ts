import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from '../dto';
import { PrismaService } from 'src/prisma/prisma.service';
import moment from 'moment';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class PostService {
    constructor(
        private prisma: PrismaService,
        private aws: AwsService,
    ) {}

    validPost(postDto: CreatePostDto) {
        if (postDto.type === 'Vote') {
            if (!postDto.voteData || !postDto.endTime || postDto.files.length > 0) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại bình chọn');
            }
        }
        if (postDto.type === 'Exercise') {
            if (postDto.voteData || !postDto.endTime || postDto.content) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại bài tập');
            }
        }
        if (postDto.type === 'Annoucement') {
            if (postDto.voteData || !postDto.endTime || !postDto.content) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại thông báo');
            }
        }
    }

    async getAllPosted(classUuid: string) {
        try {
            const allPost = await this.prisma.post.findMany({
                where: {
                    classUuid,
                },
                include: {
                    files: true,
                    voteData: {
                        include: {
                            options: true,
                        },
                    },
                },
            });

            return allPost;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async createPost(createPostDto: CreatePostDto, classUuid: string) {
        try {
            const classExist = await this.prisma.class.findUniqueOrThrow({
                where: {
                    uuid: classUuid,
                },
            });

            this.validPost(createPostDto);

            if (createPostDto.files.length > 0) {
                const files = await this.aws.uploadFile(createPostDto.files);
                createPostDto.files = files;
            }

            const createdInDate = moment().utc().format('DD-MM-YYYY');
            const createdInTime = moment().utc().format('hh:mm');

            const newPost = await this.prisma.post.create({
                data: {
                    classUuid,
                    content: createPostDto.content,
                    type: createPostDto.type,
                    files: {
                        createMany: {
                            data: createPostDto.files.map((file) => file),
                        },
                    },
                    voteData:
                        createPostDto.type === 'Vote'
                            ? {
                                  create: {
                                      title: createPostDto.voteData.title,
                                      options: {
                                          createMany: {
                                              data: createPostDto.voteData.options.map((option) => option),
                                          },
                                      },
                                  },
                              }
                            : null,
                    endInTime: createPostDto.endTime.endInTime,
                    endInDate: createPostDto.endTime.endInDate,
                    createdInDate,
                    createdInTime,
                },
            });

            return newPost;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async deletePost(classUuid: string, postUuid: string) {
        try {
            const deletedPost = await this.prisma.post.delete({
                where: {
                    uuid: postUuid,
                    classUuid,
                },
            });

            return { message: 'Xóa bài đăng thành công' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Bài đăng không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    // async updatePost(postUuid: string, updatePostDto: UpdatePostDto) {
    //     try {
    //         const postExist = await this.prisma.post.findUniqueOrThrow({
    //             where: {
    //                 uuid: postUuid,
    //             },
    //         });

    //         const updatedPost = await this.prisma.post.update({
    //             where: {
    //                 uuid: postUuid,
    //             },
    //             data: {
    //                 content: updatePostDto.content,
    //                 files: {
    //                     updateMany: {
    //                         where: {},
    //                         // data: updatePostDto.files.map((file) => file),
    //                     },
    //                 },
    //                 voteData: {
    //                     update: {
    //                         title: updatePostDto.voteData.title,
    //                         options: {
    //                             deleteMany: {},
    //                             createMany: {
    //                                 data: updatePostDto.voteData.options.map((option) => option),
    //                             },
    //                         },
    //                     },
    //                 },
    //                 endInTime: updatePostDto.endTime.endInTime,
    //                 endInDate: updatePostDto.endTime.endInDate,
    //             },
    //         });

    //         return updatedPost;
    //     } catch (error) {
    //         if (error instanceof PrismaClientKnownRequestError) {
    //             if (error.code === 'P2025') {
    //                 throw new ForbiddenException('Bài đăng không tồn tại');
    //             }
    //         } else throw new ForbiddenException('Lỗi không xác định');
    //     }
    // }
}
