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
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { ListProgramsQueryDto } from "./dto/list-programs-query.dto";
import { CreateClassRoomDto } from "./dto/create-class-room.dto";
import { UpdateClassRoomDto } from "./dto/update-class-room.dto";
import { ListClassRoomsQueryDto } from "./dto/list-class-rooms-query.dto";
import { CreateProgramGradeDto } from "./dto/create-program-grade.dto";
import { UpdateProgramGradeDto } from "./dto/update-program-grade.dto";

@Controller("institutions/:institutionId/programs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // ================= PROGRAMS =================

  @Get()
  @RequirePermissions(PERMISSIONS.PROGRAM_VIEW)
  listPrograms(
    @Param("institutionId") institutionId: string,
    @Query() query: ListProgramsQueryDto
  ) {
    return this.programsService.listPrograms(institutionId, query);
  }

  @Get(":programId")
  @RequirePermissions(PERMISSIONS.PROGRAM_VIEW)
  getProgram(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string
  ) {
    return this.programsService.getProgramById(institutionId, programId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PROGRAM_CREATE)
  createProgram(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateProgramDto
  ) {
    return this.programsService.createProgram(institutionId, dto);
  }

  @Patch(":programId")
  @RequirePermissions(PERMISSIONS.PROGRAM_UPDATE)
  updateProgram(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Body() dto: UpdateProgramDto
  ) {
    return this.programsService.updateProgram(institutionId, programId, dto);
  }

  // ================= CLASSES =================

  @Get(":programId/classes")
  @RequirePermissions(PERMISSIONS.CLASS_VIEW)
  listClassRooms(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Query() query: ListClassRoomsQueryDto
  ) {
    return this.programsService.listClassRooms(institutionId, programId, query);
  }

  @Get(":programId/classes/:classRoomId")
  @RequirePermissions(PERMISSIONS.CLASS_VIEW)
  getClassRoom(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("classRoomId") classRoomId: string
  ) {
    return this.programsService.getClassRoomById(
      institutionId,
      programId,
      classRoomId
    );
  }

  @Post(":programId/classes")
  @RequirePermissions(PERMISSIONS.CLASS_CREATE)
  createClassRoom(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Body() dto: CreateClassRoomDto
  ) {
    return this.programsService.createClassRoom(institutionId, programId, dto);
  }

  @Patch(":programId/classes/:classRoomId")
  @RequirePermissions(PERMISSIONS.CLASS_UPDATE)
  updateClassRoom(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("classRoomId") classRoomId: string,
    @Body() dto: UpdateClassRoomDto
  ) {
    return this.programsService.updateClassRoom(
      institutionId,
      programId,
      classRoomId,
      dto
    );
  }

  // ================= GRADES =================

  @Get(":programId/grades")
  @RequirePermissions(PERMISSIONS.GRADE_VIEW)
  listProgramGrades(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string
  ) {
    return this.programsService.listProgramGrades(institutionId, programId);
  }

  @Get(":programId/grades/:gradeId")
  @RequirePermissions(PERMISSIONS.GRADE_VIEW)
  getProgramGrade(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("gradeId") gradeId: string
  ) {
    return this.programsService.getProgramGradeById(
      institutionId,
      programId,
      gradeId
    );
  }

  @Post(":programId/grades")
  @RequirePermissions(PERMISSIONS.GRADE_CREATE)
  createProgramGrade(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Body() dto: CreateProgramGradeDto
  ) {
    return this.programsService.createProgramGrade(
      institutionId,
      programId,
      dto
    );
  }

  @Patch(":programId/grades/:gradeId")
  @RequirePermissions(PERMISSIONS.GRADE_UPDATE)
  updateProgramGrade(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("gradeId") gradeId: string,
    @Body() dto: UpdateProgramGradeDto
  ) {
    return this.programsService.updateProgramGrade(
      institutionId,
      programId,
      gradeId,
      dto
    );
  }
}