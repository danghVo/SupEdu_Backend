-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_fromUserUuid_fkey";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromUserUuid_fkey" FOREIGN KEY ("fromUserUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
