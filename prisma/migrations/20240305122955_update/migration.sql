/*
  Warnings:

  - The values [UNJOINED] on the enum `JOINSTATUS` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JOINSTATUS_new" AS ENUM ('PENDING', 'JOINED');
ALTER TABLE "UserJoinClass" ALTER COLUMN "status" TYPE "JOINSTATUS_new" USING ("status"::text::"JOINSTATUS_new");
ALTER TYPE "JOINSTATUS" RENAME TO "JOINSTATUS_old";
ALTER TYPE "JOINSTATUS_new" RENAME TO "JOINSTATUS";
DROP TYPE "JOINSTATUS_old";
COMMIT;
