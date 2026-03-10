// src/schools/schools.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SchoolRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { SchoolsService } from "./schools.service";
import { InviteStaffDto } from "./dto/invite-staff.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";

@Controller("schools")
@UseGuards(JwtAuthGuard)
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Get("mine")
  mine(@Req() req: any) {
    return this.schools.mySchools(req.user.userId);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @Post("invite")
  invite(@Req() req: any, @Body() dto: InviteStaffDto) {
    return this.schools.inviteStaff(req.user.schoolId, req.user.role, dto.email, dto.role);
  }

  // ✅ PUBLIC: accept invite creates/activates user + membership and returns a USER token
  @Public()
  @Post("accept-invite")
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.schools.acceptInvite(dto.code, dto.fullName, dto.password);
  }

  @Post("switch/:schoolId")
  switchSchool(@Req() req: any, @Param("schoolId") schoolId: string) {
    return this.schools.switchSchool(req.user.userId, schoolId);
  }

  @Get("active")
  active(@Req() req: any) {
    return this.schools.activeContext(req.user.userId, req.user.schoolId ?? null, req.user.role ?? null);
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