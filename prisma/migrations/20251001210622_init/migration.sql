-- CreateTable
CREATE TABLE "ShareableLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareableLink_code_key" ON "ShareableLink"("code");

-- CreateIndex
CREATE INDEX "ShareableLink_expiresAt_idx" ON "ShareableLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareableLink_code_idx" ON "ShareableLink"("code");
