-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOWNLOAD', 'RESOURCE', 'CHALLENGE');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "fileType" "FileType" NOT NULL DEFAULT 'CHALLENGE';
