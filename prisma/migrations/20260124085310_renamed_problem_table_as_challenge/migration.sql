/*
  Warnings:

  - You are about to drop the column `problemId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `Problem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,challengeId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `challengeId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_problemId_fkey";

-- DropIndex
DROP INDEX "Submission_userId_problemId_key";

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "problemId",
ADD COLUMN     "challengeId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Problem";

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "link" TEXT,
    "flag" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_userId_challengeId_key" ON "Submission"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
