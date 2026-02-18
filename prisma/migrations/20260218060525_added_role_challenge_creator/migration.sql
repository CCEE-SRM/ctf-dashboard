/*
  Warnings:

  - You are about to drop the column `theme` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CHALLENGE_CREATOR';

-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "theme",
ADD COLUMN     "themeId" TEXT;

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_name_key" ON "Theme"("name");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
