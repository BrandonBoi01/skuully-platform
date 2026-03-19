import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async listCountries(query?: string) {
    const q = query?.trim();

    return this.prisma.geoCountry.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { officialName: { contains: q, mode: "insensitive" } },
                { code: { contains: q.toUpperCase() } },
                { iso3: { contains: q.toUpperCase() } },
                { region: { contains: q, mode: "insensitive" } },
                { subregion: { contains: q, mode: "insensitive" } },
                { nativeCurriculumName: { contains: q, mode: "insensitive" } },
                { nativeCurriculumCode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
      select: {
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
      },
    });
  }

  async getCountryByCode(code: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: {
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
        timezones: {
          orderBy: { name: "asc" },
          select: {
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

  async listSubdivisions(countryCode: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: countryCode.trim().toUpperCase() },
      select: { id: true },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    return this.prisma.geoSubdivision.findMany({
      where: { countryId: country.id },
      orderBy: [{ name: "asc" }],
      select: {
        code: true,
        name: true,
        type: true,
      },
    });
  }

  async listCities(countryCode: string, subdivisionCode?: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: countryCode.trim().toUpperCase() },
      select: { id: true },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
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

      if (!subdivision) {
        throw new NotFoundException("Subdivision not found");
      }

      subdivisionId = subdivision.id;
    }

    return this.prisma.geoCity.findMany({
      where: {
        countryId: country.id,
        ...(subdivisionId ? { subdivisionId } : {}),
      },
      orderBy: [{ name: "asc" }],
      select: {
        name: true,
        subdivision: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }
}