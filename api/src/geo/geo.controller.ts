import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { GeoService } from "./geo.service";

@Controller("geo")
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Public()
  @Get("countries")
  listCountries(@Query("q") q?: string) {
    return this.geoService.listCountries(q);
  }

  @Public()
  @Get("countries/:code")
  getCountry(@Param("code") code: string) {
    return this.geoService.getCountryByCode(code);
  }

  @Public()
  @Get("countries/:code/subdivisions")
  listSubdivisions(@Param("code") code: string) {
    return this.geoService.listSubdivisions(code);
  }

  @Public()
  @Get("countries/:code/cities")
  listCities(
    @Param("code") code: string,
    @Query("subdivisionCode") subdivisionCode?: string
  ) {
    return this.geoService.listCities(code, subdivisionCode);
  }
}