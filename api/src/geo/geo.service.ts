import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ListCountriesDto } from "./dto/list-countries.dto";
import { ListSubdivisionsDto } from "./dto/list-subdivisions.dto";
import { ListCitiesDto } from "./dto/list-cities.dto";

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async listCountries(query: ListCountriesDto) {
    const q = query.q?.trim();
    const activeOnly = query.activeOnly !== "false";

    const where: Prisma.GeoCountryWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { officialName: { contains: q, mode: "insensitive" } },
              { code: { contains: q.toUpperCase() } },
              { iso3: { contains: q.toUpperCase() } },
              { nativeCurriculumName: { contains: q, mode: "insensitive" } },
              { region: { contains: q, mode: "insensitive" } },
              { subregion: { contains: q, mode: "insensitive" } },
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

  async listSubdivisions(countryCode: string, query: ListSubdivisionsDto) {
    const normalized = countryCode.trim().toUpperCase();
    const q = query.q?.trim();

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
                { code: { contains: q, mode: "insensitive" } },
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

  async listCities(countryCode: string, query: ListCitiesDto) {
    const normalized = countryCode.trim().toUpperCase();
    const q = query.q?.trim();

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
        ...(query.subdivisionId ? { subdivisionId: query.subdivisionId } : {}),
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
    });

    return {
      country,
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