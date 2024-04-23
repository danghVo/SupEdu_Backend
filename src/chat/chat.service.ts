import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as moment from 'moment';
import { SocketGateway } from 'src/socket/socket.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private socket: SocketGateway,
        private notification: NotificationService,
        private aws: AwsService,
    ) {}

    async getAvailChat() {
        try {
            const users = await this.prisma.user.findMany({
                select: {
                    uuid: true,
                },
            });

            const groups = await this.prisma.groupChat.findMany({
                select: {
                    uuid: true,
                },
            });

            return [...users, ...groups];
        } catch (error) {
            console.log(error);
        }
    }

    async getChatInfor(userUuid: string) {
        try {
            const groupChatOfUsers = await this.prisma.userInGroup.findMany({
                where: {
                    userUuid,
                },
                include: {
                    groupChat: {
                        include: {
                            users: {
                                select: {
                                    userUuid: true,
                                },
                            },
                        },
                    },
                },
            });

            const groupChats = [];

            for await (const data of groupChatOfUsers) {
                if (data.groupChat.lastMessageUuid === null) continue;

                const lastMessage = await this.prisma.message.findUnique({
                    where: {
                        uuid: data.groupChat.lastMessageUuid,
                    },
                    include: {
                        fromUser: {
                            select: {
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                });

                const chatShow =
                    data.groupChat.users.length === 2
                        ? await this.prisma.user.findUnique({
                              where: {
                                  uuid: data.groupChat.users.find((user) => user.userUuid !== userUuid).userUuid,
                              },
                              select: {
                                  uuid: true,
                                  name: true,
                                  avatar: true,
                                  email: true,
                                  role: true,
                              },
                          })
                        : undefined;

                if (chatShow?.avatar) chatShow.avatar = await this.aws.getImage(chatShow.avatar);

                const isRead = await this.prisma.userReadMessage.findUnique({
                    where: {
                        userUuid_messageUuid: {
                            userUuid,
                            messageUuid: data.groupChat.lastMessageUuid,
                        },
                    },
                    select: {
                        readInDate: true,
                    },
                });

                groupChats.push({
                    ...data.groupChat,
                    ...chatShow,
                    lastMessage: {
                        ...lastMessage,
                        isRead: isRead?.readInDate ? true : false,
                    },
                });
            }

            return groupChats.sort((a, b) =>
                moment(a.lastMessage.sendInDate + ' ' + a.lastMessage.sendInTime).isBefore(
                    b.lastMessage.sendInDate + ' ' + b.lastMessage.sendInTime,
                )
                    ? 1
                    : -1,
            );
        } catch (error) {
            console.log(error);
        }
    }

    async getHistoryChat(userUuid: string, withUuid: string) {
        try {
            const groupWithUser = await this.prisma.userInGroup.findMany({
                where: {
                    userUuid: withUuid,
                },
                select: {
                    groupChatUuid: true,
                },
            });

            const group = await this.prisma.userInGroup.findFirst({
                where: {
                    userUuid,
                    groupChatUuid: {
                        in: groupWithUser.map((group) => group.groupChatUuid),
                    },
                },
            });

            const groupChatUuid = group?.groupChatUuid;

            const userExist = await this.prisma.user.findUnique({
                where: {
                    uuid: withUuid,
                },
                select: {
                    name: true,
                    uuid: true,
                    avatar: true,
                    email: true,
                    role: true,
                },
            });

            if (userExist.avatar) {
                userExist.avatar = await this.aws.getImage(userExist.avatar);
            }

            if (!groupChatUuid) {
                return {
                    ...userExist,
                    message: [],
                };
            } else {
                const groupChat = await this.prisma.groupChat.findUnique({
                    where: {
                        uuid: groupChatUuid,
                    },
                    include: {
                        messages: {
                            include: {
                                fromUser: {
                                    select: {
                                        uuid: true,
                                        name: true,
                                        avatar: true,
                                    },
                                },
                            },
                            orderBy: {
                                sendIn: 'asc',
                            },
                        },
                    },
                });

                const now = moment().format('DD-MM-YYYY HH:mm').split(' ');

                await this.prisma.userReadMessage.updateMany({
                    where: {
                        messageUuid: {
                            in: groupChat.messages.map((message) => message.uuid),
                        },
                        message: {
                            fromUserUuid: { not: userUuid },
                        },
                        readInTime: null,
                    },
                    data: {
                        readInTime: now[1],
                        readInDate: now[0],
                    },
                });

                const readLastMessage = await this.prisma.userReadMessage.findFirst({
                    where: {
                        messageUuid: groupChat.lastMessageUuid,
                    },
                    select: {
                        readInDate: true,
                        readInTime: true,
                        user: {
                            select: {
                                avatar: true,
                                role: true,
                            },
                        },
                    },
                });

                return {
                    ...groupChat,
                    ...userExist,
                    uuid: groupChat.uuid,
                    messages: undefined,
                    message: groupChat.messages.map((message) => ({
                        ...message,
                        sendInDate: undefined,
                        sendInTime: undefined,
                        read: message.uuid === groupChat.lastMessageUuid ? readLastMessage : undefined,
                        sendIn: {
                            date: message.sendInDate,
                            time: message.sendInTime,
                        },
                    })),
                };
            }
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Lấy lịch sử chat thất bại');
        }
    }

    async sendMessage(fromUserUuid: string, body: { message: string; toUuid: string }) {
        try {
            let newMessage: { uuid: string; groupChatUuid: string };

            let groupExist: any = await this.prisma.groupChat.findUnique({
                where: {
                    uuid: body.toUuid,
                },
                include: {
                    users: {
                        where: {
                            userUuid: { not: fromUserUuid },
                        },
                        select: {
                            userUuid: true,
                        },
                    },
                },
            });

            const now = moment().format('DD-MM-YYYY HH:mm').split(' ');
            if (!groupExist) {
                await this.prisma.user.findUnique({
                    where: {
                        uuid: body.toUuid,
                    },
                });

                newMessage = await this.prisma.message.create({
                    data: {
                        content: body.message,
                        fromUser: {
                            connect: {
                                uuid: fromUserUuid,
                            },
                        },
                        sendInTime: now[1],
                        sendInDate: now[0],
                    },
                    select: {
                        groupChatUuid: true,
                        uuid: true,
                    },
                });

                const newGroup = await this.prisma.groupChat.create({
                    data: {
                        lastMessageUuid: newMessage.uuid,
                    },
                });

                await this.prisma.message.update({
                    where: {
                        uuid: newMessage.uuid,
                    },
                    data: {
                        groupChatUuid: newGroup.uuid,
                    },
                });

                newMessage.groupChatUuid = newGroup.uuid;

                await this.prisma.userInGroup.createMany({
                    data: [
                        {
                            userUuid: fromUserUuid,
                            groupChatUuid: newGroup.uuid,
                        },
                        {
                            groupChatUuid: newGroup.uuid,
                            userUuid: body.toUuid,
                        },
                    ],
                });

                groupExist = await this.prisma.groupChat.findUnique({
                    where: {
                        uuid: newGroup.uuid,
                    },
                    include: {
                        users: true,
                    },
                });
            } else {
                newMessage = await this.prisma.message.create({
                    data: {
                        content: body.message,
                        fromUserUuid,
                        groupChatUuid: body.toUuid,
                        sendInTime: now[1],
                        sendInDate: now[0],
                    },
                    select: {
                        groupChatUuid: true,
                        uuid: true,
                    },
                });
            }

            const targetGroup = await this.prisma.groupChat.update({
                where: {
                    uuid: newMessage.groupChatUuid,
                },
                data: {
                    lastMessageUuid: newMessage.uuid,
                },
                include: {
                    messages: true,
                    users: true,
                },
            });

            await this.prisma.userReadMessage.createMany({
                data: targetGroup.users
                    .filter((user) => user.userUuid !== fromUserUuid)
                    .map((user) => ({
                        userUuid: user.userUuid,
                        messageUuid: newMessage.uuid,
                    })),
            });

            const fromUser = await this.prisma.user.findUnique({
                where: {
                    uuid: fromUserUuid,
                },
                select: {
                    name: true,
                },
            });

            groupExist.users.forEach((user: { userUuid: string }) => {
                this.notification.createNotification(
                    user.userUuid,
                    user.userUuid,
                    `/chat/${fromUserUuid}`,
                    fromUser.name,
                    'chat',
                    {
                        date: now[0],
                        time: now[1],
                    },
                );
            });

            this.socket.server.emit(`${targetGroup.uuid}/newMessage`, () => {
                return 'Tin nhắn mới';
            });

            targetGroup.users.forEach((user: { userUuid: string }) => {
                this.socket.server.emit(`${user.userUuid}/newMessage`, () => {
                    return 'Tin nhắn mới';
                });
            });

            return { message: 'Gửi tin nhắn thành công' };
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Gửi tin nhắn thất bại');
        }
    }
}
