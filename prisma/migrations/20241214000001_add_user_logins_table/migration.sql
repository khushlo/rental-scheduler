-- CreateTable
CREATE TABLE "user_logins" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rowStatusCd" VARCHAR(1) NOT NULL DEFAULT 'A',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL DEFAULT 'System',
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "user_logins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_logins_username_tenantId_key" ON "user_logins"("username", "tenantId");

-- AddForeignKey
ALTER TABLE "user_logins" ADD CONSTRAINT "user_logins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;