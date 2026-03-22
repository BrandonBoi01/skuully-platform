import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { MembershipType } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProgramContextGuard } from "../auth/program-context.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { DashboardService } from "./dashboard.service";

@UseGuards(JwtAuthGuard, SchoolContextGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("admin/overview")
  adminOverview(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.adminOverview(req.user.schoolId, date);
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Get("teacher/overview")
  teacherOverview(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.teacherOverview(
      req.user.schoolId,
      req.user.programId,
      req.user.userId,
      date
    );
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("control-center")
  controlCenter(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.controlCenter(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("control-center/classes-pending")
  classesPending(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.classesPendingToday(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("control-center/campus-status")
  campusStatus(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.campusStatus(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("control-center/heat-map")
  heatMap(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.controlCenterHeatMap(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @UseGuards(ProgramContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("control-center/class/:classId")
  classDrilldown(
    @Req() req: any,
    @Param("classId") classId: string,
    @Query("date") date?: string
  ) {
    return this.dashboard.classDrilldown(
      req.user.schoolId,
      req.user.programId,
      classId,
      date
    );
  }
}