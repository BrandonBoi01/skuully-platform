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
import { MembershipType } from "@prisma/client";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProgramContextGuard } from "../auth/program-context.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { setAccessCookie } from "../auth/auth-cookie.util";
import { CreateProgramDto } from "./dto/create-program.dto";
import { ProgramsService } from "./programs.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get("curriculums/templates")
  listTemplates() {
    return this.programs.listTemplates();
  }

  @UseGuards(SchoolContextGuard)
  @Get("schools/programs")
  listPrograms(@Req() req: any) {
    return this.programs.listPrograms(req.user.schoolId);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Post("schools/programs")
  createProgram(@Req() req: any, @Body() dto: CreateProgramDto) {
    return this.programs.createProgram(req.user.schoolId, dto);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Post("schools/programs/:programId/seed")
  seedProgram(@Req() req: any, @Param("programId") programId: string) {
    return this.programs.seedProgram(req.user.schoolId, programId);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Post("schools/programs/:programId/generate-classes")
  generateClasses(@Req() req: any, @Param("programId") programId: string) {
    return this.programs.generateClasses(req.user.schoolId, programId);
  }

  @UseGuards(SchoolContextGuard)
  @Get("schools/programs/:programId")
  getProgram(@Req() req: any, @Param("programId") programId: string) {
    return this.programs.getProgram(req.user.schoolId, programId);
  }

  @UseGuards(SchoolContextGuard, RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("programs/switch/:programId")
  async switchProgram(
    @Req() req: any,
    @Param("programId") programId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.programs.switchProgram(
      req.user.userId,
      req.user.schoolId,
      req.user.role,
      programId
    );

    setAccessCookie(res, result.token);
    return result;
  }

  @UseGuards(ProgramContextGuard)
  @Get("programs/active")
  activeProgram(@Req() req: any) {
    return this.programs.activeProgramContext(
      req.user.userId,
      req.user.schoolId,
      req.user.role,
      req.user.programId
    );
  }

  @UseGuards(ProgramContextGuard)
  @Get("programs/classes")
  listProgramClasses(@Req() req: any) {
    return this.programs.listProgramClasses(req.user.programId);
  }
}