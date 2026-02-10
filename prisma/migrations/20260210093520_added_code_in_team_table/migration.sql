/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");
