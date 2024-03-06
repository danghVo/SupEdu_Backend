/*
  Warnings:

  - Made the column `voteDataPostUuid` on table `Option` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Option" ALTER COLUMN "voteDataPostUuid" SET NOT NULL,
ALTER COLUMN "percent" SET DEFAULT 0;
