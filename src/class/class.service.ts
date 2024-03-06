import { UpdateClassDto } from './dto/updateClass.dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PostService } from 'src/post/service';

@Injectable()
export class ClassService {
    constructor(
        private prisma: PrismaService,
        private post: PostService,
    ) {}

    async createClass(createClassDto: CreateClassDto, teacherUuid: string) {
        try {
            let hashedPassword: string | null;
            if (createClassDto.password) {
                hashedPassword = await argon2.hash(createClassDto.password);
            } else hashedPassword = null;

            // Create class logic here
            const newClass = await this.prisma.class.create({
                data: {
                    name: createClassDto.name,
                    createdByTeacherUuid: teacherUuid,
                    description: createClassDto.description || null,
                    background: createClassDto.background || null,
                    theme: createClassDto.theme || null,
                    password: hashedPassword,
                },
            });

            return newClass;
        } catch (error) {
            throw new ForbiddenException('Error creating class');
        }
    }

    async getAllOwnClasses(uuid: string) {
        try {
            // Get all classes of teacher logic here
            const allClasses = await this.prisma.class.findMany({
                where: {
                    createdByTeacherUuid: uuid,
                },
                select: {
                    name: true,
                    description: true,
                    background: true,
                    theme: true,
                    owner: {
                        select: {
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            return allClasses;
        } catch (error) {
            throw new ForbiddenException('Error getting classes');
        }
    }

    async getAllJoinedClasses(uuid: string) {
        // Get all joined classes of student logic here
        const allClasses = await this.prisma.userJoinClass.findMany({
            where: {
                userUuid: uuid,
                status: 'JOINED',
            },
            select: {
                class: {
                    select: {
                        name: true,
                        description: true,
                        background: true,
                        theme: true,
                        owner: {
                            select: {
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                        posts: {
                            select: {
                                type: true,
                                userAssignExercise: true,
                            },
                        },
                    },
                },
            },
        });

        return allClasses.map((item) => {
            item.class.posts = item.class.posts
                .filter((post) => post.type === 'Exercise')
                .map((post) => ({
                    ...post,
                    isAssigned: post.userAssignExercise.length > 0,
                }));

            return item.class;
        });
    }

    async getClassDetail(userUuid: string, classUuid: string) {
        try {
            const joinStatus = await this.prisma.userJoinClass.findUnique({
                where: {
                    userUuid_classUuid: {
                        userUuid,
                        classUuid,
                    },
                },
                select: {
                    status: true,
                },
            });

            if (!joinStatus || joinStatus.status !== 'JOINED') {
                throw new ForbiddenException('Bạn chưa tham gia lớp học này');
            }

            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
                include: {
                    owner: {
                        select: {
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    posts: {
                        include: {
                            voteData: {
                                include: {
                                    options: true,
                                },
                            },
                            files: true,
                        },
                    },
                    userJoinClass: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                            status: true,
                        },
                    },
                },
            });

            delete classExist.requireApprove;

            classExist.userJoinClass = classExist.userJoinClass.filter((join) => join.status === 'JOINED');

            classExist.posts = await this.post.getAllPosted(classUuid);

            return classExist;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Error getting class detail');
        }
    }

    async updateClass(updateClassDto: UpdateClassDto, classUuid: string, teacherUuid: string) {
        try {
            // Update class logic here
            if (updateClassDto.password) updateClassDto.password = await argon2.hash(updateClassDto.password);

            const updatedClass = await this.prisma.class.update({
                where: {
                    uuid: classUuid,
                    createdByTeacherUuid: teacherUuid,
                },
                data: updateClassDto,
            });

            return updatedClass;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            }
            throw new ForbiddenException('Error updating class');
        }
    }

    async joinClass(passsword: string, classUuid: string, userUuid: string) {
        const userExist = await this.prisma.user.findUnique({
            where: {
                uuid: userUuid,
            },
        });

        if (!userExist) {
            throw new ForbiddenException('Người dùng không tồn tại');
        }

        try {
            const classExist = await this.prisma.class.findUnique({
                where: { uuid: classUuid },
                select: {
                    password: true,
                    requireApprove: true,
                },
            });

            if (classExist.password) {
                const verify = await argon2.verify(classExist.password, passsword);

                if (!verify) {
                    throw new ForbiddenException('Sai mật khẩu');
                }
            }

            await this.prisma.userJoinClass.create({
                data: {
                    userUuid: userUuid,
                    classUuid,
                    status: classExist.requireApprove ? 'PENDING' : 'JOINED',
                },
            });

            return { message: 'Chờ đợi được chấp thuận' };
        } catch (error) {
            throw new ForbiddenException('Error joining class');
        }
    }

    async responseJoinRequest(teacherUuid: string, classUuid: string, studentUuid: string, approve: boolean) {
        try {
            if (approve) {
                await this.prisma.userJoinClass.update({
                    where: {
                        userUuid_classUuid: {
                            userUuid: studentUuid,
                            classUuid,
                        },
                        class: {
                            createdByTeacherUuid: teacherUuid,
                        },
                    },
                    data: {
                        status: 'JOINED',
                    },
                });

                return { message: 'Chấp thuận' };
            } else {
                await this.prisma.userJoinClass.delete({
                    where: {
                        userUuid_classUuid: {
                            userUuid: studentUuid,
                            classUuid,
                        },
                        class: {
                            createdByTeacherUuid: teacherUuid,
                        },
                    },
                });

                return { message: 'Không chấp thuận' };
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Error responding join request');
        }
    }

    async leaveClass(userUuid: string, classUuid: string) {
        try {
            await this.prisma.userJoinClass.delete({
                where: {
                    userUuid_classUuid: {
                        userUuid,
                        classUuid,
                    },
                },
            });

            return { message: 'Rời lớp thành công' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            }
            throw new ForbiddenException('Error leaving class');
        }
    }

    async deleteClass(classUuid: string, teacherUuid: string) {
        try {
            await this.prisma.class.delete({
                where: {
                    uuid: classUuid,
                    createdByTeacherUuid: teacherUuid,
                },
            });

            return { message: 'Xóa lớp thành công' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            }
            throw new ForbiddenException('Error deleting class');
        }
    }
}
