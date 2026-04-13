import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../access-control/permissions.guard";
import { RequirePermissions } from "../access-control/permissions.decorator";
import { PERMISSIONS } from "../access-control/permissions.constants";
import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { ListStudentsQueryDto } from "./dto/list-students-query.dto";
import { CreateStudentPositionDefinitionDto } from "./dto/create-student-position-definition.dto";
import { AssignStudentPositionDto } from "./dto/assign-student-position.dto";
import { EndStudentPositionAssignmentDto } from "./dto/end-student-position-assignment.dto";
import { CreateStudentGuardianDto } from "./dto/create-student-guardian.dto";
import { UpdateStudentGuardianDto } from "./dto/update-student-guardian.dto";
import { ReviewStudentGuardianDto } from "./dto/review-student-guardian.dto";

@Controller("institutions/:institutionId/students")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.STUDENT_VIEW)
  listStudents(
    @Param("institutionId") institutionId: string,
    @Query() query: ListStudentsQueryDto
  ) {
    return this.studentsService.listStudents(institutionId, query);
  }

  @Get(":studentId")
  @RequirePermissions(PERMISSIONS.STUDENT_VIEW)
  getStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string
  ) {
    return this.studentsService.getStudentById(institutionId, studentId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STUDENT_CREATE)
  createStudent(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateStudentDto
  ) {
    return this.studentsService.createStudent(institutionId, dto);
  }

  @Patch(":studentId")
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  updateStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Body() dto: UpdateStudentDto
  ) {
    return this.studentsService.updateStudent(institutionId, studentId, dto);
  }

  @Get("positions/definitions")
  @RequirePermissions(PERMISSIONS.STUDENT_POSITION_VIEW)
  listStudentPositionDefinitions(
    @Param("institutionId") institutionId: string
  ) {
    return this.studentsService.listStudentPositionDefinitions(institutionId);
  }

  @Post("positions/definitions")
  @RequirePermissions(PERMISSIONS.STUDENT_POSITION_CREATE)
  createStudentPositionDefinition(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateStudentPositionDefinitionDto
  ) {
    return this.studentsService.createStudentPositionDefinition(
      institutionId,
      dto
    );
  }

  @Get(":studentId/positions")
  @RequirePermissions(PERMISSIONS.STUDENT_POSITION_VIEW)
  listStudentPositionAssignments(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string
  ) {
    return this.studentsService.listStudentPositionAssignments(
      institutionId,
      studentId
    );
  }

  @Post(":studentId/positions")
  @RequirePermissions(PERMISSIONS.STUDENT_POSITION_ASSIGN)
  assignStudentPosition(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: AssignStudentPositionDto
  ) {
    return this.studentsService.assignStudentPosition(
      institutionId,
      studentId,
      req.user.userId,
      dto
    );
  }

  @Patch(":studentId/positions/:assignmentId/end")
  @RequirePermissions(PERMISSIONS.STUDENT_POSITION_UPDATE)
  endStudentPositionAssignment(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: EndStudentPositionAssignmentDto
  ) {
    return this.studentsService.endStudentPositionAssignment(
      institutionId,
      studentId,
      assignmentId,
      dto
    );
  }

  @Get(":studentId/guardians")
  @RequirePermissions(PERMISSIONS.GUARDIAN_VIEW)
  listStudentGuardians(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string
  ) {
    return this.studentsService.listStudentGuardians(institutionId, studentId);
  }

  @Post(":studentId/guardians")
  @RequirePermissions(PERMISSIONS.GUARDIAN_CREATE)
  createStudentGuardian(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Body() dto: CreateStudentGuardianDto
  ) {
    return this.studentsService.createStudentGuardian(
      institutionId,
      studentId,
      dto
    );
  }

  @Patch(":studentId/guardians/:guardianLinkId")
  @RequirePermissions(PERMISSIONS.GUARDIAN_UPDATE)
  updateStudentGuardian(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Param("guardianLinkId") guardianLinkId: string,
    @Body() dto: UpdateStudentGuardianDto
  ) {
    return this.studentsService.updateStudentGuardian(
      institutionId,
      studentId,
      guardianLinkId,
      dto
    );
  }

  @Patch(":studentId/guardians/:guardianLinkId/review")
  @RequirePermissions(PERMISSIONS.GUARDIAN_APPROVE)
  reviewStudentGuardian(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Param("guardianLinkId") guardianLinkId: string,
    @Body() dto: ReviewStudentGuardianDto
  ) {
    return this.studentsService.reviewStudentGuardian(
      institutionId,
      studentId,
      guardianLinkId,
      dto
    );
  }

  @Patch(":studentId/guardians/:guardianLinkId/primary")
  @RequirePermissions(PERMISSIONS.GUARDIAN_UPDATE)
  setPrimaryGuardian(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Param("guardianLinkId") guardianLinkId: string
  ) {
    return this.studentsService.setPrimaryGuardian(
      institutionId,
      studentId,
      guardianLinkId
    );
  }
}