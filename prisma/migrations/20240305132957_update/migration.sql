-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_createdByTeacherUuid_fkey";

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_createdByTeacherUuid_fkey" FOREIGN KEY ("createdByTeacherUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
