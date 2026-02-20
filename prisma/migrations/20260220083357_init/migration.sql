-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('APPLIED', 'INTERVIEW', 'OFFERED', 'JOINED', 'REJECTED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subSector" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "CompanyStatus" NOT NULL,
    "ratingSalary" INTEGER NOT NULL,
    "ratingStability" INTEGER NOT NULL,
    "ratingCulture" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
