import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async listCountries(params?: { q?: string; activeOnly?: boolean }) {
    const q = params?.q?.trim();
    const activeOnly = params?.activeOnly ?? true;

    const where: Prisma.GeoCountryWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { officialName: { contains: q, mode: "insensitive" } },
              { code: { contains: q.toUpperCase() } },
              { iso3: { contains: q.toUpperCase() } },
              { region: { contains: q, mode: "insensitive" } },
              { subregion: { contains: q, mode: "insensitive" } },
              {
                nativeCurriculumName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const countries = await this.prisma.geoCountry.findMany({
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
    });

    return {
      items: countries,
      total: countries.length,
    };
  }

  async getCountryByCode(code: string) {
    const normalized = code.trim().toUpperCase();

    const country = await this.prisma.geoCountry.findUnique({
      where: { code: normalized },
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
        timezones: {
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            utcOffset: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    return country;
  }

  async listSubdivisions(countryCode: string, params?: { q?: string }) {
    const normalized = countryCode.trim().toUpperCase();
    const q = params?.q?.trim();

    const country = await this.prisma.geoCountry.findUnique({
      where: { code: normalized },
      select: { id: true, code: true, name: true },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    const items = await this.prisma.geoSubdivision.findMany({
      where: {
        countryId: country.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q.toUpperCase() } },
                { type: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    return {
      country,
      items,
      total: items.length,
    };
  }

  async listCities(
    countryCode: string,
    params?: { q?: string; subdivisionId?: string }
  ) {
    const normalized = countryCode.trim().toUpperCase();
    const q = params?.q?.trim();
    const subdivisionId = params?.subdivisionId?.trim() || undefined;

    const country = await this.prisma.geoCountry.findUnique({
      where: { code: normalized },
      select: { id: true, code: true, name: true },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    const items = await this.prisma.geoCity.findMany({
      where: {
        countryId: country.id,
        ...(subdivisionId ? { subdivisionId } : {}),
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" },
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        subdivisionId: true,
        subdivision: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      take: 200,
    });

    return {
      country,
      items,
      total: items.length,
    };
  }

  async getPhoneCountries() {
    const items = await this.prisma.geoCountry.findMany({
      where: {
        isActive: true,
        phoneCode: { not: null },
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        iso3: true,
        name: true,
        flagEmoji: true,
        phoneCode: true,
        phoneMinLength: true,
        phoneMaxLength: true,
      },
    });

    return {
      items,
      total: items.length,
    };
  }
}