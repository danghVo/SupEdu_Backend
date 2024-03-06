-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_createdByTeacherUuid_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postUuid_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_postUuid_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_voteDataPostUuid_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_classUuid_fkey";

-- DropForeignKey
ALTER TABLE "UserAssignExercise" DROP CONSTRAINT "UserAssignExercise_postUuid_fkey";

-- DropForeignKey
ALTER TABLE "UserAssignExercise" DROP CONSTRAINT "UserAssignExercise_userUuid_fkey";

-- DropForeignKey
ALTER TABLE "UserChooesOption" DROP CONSTRAINT "UserChooesOption_optionUuid_fkey";

-- DropForeignKey
ALTER TABLE "UserJoinClass" DROP CONSTRAINT "UserJoinClass_classUuid_fkey";

-- DropForeignKey
ALTER TABLE "UserJoinClass" DROP CONSTRAINT "UserJoinClass_userUuid_fkey";

-- DropForeignKey
ALTER TABLE "VoteData" DROP CONSTRAINT "VoteData_postUuid_fkey";

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_createdByTeacherUuid_fkey" FOREIGN KEY ("createdByTeacherUuid") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_voteDataPostUuid_fkey" FOREIGN KEY ("voteDataPostUuid") REFERENCES "VoteData"("postUuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChooesOption" ADD CONSTRAINT "UserChooesOption_optionUuid_fkey" FOREIGN KEY ("optionUuid") REFERENCES "Option"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteData" ADD CONSTRAINT "VoteData_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_classUuid_fkey" FOREIGN KEY ("classUuid") REFERENCES "Class"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignExercise" ADD CONSTRAINT "UserAssignExercise_postUuid_fkey" FOREIGN KEY ("postUuid") REFERENCES "Post"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignExercise" ADD CONSTRAINT "UserAssignExercise_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJoinClass" ADD CONSTRAINT "UserJoinClass_classUuid_fkey" FOREIGN KEY ("classUuid") REFERENCES "Class"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJoinClass" ADD CONSTRAINT "UserJoinClass_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
