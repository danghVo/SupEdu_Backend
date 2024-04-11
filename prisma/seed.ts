import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const studentClass = await prisma.apiPermission.upsert({
        where: { id: 0 },
        update: {},
        create: {
            role: 'STUDENT',
            api: 'class',
            action: '-r--',
        },
    });

    const studentExercise = await prisma.apiPermission.upsert({
        where: { id: 1 },
        update: {},
        create: {
            role: 'STUDENT',
            api: 'exercise',
            action: '-r--',
        },
    });

    const studentAssign = await prisma.apiPermission.upsert({
        where: { id: 2 },
        update: {},
        create: {
            role: 'STUDENT',
            api: 'assign-exercise',
            condition: 'userUuid',
            action: 'crud',
        },
    });

    const userComment = await prisma.apiPermission.upsert({
        where: { id: 3 },
        update: {},
        create: {
            role: 'ALL',
            api: 'comment',
            action: 'cr--',
        },
    });

    const studentVoteOption = await prisma.apiPermission.upsert({
        where: { id: 3 },
        update: {},
        create: {
            role: 'STUDENT',
            api: 'vote-option',
            action: 'cru-',
        },
    });

    const teacherClass = await prisma.apiPermission.upsert({
        where: { id: 4 },
        update: {},
        create: {
            role: 'TEACHER',
            condition: 'createdByTeacherUuid',
            api: 'class',
            action: 'crud',
        },
    });

    const teacherPost = await prisma.apiPermission.upsert({
        where: { id: 5 },
        update: {},
        create: {
            role: 'TEACHER',
            api: 'post',
            action: 'crud',
        },
    });

    const teacherExercise = await prisma.apiPermission.upsert({
        where: { id: 6 },
        update: {},
        create: {
            role: 'TEACHER',
            api: 'exercise',
            action: 'crud',
        },
    });

    const teacherVote = await prisma.apiPermission.upsert({
        where: { id: 7 },
        update: {},
        create: {
            role: 'TEACHER',
            api: 'vote',
            action: 'crud',
        },
    });

    const userMessageChat = await prisma.apiPermission.upsert({
        where: { id: 8 },
        update: {},
        create: {
            role: 'ALL',
            condition: 'fromUserUuid',
            api: 'message-chat',
            action: 'crud',
        },
    });

    const teacherPass = await argon2.hash('Cayhuong@123');

    const teacher = await prisma.user.create({
        data: {
            email: 'teacher@gmail.com',
            password: teacherPass,
            role: 'TEACHER',
            name: 'Teacher',
            isVerify: true,
            age: 30,
        },
    });

    const testClass = await prisma.class.create({
        data: {
            name: 'test class',
            description: 'test class description',
            createdByTeacherUuid: teacher.uuid,
            theme: 'from-[#000] to-[#000]',
            requireApprove: false,
        },
    });

    const studentPass = await argon2.hash('Cayhuong@123');

    const student = await prisma.user.create({
        data: {
            email: 'student@gmail.com',
            password: studentPass,
            role: 'STUDENT',
            name: 'student',
            age: 15,
            isVerify: true,
        },
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
    });
