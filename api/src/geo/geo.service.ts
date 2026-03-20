import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ListCountriesQueryDto } from "./dto/list-countries-query.dto";

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async listCountries(dto: ListCountriesQueryDto) {
    const q = dto.q?.trim();

    const where: Prisma.GeoCountryWhereInput = q
      ? {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { officialName: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { iso3: { contains: q, mode: "insensitive" } },
            { nativeCurriculumName: { contains: q, mode: "insensitive" } },
            { region: { contains: q, mode: "insensitive" } },
            { subregion: { contains: q, mode: "insensitive" } },
          ],
        }
      : { isActive: true };

    const items = await this.prisma.geoCountry.findMany({
      where,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        iso3: true,
        name: true,
        officialName: true,
        flagEmoji: true,
        region: true,
        subregion: true,
        capital: true,
        currencyCode: true,
        currencyName: true,
        phoneCode: true,
        phoneMinLength: true,
        phoneMaxLength: true,
        nativeCurriculumName: true,
        nativeCurriculumCode: true,
        isActive: true,
      },
      take: 300,
    });

    return {
      items,
      total: items.length,
    };
  }

  async listPhoneCountries() {
    const items = await this.prisma.geoCountry.findMany({
      where: {
        isActive: true,
        phoneCode: {
          not: null,
        },
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        iso3: true,
        name: true,
        officialName: true,
        flagEmoji: true,
        region: true,
        subregion: true,
        capital: true,
        currencyCode: true,
        currencyName: true,
        phoneCode: true,
        phoneMinLength: true,
        phoneMaxLength: true,
        nativeCurriculumName: true,
        nativeCurriculumCode: true,
        isActive: true,
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  async listSubdivisions(countryCode: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: countryCode.trim().toUpperCase() },
      select: { id: true },
    });

    if (!country) {
      return { items: [], total: 0 };
    }

    const items = await this.prisma.geoSubdivision.findMany({
      where: { countryId: country.id },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  async listCities(countryCode: string, subdivisionCode?: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: countryCode.trim().toUpperCase() },
      select: { id: true },
    });

    if (!country) {
      return { items: [], total: 0 };
    }

    let subdivisionId: string | undefined;

    if (subdivisionCode?.trim()) {
      const subdivision = await this.prisma.geoSubdivision.findFirst({
        where: {
          countryId: country.id,
          code: subdivisionCode.trim(),
        },
        select: { id: true },
      });

      subdivisionId = subdivision?.id;
    }

    const items = await this.prisma.geoCity.findMany({
      where: {
        countryId: country.id,
        ...(subdivisionId ? { subdivisionId } : {}),
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        subdivisionId: true,
      },
      take: 500,
    });

    return {
      items,
      total: items.length,
    };
  }
}