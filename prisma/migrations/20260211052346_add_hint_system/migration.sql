-- CreateTable
CREATE TABLE "Hint" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "Hint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HintPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "hintId" TEXT NOT NULL,
    "costAtPurchase" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HintPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HintPurchase_teamId_hintId_key" ON "HintPurchase"("teamId", "hintId");

-- AddForeignKey
ALTER TABLE "Hint" ADD CONSTRAINT "Hint_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintPurchase" ADD CONSTRAINT "HintPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintPurchase" ADD CONSTRAINT "HintPurchase_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintPurchase" ADD CONSTRAINT "HintPurchase_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "Hint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
