-- CreateTable
CREATE TABLE "SessionMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SessionMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMetrics" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DeviceMetrics_pkey" PRIMARY KEY ("id")
);
