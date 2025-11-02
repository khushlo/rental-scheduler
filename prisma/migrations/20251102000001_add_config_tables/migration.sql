-- CreateTable
CREATE TABLE "public"."config_master" (
    "id" SERIAL NOT NULL,
    "configName" TEXT NOT NULL,
    "description" TEXT,
    "rowStatusCd" VARCHAR(1) NOT NULL DEFAULT 'A',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedBy" TEXT NOT NULL DEFAULT 'System',

    CONSTRAINT "config_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."config_details" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedBy" TEXT NOT NULL DEFAULT 'System',

    CONSTRAINT "config_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_master_configName_key" ON "public"."config_master"("configName");

-- CreateIndex
CREATE UNIQUE INDEX "config_details_configId_tenantId_key" ON "public"."config_details"("configId", "tenantId");

-- AddForeignKey
ALTER TABLE "public"."config_details" ADD CONSTRAINT "config_details_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."config_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."config_details" ADD CONSTRAINT "config_details_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;