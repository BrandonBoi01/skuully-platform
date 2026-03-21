/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "lastName" TEXT;

-- CreateTable
CREATE TABLE "AuthProviderAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthProviderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthProviderAccount_userId_idx" ON "AuthProviderAccount"("userId");

-- CreateIndex
CREATE INDEX "AuthProviderAccount_provider_idx" ON "AuthProviderAccount"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProviderAccount_provider_providerUserId_key" ON "AuthProviderAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProviderAccount_userId_provider_key" ON "AuthProviderAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- AddForeignKey
ALTER TABLE "AuthProviderAccount" ADD CONSTRAINT "AuthProviderAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
