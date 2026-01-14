-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileUrl" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
