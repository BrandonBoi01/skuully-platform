import { Controller, Get, Param, Query } from "@nestjs/common";
import { GeoService } from "./geo.service";

@Controller("geo")
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("countries")
  getCountries(@Query("search") search?: string) {
    return this.geoService.getCountries(search);
  }

  @Get("phone-countries")
  getPhoneCountries(@Query("search") search?: string) {
    return this.geoService.getPhoneCountries(search);
  }

  @Get("countries/:code")
  getCountryByCode(@Param("code") code: string) {
    return this.geoService.getCountryByCode(code);
  }

  @Get("countries/:code/subdivisions")
  getSubdivisions(
    @Param("code") code: string,
    @Query("search") search?: string
  ) {
    return this.geoService.getSubdivisions(code, search);
  }

  @Get("countries/:code/cities")
  getCities(
    @Param("code") code: string,
    @Query("subdivisionCode") subdivisionCode?: string,
    @Query("search") search?: string
  ) {
    return this.geoService.getCities(code, subdivisionCode, search);
  }

  @Get("countries/:code/timezones")
  getTimezones(@Param("code") code: string) {
    return this.geoService.getTimezones(code);
  }
}