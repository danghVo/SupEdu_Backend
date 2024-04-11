/*
  Warnings:

  - You are about to drop the column `lastMessaageUuid` on the `GroupChat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupChat" DROP COLUMN "lastMessaageUuid",
ADD COLUMN     "lastMessageUuid" TEXT;
