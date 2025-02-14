-- CreateTable
CREATE TABLE "TrafficSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceName" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL,

    CONSTRAINT "TrafficSource_pkey" PRIMARY KEY ("id")
);
