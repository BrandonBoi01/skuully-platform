import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { SchoolRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { setAccessCookie } from "../auth/auth-cookie.util";
import { SchoolsService } from "./schools.service";
import { InviteStaffDto } from "./dto/invite-staff.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { CreateSchoolDto } from "./dto/create-school.dto";

@Controller("schools")
@UseGuards(JwtAuthGuard)
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Post()
  createSchool(@Req() req: any, @Body() dto: CreateSchoolDto) {
    return this.schools.createSchool(req.user.userId, dto);
  }

  @Get("mine")
  mine(@Req() req: any) {
    return this.schools.mySchools(req.user.userId);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @Post("invite")
  invite(@Req() req: any, @Body() dto: InviteStaffDto) {
    return this.schools.inviteStaff(
      req.user.schoolId,
      req.user.role,
      dto.email,
      dto.role
    );
  }

  @Public()
  @Post("accept-invite")
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.schools.acceptInvite(
      dto.code,
      dto.fullName,
      dto.password
    );
    setAccessCookie(res, result.token);
    return result;
  }

  @Post("switch/:schoolId")
  async switchSchool(
    @Req() req: any,
    @Param("schoolId") schoolId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.schools.switchSchool(req.user.userId, schoolId);
    setAccessCookie(res, result.token);
    return result;
  }

  @Get("active")
  active(@Req() req: any) {
    return this.schools.activeContext(
      req.user.userId,
      req.user.schoolId ?? null,
      req.user.role ?? null
    );
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @Get("admin-check")
  adminCheck(@Req() req: any) {
    return {
      ok: true,
      message: "You are allowed (OWNER/ADMIN)",
      schoolId: req.user.schoolId,
      role: req.user.role,
      userId: req.user.userId,
    };
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @Get("invites")
  invites(@Req() req: any) {
    return this.schools.listInvites(req.user.schoolId);
  }
}