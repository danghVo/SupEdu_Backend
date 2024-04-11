/*
  Warnings:

  - You are about to drop the column `acquaintanceOfId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `groupChatUuid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userUuid` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_acquaintanceOfId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_groupChatUuid_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "acquaintanceOfId",
DROP COLUMN "groupChatUuid",
DROP COLUMN "userUuid";

-- CreateTable
CREATE TABLE "UserInGroup" (
    "userUuid" TEXT NOT NULL,
    "groupChatUuid" TEXT NOT NULL,

    CONSTRAINT "UserInGroup_pkey" PRIMARY KEY ("userUuid","groupChatUuid")
);

-- AddForeignKey
ALTER TABLE "UserInGroup" ADD CONSTRAINT "UserInGroup_groupChatUuid_fkey" FOREIGN KEY ("groupChatUuid") REFERENCES "GroupChat"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInGroup" ADD CONSTRAINT "UserInGroup_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
