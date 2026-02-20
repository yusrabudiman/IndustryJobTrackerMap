/*
  Migration: Add auth (User model) and visibility (isPublic) to Company.
  Handles existing rows by creating a default system user and assigning them.
*/

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Insert a default system user for existing data
INSERT INTO "User" ("id", "email", "name", "password", "createdAt")
VALUES ('system-default-user', 'admin@jobtracker.local', 'Admin', '$2a$12$defaulthashnotusedforlogin000000000000000000000', CURRENT_TIMESTAMP);

-- AlterTable: Add columns with defaults so existing rows are handled
ALTER TABLE "Company" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'system-default-user';

-- Update existing companies to the default user
UPDATE "Company" SET "userId" = 'system-default-user' WHERE "userId" = 'system-default-user';

-- Remove the default constraint (not needed anymore, schema handles it)
ALTER TABLE "Company" ALTER COLUMN "userId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
