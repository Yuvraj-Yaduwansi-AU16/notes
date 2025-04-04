-- CreateTable
CREATE TABLE "UserAuthMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAuthMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAuthMapping_authId_key" ON "UserAuthMapping"("authId");

-- CreateIndex
CREATE INDEX "UserAuthMapping_authId_idx" ON "UserAuthMapping"("authId");

-- CreateIndex
CREATE INDEX "UserAuthMapping_userId_idx" ON "UserAuthMapping"("userId");

-- AddForeignKey
ALTER TABLE "UserAuthMapping" ADD CONSTRAINT "UserAuthMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
