import { Injectable, ForbiddenException } from '@nestjs/common';
import { CommentDto, CreatePostDto, UpdatePostDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AwsService } from 'src/aws/aws.service';
import * as moment from 'moment';
import { SubmitExerciseDto } from './dto/submitExercise.dto';
import { MarkScoreDto } from './dto/markScore.dto';
import { NotificationService } from 'src/notification/notification.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { createHash } from 'crypto';

@Injectable()
export class PostService {
    constructor(
        private prisma: PrismaService,
        private aws: AwsService,
        private notification: NotificationService,
        private socket: SocketGateway,
    ) {}

    convertPostTime(post: any) {
        return {
            ...post,
            postInDate: undefined,
            postInTime: undefined,
            endInDate: undefined,
            endInTime: undefined,
            timePost: {
                time: post.postInTime,
                date: post.postInDate,
            },
            timeTaskEnd: {
                time: post.endInTime,
                date: post.endInDate,
            },
        };
    }

    async checkExistPost(postUuid: string) {
        try {
            const post = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
            });

            return post;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Bài đăng không tồn tại hoặc đã bị xóa');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
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

            let i = 0;
            for await (const post of allPost) {
                if (post.files.length > 0 && post.type === 'Announcement') {
                    post.files = await this.aws.getFiles(post.files);
                }
                allPost[i++] = post;
            }

