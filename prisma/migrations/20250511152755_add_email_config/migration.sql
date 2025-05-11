-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailFrom" TEXT,
ADD COLUMN     "emailHost" TEXT,
ADD COLUMN     "emailPassword" TEXT,
ADD COLUMN     "emailPort" INTEGER,
ADD COLUMN     "emailSecure" BOOLEAN DEFAULT false,
ADD COLUMN     "emailUsername" TEXT;
