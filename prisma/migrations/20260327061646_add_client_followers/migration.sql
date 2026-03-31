-- CreateTable
CREATE TABLE "ClientFollower" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientFollower_userId_idx" ON "ClientFollower"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientFollower_clientId_userId_key" ON "ClientFollower"("clientId", "userId");

-- AddForeignKey
ALTER TABLE "ClientFollower" ADD CONSTRAINT "ClientFollower_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientFollower" ADD CONSTRAINT "ClientFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
