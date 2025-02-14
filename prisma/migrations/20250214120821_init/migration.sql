-- CreateTable
CREATE TABLE "AverageMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hour" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "averageVisits" INTEGER NOT NULL,
    "averageSessionDuration" DOUBLE PRECISION NOT NULL,
    "averageNetworkSpeed" DOUBLE PRECISION NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "browserCount" INTEGER NOT NULL,
    "connectionType" TEXT NOT NULL,

    CONSTRAINT "AverageMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL,

    CONSTRAINT "LocationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL,

    CONSTRAINT "ReferralMetrics_pkey" PRIMARY KEY ("id")
);