            return allPost
                .sort((a, b) => {
                    if (moment(a.createdAt).isBefore(moment(b.createdAt))) {
                        return 1;
                    } else {
                        return -1;
                    }
                })
                .map((post) => this.convertPostTime(post));
        } catch (error) {
            console.log(error);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getAllExercise(classUuid: string) {
        try {
            const allExercises = await this.prisma.post.findMany({
                where: {
                    classUuid,
                    type: 'Exercise',
                },
            });

            return allExercises
                .sort((a, b) => {
                    if (moment(a.createdAt).isBefore(moment(b.createdAt))) {
                        return 1;
                    } else {
                        return -1;
                    }
                })
                .map((exercise) => this.convertPostTime(exercise));
        } catch (error) {
            console.log(error);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getExercise(postUuid: string, userUuid: string) {
        try {
            const exercise = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
                include: {
                    files: true,
                    userAssignExercise: {
                        where: {
                            userUuid,
                        },
                        include: {
                            assignFiles: true,
                        },
                    },
                },
            });

            if (exercise.files.length > 0) {
                exercise.files = await this.aws.getFiles(exercise.files);
            }

            return this.convertPostTime({
                ...exercise,
                userAssignExercise: undefined,
                assignment: {
                    ...exercise.userAssignExercise[0],
                    assignInTime: undefined,
                    assignInDate: undefined,
                    timeAssign: {
                        time: exercise.userAssignExercise[0]?.assignInTime,
                        date: exercise.userAssignExercise[0]?.assignInDate,
                    },
                },
            });
        } catch (error) {
            console.log(error);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Bài tập không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getTaskInDate(classUuid: string, date: string) {
        try {
            const posts = await this.prisma.post.findMany({
                where: {
                    classUuid,
                    endInDate: date,
                },
            });

            return posts;
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Lỗi không xác định');
        }
    }

    validPost(postDto: CreatePostDto) {
        if (postDto.type === 'Vote') {
            if (!postDto.voteData || !postDto.timeTaskEnd) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại bình chọn');
            }
        }
        if (postDto.type === 'Exercise') {
            if (postDto.voteData || !postDto.timeTaskEnd || !postDto.content) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại bài tập');
            }
        }
        if (postDto.type === 'Announcement') {
            if (postDto.voteData || !postDto.content) {
                throw new ForbiddenException('Sai dữ liệu cho bài đăng loại thông báo');
            }
        }
    }

    async createPost(ownerUuid: string, classUuid: string, createPostDto: CreatePostDto, files: Express.Multer.File[]) {
        try {
            let warning: String;

            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
                include: {
                    owner: true,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            let voteData = null;
            if (createPostDto.voteData) {
                voteData = JSON.parse(createPostDto.voteData);
            }

            this.validPost(createPostDto);

            const timeTaskEnd = JSON.parse(createPostDto.timeTaskEnd);

            let post = await this.prisma.post.create({
                data: {
                    class: {
                        connect: {
                            uuid: classUuid,
                        },
                    },
                    title: createPostDto.title,
                    content: createPostDto.content,
                    type: createPostDto.type,
                    endInTime: createPostDto.type === 'Announcement' ? null : timeTaskEnd.time,
                    endInDate: createPostDto.type === 'Announcement' ? null : timeTaskEnd.date,
                },
            });

            createPostDto.files = [];
            if (files.length > 0) {
                const hashFiles = JSON.parse(createPostDto.hashFiles) as { [key: string]: string };
                for await (const file of files) {
                    const hashFile = hashFiles[file.originalname];
                    const fileSentHash = createHash('sha256').update(file.buffer).digest('hex');
                    if (hashFile === fileSentHash) {
                        const key = await this.aws.uploadFile(post.uuid, file);
                        const fileSave = {
                            uuid: key,
                            name: file.originalname,
                            extension: file.originalname.split('.').pop(),
                        };
                        createPostDto.files.push(fileSave);
                    } else {
                        warning = `File ${file.originalname} không gửi được. Hãy thử lại`;
                        break;
                    }
                }
            }

            const voteDataCreation = createPostDto.voteData
                ? {
                      voteData: {
                          create: {
                              options: {
                                  createMany: {
                                      data: voteData.options.map((option) => option),
                                  },
                              },
                          },
                      },
                  }
                : {};

            const newPost = await this.prisma.post.update({
                where: {
                    uuid: post.uuid,
                },
                data: {
                    class: {
                        connect: {
                            uuid: classUuid,
                        },
                    },
                    files: {
                        createMany: {
                            data: createPostDto.files.map((file: any) => file),
                        },
                    },
                    ...voteDataCreation,
                },
                select: {
                    voteData: true,
                    type: true,
                    uuid: true,
                },
            });

            let students = await this.prisma.user.findMany({
                where: {
                    userJoinClass: {
                        some: {
                            classUuid,
                        },
                    },
                },
            });

            students = students.filter((student) => student.uuid !== classExist.owner.uuid);
            if (newPost.type === 'Exercise') {
                await this.prisma.userAssignExercise.createMany({
                    data: students.map((student) => ({
                        postUuid: newPost.uuid,
                        userUuid: student.uuid,
                        feedback: '',
                        score: 0,
                    })),
                });
            }

            if (newPost.type === 'Vote') {
                await this.prisma.userChooesOption.createMany({
                    data: students.map((student) => ({
                        voteUuid: newPost.voteData.uuid,
                        userUuid: student.uuid,
                    })),
                });
            }

            const now = moment(moment.now()).format('DD-MM-YYYY HH:mm');

            for await (const student of students) {
                await this.notification.createNotification(
                    student.uuid,
                    classUuid,
                    `/class/${classUuid}${newPost.type === 'Exercise' ? '/exercise/' : '/post#'}${newPost.uuid}`,
                    classExist.name,
                    'post',
                    {
                        time: now.split(' ')[1],
                        date: now.split(' ')[0],
                    },
                    newPost.type,
                );
            }

            this.socket.server.emit(classUuid, () => {
                return 'New post';
            });

            return { warning, ...newPost };
        } catch (error) {
            console.log(error);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Lớp không tồn tại');
                }
            } else if (error instanceof ForbiddenException) {
                throw error;
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async deletePost(ownerUuid: string, classUuid: string, postUuid: string) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            const postExist = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
                include: {
                    files: true,
                },
            });

            await this.aws.deleteFiles(postExist.files.map((file) => file.uuid));

            await this.prisma.post.delete({
                where: {
                    uuid: postUuid,
                },
            });

            this.socket.server.emit(classUuid, () => {
                return 'Delete post';
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

    async updatePost(
        ownerUuid: string,
        classUuid: string,
        postUuid: string,
        updatePostDto: UpdatePostDto,
        files: Express.Multer.File[],
    ) {
        try {
            let warning: string;

            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            const postExist = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
                select: {
                    uuid: true,
                    type: true,
                    files: true,
                },
            });

            const filesUpdate = JSON.parse(updatePostDto.filesUpdate) as Array<string>;

            const filesDelete = postExist.files
                .filter((file) => filesUpdate.find((uuid) => uuid === file.uuid) === undefined)
                .map((file) => file.uuid);

            if (filesDelete.length > 0) {
                await this.aws.deleteFiles(filesDelete);
                await this.prisma.file.deleteMany({
                    where: {
                        uuid: {
                            in: filesDelete,
                        },
                    },
                });
            }

            if (files.length > 0) {
                const newFiles = [];
                const hashFiles = JSON.parse(updatePostDto.hashFiles) as { [key: string]: string };
                for await (const file of files) {
                    const hashFile = hashFiles[file.originalname];
                    const fileSentHash = createHash('sha256').update(file.buffer).digest('hex');
                    if (hashFile !== fileSentHash) {
                        warning = `File ${file.originalname} không gửi được. Hãy thử lại`;
                        break;
                    }
                    const key = await this.aws.uploadFile(postUuid, file);
                    const fileSave = {
                        uuid: key,
                        name: file.originalname,
                        extension: file.originalname.split('.').pop(),
                    };
                    newFiles.push(fileSave);
                }

                await this.prisma.post.update({
                    where: {
                        uuid: postUuid,
                    },
                    data: {
                        files: {
                            createMany: {
                                data: newFiles.map((file: any) => file),
                            },
                        },
                    },
                });
            }

            if (updatePostDto.content) {
                await this.prisma.post.update({
                    where: {
                        uuid: postUuid,
                    },
                    data: {
                        content: updatePostDto.content,
                    },
                });
            }

            if (updatePostDto.title) {
                await this.prisma.post.update({
                    where: {
                        uuid: postUuid,
                    },
                    data: {
                        title: updatePostDto.title,
                    },
                });
            }

            if (updatePostDto.timeTaskEnd) {
                const timeTaskEnd = JSON.parse(updatePostDto.timeTaskEnd);
                await this.prisma.post.update({
                    where: {
                        uuid: postUuid,
                    },
                    data: {
                        endInTime: timeTaskEnd.time,
                        endInDate: timeTaskEnd.date,
                    },
                });
            }

            if (updatePostDto.voteData) {
                const voteData = JSON.parse(updatePostDto.voteData);
                const newOption = voteData.options.filter((option) => option.uuid === undefined);
                const oldOption = voteData.options.filter((option) => option.uuid !== undefined);

                await this.prisma.option.deleteMany({
                    where: {
                        uuid: { notIn: oldOption.map((option) => option?.uuid) },
                    },
                });

                await this.prisma.voteData.update({
                    where: {
                        uuid: voteData.uuid,
                    },
                    data: {
                        options: {
                            createMany: {
                                data: newOption.filter((option) => option.uuid === undefined),
                            },
                        },
                    },
                });
            }

            this.socket.server.emit(classUuid, () => {
                return 'Update post';
            });

            if (postExist.type === 'Exercise') {
                this.socket.server.emit(`${classUuid}/${postExist.uuid}`, () => {
                    return 'Update post';
                });
            }

            return { warning, message: 'Cập nhật bài đăng thành công' };
        } catch (error) {
            console.log(error);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Bài đăng không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getAllSubmit(postUuid: string) {
        try {
            const data = await this.prisma.userAssignExercise.findMany({
                where: {
                    postUuid,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            avatar: true,
                        },
                    },
                    assignFiles: true,
                },
            });

            const res = data.filter((assign) => assign.assignInTime);

            let i = 0;
            for await (const assign of data) {
                if (assign.assignFiles.length > 0) {
                    assign.assignFiles = await this.aws.getFiles(assign.assignFiles);
                }
                if (assign.user.avatar) {
                    assign.user.avatar = await this.aws.getImage(assign.user.avatar);
                }

                res[i++] = assign;
            }

            return res.map((assign) => ({
                ...assign,
                assignInTime: undefined,
                assignInDate: undefined,
                timeAssign: {
                    time: assign.assignInTime,
                    date: assign.assignInDate,
                },
            }));
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Bài đăng không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async submitExercise(postUuid: string, userUuid: string, body: SubmitExerciseDto, files: Express.Multer.File[]) {
        try {
            let firstAssign = true;
            const timeAssign = JSON.parse(body.timeAssign);
            const user = await this.prisma.user.findUniqueOrThrow({
                where: {
                    uuid: userUuid,
                },
                select: {
                    name: true,
                },
            });

            const post = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
                select: {
                    uuid: true,
                    endInDate: true,
                    endInTime: true,
                    class: {
                        select: {
                            uuid: true,
                            ownerUuid: true,
                        },
                    },
                },
            });

            const assignExist = await this.prisma.userAssignExercise.findFirst({
                where: {
                    postUuid,
                    userUuid,
                },
                include: {
                    assignFiles: true,
                },
            });

            if (assignExist.assignFiles.length > 0) {
                firstAssign = false;
            }

            let filesSave = [];
            if (files.length > 0) {
                const hashFiles = JSON.parse(body.hashFiles) as { [key: string]: string };

                for await (const file of files) {
                    const hashFile = hashFiles[file.originalname];
                    const fileSentHash = createHash('sha256').update(file.buffer).digest('hex');
                    if (hashFile !== fileSentHash) {
                        throw new ForbiddenException('Nộp bài thất bại');
                    }
                    const key = await this.aws.uploadFile(`${postUuid}/${userUuid}/assign`, file);
                    const fileSave = {
                        uuid: key,
                        name: file.originalname,
                        extension: file.originalname.split('.').pop(),
                    };
                    filesSave.push(fileSave);
                }
            }

            const status = moment(post.endInDate + 'T' + post.endInTime).isBefore(
                moment(timeAssign.date + 'T' + timeAssign.time),
            )
                ? 'LATE'
                : 'ONTIME';

            await this.prisma.userAssignExercise.update({
                where: {
                    uuid: body.uuid,
                    postUuid: postUuid,
                    userUuid: userUuid,
                },
                data: {
                    assignInDate: timeAssign.date,
                    assignInTime: timeAssign.time,
                    assignFiles: filesSave.length > 0 ? { createMany: { data: filesSave } } : undefined,
                    status,
                },
            });

            const now = moment().format('DD-MM-YYYY HH:mm');

            if (firstAssign) {
                await this.notification.createNotification(
                    post.class.ownerUuid,
                    post.class.ownerUuid,
                    `/class/${post.class.uuid}/exercise/${post.uuid}`,
                    user.name,
                    'assignment',
                    {
                        time: now.split(' ')[1],
                        date: now.split(' ')[0],
                    },
                );
            }

            return { message: 'Nộp bài thành công' };
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bài tập');
                }
            } else if (error instanceof ForbiddenException) {
                throw error;
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getVoteData(voteUuid: string, userUuid: string) {
        try {
            const voteData = await this.prisma.voteData.findUnique({
                where: {
                    uuid: voteUuid,
                },
                include: {
                    UserChooesOption: true,
                    options: true,
                },
            });

            const optionOfUser = await this.prisma.userChooesOption.findUnique({
                where: {
                    userUuid_voteUuid: {
                        userUuid,
                        voteUuid,
                    },
                },
                select: {
                    optionUuid: true,
                },
            });

            const options = {};

            const total = voteData.UserChooesOption.filter((choose) => choose.optionUuid).length;

            for (const option of voteData.options) {
                options[option.uuid] =
                    (voteData.UserChooesOption.filter((choose) => choose.optionUuid === option.uuid).length * 100) /
                    total;
            }

            return { options, choose: optionOfUser?.optionUuid || null };
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bình chọn');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async chooseOption(voteUuid: string, userUuid: string, optionUuid?: string) {
        try {
            await this.prisma.voteData.findUniqueOrThrow({
                where: {
                    uuid: voteUuid,
                },
            });

            if (optionUuid) {
                const option = await this.prisma.option.findUnique({
                    where: {
                        uuid: optionUuid,
                    },
                });

                if (option.uuid !== optionUuid) {
                    throw new ForbiddenException('Không tìm thấy lựa chọn');
                }
            }

            await this.prisma.userChooesOption.upsert({
                where: {
                    userUuid_voteUuid: {
                        userUuid,
                        voteUuid,
                    },
                },
                create: {
                    voteUuid,
                    userUuid,
                    optionUuid,
                },
                update: {
                    option: optionUuid ? { connect: { uuid: optionUuid } } : { disconnect: true },
                },
            });

            this.socket.server.emit(`${voteUuid}`, () => {
                return 'Choose option';
            });

            return { message: 'Chọn lựa chọn thành công' };
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bình chọn');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async markScore(ownerUuid: string, classUuid: string, submitUuid: string, body: MarkScoreDto) {
        try {
            const classExist = await this.prisma.class.findUnique({
                where: {
                    uuid: classUuid,
                },
            });

            if (classExist.ownerUuid !== ownerUuid) {
                throw new ForbiddenException('Không có quyền truy cập');
            }

            const assign = await this.prisma.userAssignExercise.update({
                where: {
                    uuid: submitUuid,
                },
                data: {
                    score: parseInt(body.score),
                    feedback: body.feedback,
                    isMarked: true,
                },
                select: {
                    postUuid: true,
                    userUuid: true,
                    post: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            const now = moment().format('DD-MM-YYYY HH:mm');

            await this.notification.createNotification(
                assign.userUuid,
                assign.userUuid,
                `/class/${classUuid}/exercise/${assign.postUuid}`,
                assign.post.title,
                'mark',
                {
                    time: now.split(' ')[1],
                    date: now.split(' ')[0],
                },
            );

            this.socket.server.emit(`${classUuid}/${assign.postUuid}`, () => {
                return 'Mark score';
            });

            return { message: 'Đã cập nhật điểm' };
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bài tập');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async getComments(postUuid: string) {
        try {
            const comments = await this.prisma.comment.findMany({
                where: {
                    postUuid,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            avatar: true,
                            role: true,
                        },
                    },
                },
            });

            const userUuids = comments.reduce(
                (accu, curr) => ({
                    ...accu,
                    [curr.user.avatar]: '',
                }),
                {},
            );

            for await (const comment of comments) {
                if (comment.user.avatar) {
                    if (!userUuids[comment.user.avatar]) {
                        comment.user.avatar = await this.aws.getImage(comment.user.avatar);
                        userUuids[comment.user.avatar] = comment.user.avatar;
                    } else {
                        comment.user.avatar = userUuids[comment.user.avatar];
                    }
                }
            }

            return comments.map((comment) => ({
                ...comment,
                createdInDate: undefined,
                createdInTime: undefined,
                createIn: {
                    time: comment.createdInTime,
                    date: comment.createdInDate,
                },
            }));
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bài đăng');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async comment(postUuid: string, userUuid: string, payload: CommentDto) {
        try {
            const post = await this.prisma.post.findUniqueOrThrow({
                where: {
                    uuid: postUuid,
                },
            });

            await this.prisma.comment.create({
                data: {
                    postUuid,
                    userUuid,
                    createdInDate: payload.createIn.date,
                    createdInTime: payload.createIn.time,
                    content: payload.content,
                },
            });

            this.socket.server.emit(`${postUuid}/comments`, () => {
                return 'New comment';
            });

            return { message: 'Bình luận thành công' };
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Không tìm thấy bài đăng');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }
}
