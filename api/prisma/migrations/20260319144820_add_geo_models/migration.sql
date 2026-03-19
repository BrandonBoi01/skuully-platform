-- CreateTable
CREATE TABLE "GeoCountry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "iso3" TEXT,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "flagEmoji" TEXT,
    "region" TEXT,
    "subregion" TEXT,
    "capital" TEXT,
    "currencyCode" TEXT,
    "currencyName" TEXT,
    "phoneCode" TEXT,
    "phoneMinLength" INTEGER,
    "phoneMaxLength" INTEGER,
    "nativeCurriculumName" TEXT,
    "nativeCurriculumCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoSubdivision" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoSubdivision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoCity" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "subdivisionId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoTimezone" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utcOffset" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoTimezone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeoCountry_code_key" ON "GeoCountry"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GeoCountry_iso3_key" ON "GeoCountry"("iso3");

-- CreateIndex
CREATE INDEX "GeoCountry_name_idx" ON "GeoCountry"("name");

-- CreateIndex
CREATE INDEX "GeoCountry_region_idx" ON "GeoCountry"("region");

-- CreateIndex
CREATE INDEX "GeoCountry_subregion_idx" ON "GeoCountry"("subregion");

-- CreateIndex
CREATE INDEX "GeoCountry_isActive_idx" ON "GeoCountry"("isActive");

-- CreateIndex
CREATE INDEX "GeoSubdivision_countryId_idx" ON "GeoSubdivision"("countryId");

-- CreateIndex
CREATE INDEX "GeoSubdivision_name_idx" ON "GeoSubdivision"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GeoSubdivision_countryId_code_key" ON "GeoSubdivision"("countryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "GeoSubdivision_countryId_name_key" ON "GeoSubdivision"("countryId", "name");

-- CreateIndex
CREATE INDEX "GeoCity_countryId_idx" ON "GeoCity"("countryId");

-- CreateIndex
CREATE INDEX "GeoCity_subdivisionId_idx" ON "GeoCity"("subdivisionId");

-- CreateIndex
CREATE INDEX "GeoCity_name_idx" ON "GeoCity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GeoCity_countryId_subdivisionId_name_key" ON "GeoCity"("countryId", "subdivisionId", "name");

-- CreateIndex
CREATE INDEX "GeoTimezone_countryId_idx" ON "GeoTimezone"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoTimezone_countryId_name_key" ON "GeoTimezone"("countryId", "name");

-- AddForeignKey
ALTER TABLE "GeoSubdivision" ADD CONSTRAINT "GeoSubdivision_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoCity" ADD CONSTRAINT "GeoCity_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoCity" ADD CONSTRAINT "GeoCity_subdivisionId_fkey" FOREIGN KEY ("subdivisionId") REFERENCES "GeoSubdivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoTimezone" ADD CONSTRAINT "GeoTimezone_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
