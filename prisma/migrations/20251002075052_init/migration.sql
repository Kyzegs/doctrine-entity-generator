-- CreateTable
CREATE TABLE "ShareableLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareableLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareableLink_code_key" ON "ShareableLink"("code");

-- CreateIndex
CREATE INDEX "ShareableLink_expiresAt_idx" ON "ShareableLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareableLink_code_idx" ON "ShareableLink"("code");
