-- CreateTable
CREATE TABLE "DemoClock" (
    "id" TEXT NOT NULL,
    "now" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoClock_pkey" PRIMARY KEY ("id")
);
