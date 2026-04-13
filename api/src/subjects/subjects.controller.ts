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
import { SubjectsService } from "./subjects.service";
import { CreateProgramSubjectDto } from "./dto/create-program-subject.dto";
import { UpdateProgramSubjectDto } from "./dto/update-program-subject.dto";
import { ListProgramSubjectsQueryDto } from "./dto/list-program-subjects-query.dto";
import { AssignSubjectToGradeDto } from "./dto/assign-subject-to-grade.dto";

@Controller("institutions/:institutionId/programs/:programId")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get("subjects")
  @RequirePermissions(PERMISSIONS.SUBJECT_VIEW)
  listProgramSubjects(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Query() query: ListProgramSubjectsQueryDto,
  ) {
    return this.subjectsService.listProgramSubjects(institutionId, programId, query);
  }

  @Get("subjects/:subjectId")
  @RequirePermissions(PERMISSIONS.SUBJECT_VIEW)
  getProgramSubject(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.subjectsService.getProgramSubjectById(
      institutionId,
      programId,
      subjectId,
    );
  }

  @Post("subjects")
  @RequirePermissions(PERMISSIONS.SUBJECT_CREATE)
  createProgramSubject(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Body() dto: CreateProgramSubjectDto,
  ) {
    return this.subjectsService.createProgramSubject(institutionId, programId, dto);
  }

  @Patch("subjects/:subjectId")
  @RequirePermissions(PERMISSIONS.SUBJECT_UPDATE)
  updateProgramSubject(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("subjectId") subjectId: string,
    @Body() dto: UpdateProgramSubjectDto,
  ) {
    return this.subjectsService.updateProgramSubject(
      institutionId,
      programId,
      subjectId,
      dto,
    );
  }

  @Get("grades/:gradeId/subjects")
  @RequirePermissions(PERMISSIONS.SUBJECT_VIEW)
  listGradeSubjects(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("gradeId") gradeId: string,
  ) {
    return this.subjectsService.listGradeSubjects(institutionId, programId, gradeId);
  }

  @Post("grades/:gradeId/subjects")
  @RequirePermissions(PERMISSIONS.SUBJECT_ASSIGN)
  assignSubjectToGrade(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("gradeId") gradeId: string,
    @Body() dto: AssignSubjectToGradeDto,
  ) {
    return this.subjectsService.assignSubjectToGrade(
      institutionId,
      programId,
      gradeId,
      dto,
    );
  }

  @Patch("grades/:gradeId/subjects/:subjectId/remove")
  @RequirePermissions(PERMISSIONS.SUBJECT_ASSIGN)
  removeSubjectFromGrade(
    @Param("institutionId") institutionId: string,
    @Param("programId") programId: string,
    @Param("gradeId") gradeId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.subjectsService.removeSubjectFromGrade(
      institutionId,
      programId,
      gradeId,
      subjectId,
    );
  }
}