-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CHRIS', 'HAMLET', 'HERB');

-- CreateEnum
CREATE TYPE "ShiftKind" AS ENUM ('TUESDAY_LUNCH', 'FRIDAY_RUSH', 'SUNDAY_BRUNCH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RunOutcome" AS ENUM ('COMPLETED', 'MELTDOWN', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authId" TEXT,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "shift" "ShiftKind" NOT NULL,
    "kitchenId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "outcome" "RunOutcome",
    "meta" JSONB,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "hospitality" INTEGER NOT NULL DEFAULT 0,
    "composureFinal" INTEGER NOT NULL DEFAULT 100,
    "heatPeak" INTEGER NOT NULL DEFAULT 0,
    "vibesAvg" INTEGER NOT NULL DEFAULT 50,
    "baconStolen" INTEGER NOT NULL DEFAULT 0,
    "customersServed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kitchen" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kitchen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuipEvent" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextKey" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "vibesDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE INDEX "Run_userId_startedAt_idx" ON "Run"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "Run_shift_idx" ON "Run"("shift");

-- CreateIndex
CREATE INDEX "Score_runId_idx" ON "Score"("runId");

-- CreateIndex
CREATE INDEX "Score_hospitality_idx" ON "Score"("hospitality");

-- CreateIndex
CREATE INDEX "Kitchen_authorId_idx" ON "Kitchen"("authorId");

-- CreateIndex
CREATE INDEX "Kitchen_isPublic_createdAt_idx" ON "Kitchen"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "QuipEvent_runId_idx" ON "QuipEvent"("runId");

-- CreateIndex
CREATE INDEX "QuipEvent_contextKey_optionId_idx" ON "QuipEvent"("contextKey", "optionId");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kitchen" ADD CONSTRAINT "Kitchen_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuipEvent" ADD CONSTRAINT "QuipEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuipEvent" ADD CONSTRAINT "QuipEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
