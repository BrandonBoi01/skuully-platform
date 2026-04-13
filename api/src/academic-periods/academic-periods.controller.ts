import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../access-control/permissions.guard";
import { RequirePermissions } from "../access-control/permissions.decorator";
import { PERMISSIONS } from "../access-control/permissions.constants";
import { AcademicPeriodsService } from "./academic-periods.service";
import { CreateAcademicPeriodDto } from "./dto/create-academic-period.dto";
import { UpdateAcademicPeriodDto } from "./dto/update-academic-period.dto";
import { ListAcademicPeriodsQueryDto } from "./dto/list-academic-periods-query.dto";
import { SetCurrentAcademicPeriodDto } from "./dto/set-current-academic-period.dto";
import { CloseAcademicPeriodDto } from "./dto/close-academic-period.dto";

@Controller("institutions/:institutionId/academic-periods")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AcademicPeriodsController {
  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_VIEW)
  listAcademicPeriods(
    @Param("institutionId") institutionId: string,
    @Query() query: ListAcademicPeriodsQueryDto,
  ) {
    return this.academicPeriodsService.listAcademicPeriods(institutionId, query);
  }

  @Get("current")
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_VIEW)
  getCurrentAcademicPeriod(
    @Param("institutionId") institutionId: string,
  ) {
    return this.academicPeriodsService.getCurrentAcademicPeriod(institutionId);
  }

  @Get(":periodId")
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_VIEW)
  getAcademicPeriodById(
    @Param("institutionId") institutionId: string,
    @Param("periodId") periodId: string,
  ) {
    return this.academicPeriodsService.getAcademicPeriodById(
      institutionId,
      periodId,
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_CREATE)
  createAcademicPeriod(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.createAcademicPeriod(institutionId, dto);
  }

  @Patch(":periodId")
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_UPDATE)
  updateAcademicPeriod(
    @Param("institutionId") institutionId: string,
    @Param("periodId") periodId: string,
    @Body() dto: UpdateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.updateAcademicPeriod(
      institutionId,
      periodId,
      dto,
    );
  }

  @Patch(":periodId/current")
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_ACTIVATE)
  setCurrentAcademicPeriod(
    @Param("institutionId") institutionId: string,
    @Param("periodId") periodId: string,
    @Body() dto: SetCurrentAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.setCurrentAcademicPeriod(
      institutionId,
      periodId,
      dto,
    );
  }

  @Patch(":periodId/close")
  @RequirePermissions(PERMISSIONS.ACADEMIC_PERIOD_CLOSE)
  closeAcademicPeriod(
    @Param("institutionId") institutionId: string,
    @Param("periodId") periodId: string,
    @Body() dto: CloseAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.closeAcademicPeriod(
      institutionId,
      periodId,
      dto,
    );
  }
}