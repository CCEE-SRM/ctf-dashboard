/*
  Warnings:

  - A unique constraint covering the columns `[submissionFingerprint]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `submissionFingerprint` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Submission_userId_challengeId_key";

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "submissionFingerprint" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_submissionFingerprint_key" ON "Submission"("submissionFingerprint");
