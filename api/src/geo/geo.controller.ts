import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { GeoService } from "./geo.service";
import { ListCountriesDto } from "./dto/list-countries.dto";
import { ListSubdivisionsDto } from "./dto/list-subdivisions.dto";
import { ListCitiesDto } from "./dto/list-cities.dto";

@Public()
@Controller("geo")
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("countries")
  listCountries(@Query() query: ListCountriesDto) {
    return this.geo.listCountries({
      q: query.q,
      activeOnly: query.activeOnly
        ? query.activeOnly === "true"
        : true,
    });
  }

  @Get("countries/phones")
  listPhoneCountries() {
    return this.geo.getPhoneCountries();
  }

  @Get("countries/:code")
  getCountry(@Param("code") code: string) {
    return this.geo.getCountryByCode(code);
  }

  @Get("countries/:code/subdivisions")
  listSubdivisions(
    @Param("code") code: string,
    @Query() query: ListSubdivisionsDto
  ) {
    return this.geo.listSubdivisions(code, {
      q: query.q,
    });
  }

  @Get("countries/:code/cities")
  listCities(
    @Param("code") code: string,
    @Query() query: ListCitiesDto
  ) {
    return this.geo.listCities(code, {
      q: query.q,
      subdivisionId: query.subdivisionId,
    });
  }
}