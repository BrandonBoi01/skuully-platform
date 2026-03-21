import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async getCountries(search?: string) {
    const query = search?.trim();

    const items = await this.prisma.geoCountry.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { code: { contains: query.toUpperCase() } },
                {
                  nativeCurriculumName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                { region: { contains: query, mode: "insensitive" } },
                { subregion: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
    });

    return {
      items,
      total: items.length,
    };
  }

  async getPhoneCountries(search?: string) {
    const query = search?.trim();

    const items = await this.prisma.geoCountry.findMany({
      where: {
        isActive: true,
        phoneCode: { not: null },
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { code: { contains: query.toUpperCase() } },
                { phoneCode: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
    });

    return {
      items,
      total: items.length,
    };
  }

  async getCountryByCode(code: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: {
        code: code.trim().toUpperCase(),
      },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    return country;
  }

  async getSubdivisions(countryCode: string, search?: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: {
        code: countryCode.trim().toUpperCase(),
      },
      select: {
        id: true,
      },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    const query = search?.trim();

    const items = await this.prisma.geoSubdivision.findMany({
      where: {
        countryId: country.id,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { code: { contains: query.toUpperCase() } },
                { type: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
    });

    return {
      items,
      total: items.length,
    };
  }

  async getCities(
    countryCode: string,
    subdivisionCode?: string,
    search?: string
  ) {
    const country = await this.prisma.geoCountry.findUnique({
      where: {
        code: countryCode.trim().toUpperCase(),
      },
      select: {
        id: true,
      },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    let subdivisionId: string | undefined;

    if (subdivisionCode?.trim()) {
      const subdivision = await this.prisma.geoSubdivision.findFirst({
        where: {
          countryId: country.id,
          code: subdivisionCode.trim().toUpperCase(),
        },
        select: {
          id: true,
        },
      });

      if (!subdivision) {
        throw new NotFoundException("Subdivision not found");
      }

      subdivisionId = subdivision.id;
    }

    const query = search?.trim();

    const items = await this.prisma.geoCity.findMany({
      where: {
        countryId: country.id,
        ...(subdivisionId ? { subdivisionId } : {}),
        ...(query
          ? {
              name: { contains: query, mode: "insensitive" },
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
    });

    return {
      items,
      total: items.length,
    };
  }

  async getTimezones(countryCode: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: {
        code: countryCode.trim().toUpperCase(),
      },
      select: {
        id: true,
      },
    });

    if (!country) {
      throw new NotFoundException("Country not found");
    }

    const items = await this.prisma.geoTimezone.findMany({
      where: {
        countryId: country.id,
      },
      orderBy: [{ name: "asc" }],
    });

    return {
      items,
      total: items.length,
    };
  }
}