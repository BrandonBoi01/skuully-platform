import { Controller, Get, Param, Query } from "@nestjs/common";

import { GeoService } from "./geo.service";
import { ListCountriesDto } from "./dto/list-countries.dto";
import { ListSubdivisionsDto } from "./dto/list-subdivisions.dto";
import { ListCitiesDto } from "./dto/list-cities.dto";

@Controller("geo")
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("countries")
  listCountries(@Query() query: ListCountriesDto) {
    return this.geoService.listCountries(query);
  }

  @Get("countries/phone")
  listPhoneCountries() {
    return this.geoService.listPhoneCountries();
  }

  @Get("countries/:code")
  getCountryByCode(@Param("code") code: string) {
    return this.geoService.getCountryByCode(code);
  }

  @Get("countries/:code/subdivisions")
  listSubdivisions(
    @Param("code") code: string,
    @Query() query: ListSubdivisionsDto
  ) {
    return this.geoService.listSubdivisions(code, query);
  }

  @Get("countries/:code/cities")
  listCities(@Param("code") code: string, @Query() query: ListCitiesDto) {
    return this.geoService.listCities(code, query);
  }
}