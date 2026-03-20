import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GeoService } from "./geo.service";
import { ListCountriesQueryDto } from "./dto/list-countries-query.dto";

@UseGuards(JwtAuthGuard)
@Controller("geo")
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("countries")
  listCountries(@Query() dto: ListCountriesQueryDto) {
    return this.geoService.listCountries(dto);
  }

  @Get("countries/phone")
  listPhoneCountries() {
    return this.geoService.listPhoneCountries();
  }

  @Get("subdivisions")
  listSubdivisions(@Query("countryCode") countryCode: string) {
    return this.geoService.listSubdivisions(countryCode);
  }

  @Get("cities")
  listCities(
    @Query("countryCode") countryCode: string,
    @Query("subdivisionCode") subdivisionCode?: string
  ) {
    return this.geoService.listCities(countryCode, subdivisionCode);
  }
}