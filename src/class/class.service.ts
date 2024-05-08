import { UpdateClassDto } from './dto/updateClass.dto';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { CreateClassDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AwsService } from 'src/aws/aws.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class ClassService {
    constructor(
        private prisma: PrismaService,
        private aws: AwsService,
        private socket: SocketGateway,
    ) {}

    async createClass(createClassDto: CreateClassDto, teacherUuid: string) {
        try {

            const newClass = await this.prisma.class.create({
                data: {
                    name: createClassDto.name,
                    ownerUuid: teacherUuid,
                    description: createClassDto.description || null,
                    theme: createClassDto.theme,
                    textColor: createClassDto.textColor,
                    password: createClassDto.password,
                    requireApprove: createClassDto.requireApprove === 'true' ? true : false,
                },
            });

            return newClass;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Error creating class');
        }
    }

    async getAllClasses() {
        try {
            // Get all classes logic here
            const allClasses = await this.prisma.class.findMany({
                select: {
                    uuid: true,
                },
            });

            return allClasses;
        } catch (error) {
            throw new ForbiddenException('Có lỗi xảy ra');
        }
    }

    async getCalender(classUuid: string) {
        try {
            const allPostHaveExpired = await this.prisma.post.findMany({
                where: {
                    classUuid,
                    endInTime: { not: null },
                },
                select: {
                    endInDate: true,
                },
            });

            return allPostHaveExpired.map((post) => post.endInDate);
        } catch (error) {
            throw new ForbiddenException('Có lỗi xảy ra');
        }
    }

    async getAllWaitingClasses(uuid: string) {
        try {
            const allWaitingClasses = await this.prisma.class.findMany({
                where: {
                    userJoinClass: {
                        some: {
                            userUuid: uuid,
                            status: 'PENDING',
                        },
                    },
                },
                select: {
                    uuid: true,
                    name: true,
                    description: true,
                    theme: true,
                    owner: {
                        select: {
                            uuid: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            const classessConvert = [];
            const ownerUuids = allWaitingClasses.reduce(
                (accu, classItem) => ({ ...accu, [classItem.owner.uuid]: '' }),
                {},
            );

            for (const classItem of allWaitingClasses) {
                if (classItem.owner.avatar) {
                    if (ownerUuids[classItem.owner.uuid] === '') {
                        classItem.owner.avatar = await this.aws.getImage(classItem.owner.avatar);
                        ownerUuids[classItem.owner.uuid] = classItem.owner.avatar;
                    } else {
                        classItem.owner.avatar = ownerUuids[classItem.owner.uuid];
                    }
                }

                classessConvert.push({
                    ...classItem,
                    exercises: [],
                    theme: {
                        from: classItem.theme.split(' ')[0].slice(6, -1),
                        to: classItem.theme.split(' ')[1].slice(4, -1),
                    },
                });
            }

            return classessConvert;
        } catch (error) {
            throw new ForbiddenException('Error getting classes');
        }
    }

    async getAllOwnClasses(uuid: string) {
        try {
            // Get all classes of teacher logic here
            const allClasses = await this.prisma.class.findMany({
                where: {
                    ownerUuid: uuid,
                },
                select: {
                    uuid: true,
                    name: true,
                    description: true,
                    theme: true,
                    owner: {
                        select: {
                            uuid: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            const classessConvert = [];
            const ownerUuids = allClasses.reduce((accu, classItem) => ({ ...accu, [classItem.owner.uuid]: '' }), {});

            for (const classItem of allClasses) {
                if (classItem.owner.avatar) {
                    if (ownerUuids[classItem.owner.uuid] === '') {
                        classItem.owner.avatar = await this.aws.getImage(classItem.owner.avatar);
                        ownerUuids[classItem.owner.uuid] = classItem.owner.avatar;
                    } else {
                        classItem.owner.avatar = ownerUuids[classItem.owner.uuid];
                    }
                }

                classessConvert.push({
                    ...classItem,
                    exercises: [],
                    theme: {
                        from: classItem.theme.split(' ')[0].slice(6, -1),
                        to: classItem.theme.split(' ')[1].slice(4, -1),
                    },
                });
            }

            return classessConvert;
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
                        uuid: true,
                        name: true,
                        description: true,
                        theme: true,
                        owner: {
                            select: {
                                uuid: true,
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

        const ownerUuids = allClasses.reduce((accu, classItem) => ({ ...accu, [classItem.class.owner.uuid]: '' }), {});

        for await (const classOfUser of allClasses) {
            if (classOfUser.class.owner.avatar) {
                if (ownerUuids[classOfUser.class.owner.uuid] === '') {
                    classOfUser.class.owner.avatar = await this.aws.getImage(classOfUser.class.owner.avatar);
                    ownerUuids[classOfUser.class.owner.uuid] = classOfUser.class.owner.avatar;
                } else {
                    classOfUser.class.owner.avatar = ownerUuids[classOfUser.class.owner.uuid];
                }
            }
        }

        return allClasses.map((item) => {
            const excercise = item.class.posts
                .filter((post) => post.type === 'Exercise')
                .map((post) => ({
                    ...post,
                    isAssigned: post.userAssignExercise.length > 0,
                }));

            return {
                ...item.class,
                excercise,
                posts: undefined,
                theme: {
                    from: item.class.theme.split(' ')[0].slice(6, -1),
                    to: item.class.theme.split(' ')[1].slice(4, -1),
                },
            };
        });
    }

    async getClassDetail(userUuid: string, classUuid: string) {
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

        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
                include: {
                    owner: {
                        select: {
                            uuid: true,
                            name: true,
                            email: true,
                            avatar: true,
                            role: true,
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
                },
            });

            if (userUuid !== classExist.owner.uuid) {
                delete classExist.requireApprove;
            }


            if (classExist.owner.avatar) {
                classExist.owner.avatar = await this.aws.getImage(classExist.owner.avatar);
            }

            return {
                ...classExist,
                status: joinStatus ? joinStatus.status : 'UNJOINED',
                isPassword: classExist.password ? true : false,
                showPassword: userUuid === classExist.ownerUuid ?  classExist.password  : undefined,
                isOwner: classExist.owner.uuid === userUuid,
                posts: joinStatus?.status !== 'JOINED' ? [] : classExist.posts,
                theme: {
                    from: classExist.theme.split(' ')[0].slice(6, -1),
                    to: classExist.theme.split(' ')[1].slice(4, -1),
                },
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Error getting class detail');
        }
    }

    async getMembersOfClass(classUuid: string, ownerUuid: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            const members = await this.prisma.userJoinClass.findMany({
                where: {
                    classUuid,
                    status: ownerUuid !== classExist.ownerUuid ? 'JOINED' : undefined,
                },
                include: {
                    user: {
                        select: {
                            uuid: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            const memberUuids = members.reduce(
                (accu, curr) => ({
                    ...accu,
                    [curr.user.uuid]: '',
                }),
                {},
            );

            for await (const member of members) {
                if (member.user.avatar) {
                    if (memberUuids[member.user.uuid] === '') {
                        member.user.avatar = await this.aws.getImage(member.user.avatar);
                        memberUuids[member.user.uuid] = member.user.avatar;
                    } else {
                        member.user.avatar = memberUuids[member.user.uuid];
                    }
                }
            }

            return members;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Error getting class detail');
        }
    }

    async updateClass(ownerUuid: string, updateClassDto: UpdateClassDto, classUuid: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            const updatedClass = await this.prisma.class.update({
                where: {
                    uuid: classUuid,
                },
                data: updateClassDto,
            });


            this.socket.server.emit(`${classUuid}`, () => {
                return { message: 'Lớp đã được cập nhật' };
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

    async setUpClassForUser(classUuid: string, userUuid: string) {
        const allPostInClass = await this.prisma.post.findMany({
            where: {
                classUuid,
            },
            include: {
                voteData: true,
            },
        });

        const allExercise = allPostInClass.filter((post) => post.type === 'Exercise');
        const allVote = allPostInClass.filter((post) => post.type === 'Vote');

        if (allExercise.length > 0) {
            for await (const exercise of allExercise) {
                await this.prisma.userAssignExercise.create({
                    data: {
                        userUuid,
                        postUuid: exercise.uuid,
                        feedback: '',
                        score: 0,
                    },
                });
            }
        }

        if (allVote.length > 0) {
            for await (const vote of allVote) {
                await this.prisma.userChooesOption.create({
                    data: {
                        voteUuid: vote.voteData.uuid,
                        userUuid,
                    },
                });
            }
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

        const classExist = await this.prisma.class.findUnique({
            where: { uuid: classUuid },
            select: {
                password: true,
                requireApprove: true,
            },
        });

        if (classExist.password) {
            const verify = classExist.password === passsword;

            if (!verify) {
                throw new ForbiddenException('Sai mật khẩu');
            }
        }

        try {
            await this.prisma.userJoinClass.create({
                data: {
                    userUuid: userUuid,
                    classUuid,
                    status: classExist.requireApprove ? 'PENDING' : 'JOINED',
                },
            });

            if (!classExist.requireApprove) {
                await this.setUpClassForUser(classUuid, userUuid);
            }

            this.socket.server.emit(`${classUuid}/member`, () => {
                return { message: 'Thành viên vừa tham gia lớp' };
            });

            return { status: classExist.requireApprove ? 'PENDING' : 'JOINED' };
        } catch (error) {
            throw new ForbiddenException(error.message || 'Có lỗi xảy ra');
        }
    }

    async responseJoinRequest(ownerUuid: string, classUuid: string, studentUuid: string, approve: boolean) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            if (approve) {
                const userJoinClass = await this.prisma.userJoinClass.update({
                    where: {
                        userUuid_classUuid: {
                            userUuid: studentUuid,
                            classUuid,
                        },
                    },
                    data: {
                        status: 'JOINED',
                    },
                });

                await this.setUpClassForUser(classUuid, userJoinClass.userUuid);

                this.socket.server.emit(`${classUuid}/member`, () => {
                    return { message: 'Thành viên vừa tham gia lớp' };
                });

                this.socket.server.emit(`${studentUuid}/requestClass`, () => {
                    return true;
                });

                return { message: 'Chấp thuận' };
            } else {
                await this.prisma.userJoinClass.delete({
                    where: {
                        userUuid_classUuid: {
                            userUuid: studentUuid,
                            classUuid,
                        },
                    },
                });

                this.socket.server.emit(`${classUuid}`, () => {
                    return { message: 'Không chấp thuận tham gia lớp' };
                });

                this.socket.server.emit(`${studentUuid}/requestClass`, () => {
                    return false;
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

    async addMemberToClass(ownerUuid: string, classUuid: string, email: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            const userExist = await this.prisma.user.findUniqueOrThrow({
                where: { email },
                select: {
                    uuid: true,
                },
            });

            await this.prisma.userJoinClass.upsert({
                where: {
                    userUuid_classUuid: {
                        userUuid: userExist.uuid,
                        classUuid,
                    },
                },
                create: {
                    userUuid: userExist.uuid,
                    classUuid,
                    status: 'JOINED',
                },
                update: {
                    status: 'JOINED',
                },
            });

            await this.setUpClassForUser(classUuid, userExist.uuid);

            this.socket.server.emit(`${classUuid}/member`, () => {
                return { message: 'Có thành viên mới' };
            });

            this.socket.server.emit(`${userExist.uuid}/addToClass`, () => {
                return { message: 'Đã được thêm vào lớp' };
            });

            return { message: 'Thêm thành viên thành công' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Người dùng không tồn tại');
                }
            } else throw new ForbiddenException('Có lỗi xảy ra');
        }
    }

    async removeMemberFromClass(ownerUuid: string, classUuid: string, userUuid: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            await this.prisma.userJoinClass.delete({
                where: {
                    userUuid_classUuid: {
                        userUuid,
                        classUuid,
                    },
                },
            });

            await this.prisma.userAssignExercise.deleteMany({
                where: {
                    userUuid,
                },
            });

            await this.prisma.userChooesOption.deleteMany({
                where: {
                    userUuid,
                },
            });

            this.socket.server.emit(`${classUuid}/member`, () => {
                return { message: 'Xóa thành viên khỏi lớp' };
            });

            this.socket.server.emit(`${userUuid}/removed`, () => {
                return { message: 'Xóa thành viên khỏi lớp' };
            });

            return { message: 'Xóa thành viên thành công' };
        } catch (error) {
            throw new ForbiddenException('Có lỗi xảy ra');
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

            const userAssigns = await this.prisma.userAssignExercise.findMany({
                where: {
                    userUuid,
                    post: {
                        classUuid,
                    },
                },
                select: {
                    assignFiles: true,
                },
            });

            for await (const assign of userAssigns) {
                await this.aws.deleteFiles(assign.assignFiles.map((file) => file.uuid));
            }

            await this.prisma.userAssignExercise.deleteMany({
                where: {
                    userUuid,
                    post: {
                        classUuid,
                    },
                },
            });

            await this.prisma.userChooesOption.deleteMany({
                where: {
                    userUuid,
                    Vote: {
                        post: {
                            classUuid,
                        },
                    },
                },
            });

            this.socket.server.emit(`${classUuid}/member`, () => {
                return { message: 'Thành viên đã khỏi lớp' };
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

    async deleteClass(classUuid: string, ownerUuid: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            await this.prisma.class.delete({
                where: {
                    uuid: classUuid,
                    ownerUuid: ownerUuid,
                },
            });

            this.socket.server.emit(`${classUuid}`, () => {
                return { message: 'Đã xóa lớp' };
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
