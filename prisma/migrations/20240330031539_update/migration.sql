-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('Exercise', 'Announcement', 'Vote');

-- CreateEnum
CREATE TYPE "JOINSTATUS" AS ENUM ('PENDING', 'JOINED');

-- CreateEnum
CREATE TYPE "PertmissionRole" AS ENUM ('TEACHER', 'STUDENT', 'ALL');

-- CreateEnum
CREATE TYPE "AssignStatus" AS ENUM ('ONTIME', 'LATE');

-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "avatar" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "refreshToken" TEXT,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acquaintanceOfId" TEXT,
    "groupChatUuid" TEXT,
    "userUuid" TEXT,
    "isVerify" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Notification" (
    "uuid" TEXT NOT NULL,
    "userUuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT NOT NULL,
    "createdInTime" TEXT NOT NULL,
    "createdInDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Class" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "password" TEXT,
    "theme" TEXT,
    "textColor" TEXT DEFAULT 'black',
    "requireApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdByTeacherUuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "File" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extension" TEXT NOT NULL,
    "postUuid" TEXT,
    "userAssignExerciseUuid" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Comment" (
    "uuid" TEXT NOT NULL,
    "userUuid" TEXT NOT NULL,
    "postUuid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdInTime" TEXT NOT NULL,
    "createdInDate" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Option" (
    "uuid" TEXT NOT NULL,
    "voteUuid" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "UserChooesOption" (
    "userUuid" TEXT NOT NULL,
    "optionUuid" TEXT,
    "voteUuid" TEXT NOT NULL,

    CONSTRAINT "UserChooesOption_pkey" PRIMARY KEY ("userUuid","voteUuid")
);

-- CreateTable
CREATE TABLE "VoteData" (
    "uuid" TEXT NOT NULL,
    "postUuid" TEXT NOT NULL,

    CONSTRAINT "VoteData_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Post" (
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" "PostType" NOT NULL,
    "postInTime" TEXT NOT NULL,
    "postInDate" TEXT NOT NULL,
    "endInTime" TEXT,
    "endInDate" TEXT,
    "classUuid" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "UserAssignExercise" (
    "uuid" TEXT NOT NULL,
    "postUuid" TEXT NOT NULL,
    "userUuid" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "AssignStatus",
    "isMarked" BOOLEAN NOT NULL DEFAULT false,
    "assignInTime" TEXT,
    "assignInDate" TEXT,

    CONSTRAINT "UserAssignExercise_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "UserJoinClass" (
    "userUuid" TEXT NOT NULL,
    "classUuid" TEXT NOT NULL,
    "status" "JOINSTATUS" NOT NULL,

    CONSTRAINT "UserJoinClass_pkey" PRIMARY KEY ("userUuid","classUuid")
);

-- CreateTable
CREATE TABLE "ApiPermission" (
    "id" SERIAL NOT NULL,
    "api" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "role" "PertmissionRole" NOT NULL,
    "condition" TEXT,

    CONSTRAINT "ApiPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChat" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastMessaageUuid" TEXT,

    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "UserReadMessage" (
    "userUuid" TEXT NOT NULL,
    "messageUuid" TEXT NOT NULL,
    "readInTime" TEXT,
    "readInDate" TEXT,

    CONSTRAINT "UserReadMessage_pkey" PRIMARY KEY ("userUuid","messageUuid")
);

-- CreateTable
CREATE TABLE "Message" (
    "uuid" TEXT NOT NULL,
    "fromUserUuid" TEXT,
    "content" TEXT NOT NULL,
    "sendInTime" TEXT NOT NULL,
    "sendInDate" TEXT NOT NULL,
    "groupChatUuid" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VoteData_postUuid_key" ON "VoteData"("postUuid");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_acquaintanceOfId_fkey" FOREIGN KEY ("acquaintanceOfId") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupChatUuid_fkey" FOREIGN KEY ("groupChatUuid") REFERENCES "GroupChat"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_createdByTeacherUuid_fkey" FOREIGN KEY ("createdByTeacherUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userAssignExerciseUuid_fkey" FOREIGN KEY ("userAssignExerciseUuid") REFERENCES "UserAssignExercise"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_voteUuid_fkey" FOREIGN KEY ("voteUuid") REFERENCES "VoteData"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChooesOption" ADD CONSTRAINT "UserChooesOption_voteUuid_fkey" FOREIGN KEY ("voteUuid") REFERENCES "VoteData"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChooesOption" ADD CONSTRAINT "UserChooesOption_optionUuid_fkey" FOREIGN KEY ("optionUuid") REFERENCES "Option"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChooesOption" ADD CONSTRAINT "UserChooesOption_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteData" ADD CONSTRAINT "VoteData_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_classUuid_fkey" FOREIGN KEY ("classUuid") REFERENCES "Class"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignExercise" ADD CONSTRAINT "UserAssignExercise_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignExercise" ADD CONSTRAINT "UserAssignExercise_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJoinClass" ADD CONSTRAINT "UserJoinClass_classUuid_fkey" FOREIGN KEY ("classUuid") REFERENCES "Class"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJoinClass" ADD CONSTRAINT "UserJoinClass_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadMessage" ADD CONSTRAINT "UserReadMessage_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadMessage" ADD CONSTRAINT "UserReadMessage_messageUuid_fkey" FOREIGN KEY ("messageUuid") REFERENCES "Message"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromUserUuid_fkey" FOREIGN KEY ("fromUserUuid") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupChatUuid_fkey" FOREIGN KEY ("groupChatUuid") REFERENCES "GroupChat"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
