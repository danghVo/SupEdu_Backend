/*
  Warnings:

  - Added the required column `classUuid` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "classUuid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_classUuid_fkey" FOREIGN KEY ("classUuid") REFERENCES "Class"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
