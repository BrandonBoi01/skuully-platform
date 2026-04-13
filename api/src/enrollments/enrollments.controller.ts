import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../access-control/permissions.guard";
import { RequirePermissions } from "../access-control/permissions.decorator";
import { PERMISSIONS } from "../access-control/permissions.constants";
import { EnrollmentsService } from "./enrollments.service";
import { CreateStudentEnrollmentDto } from "./dto/create-student-enrollment.dto";
import { PromoteStudentDto } from "./dto/promote-student.dto";
import { TransferStudentDto } from "./dto/transfer-student.dto";
import { GraduateStudentDto } from "./dto/graduate-student.dto";
import { WithdrawStudentDto } from "./dto/withdraw-student.dto";
import { ChangeClassDto } from "./dto/change-class.dto";
import { ChangeProgramDto } from "./dto/change-program.dto";

@Controller("institutions/:institutionId/students/:studentId")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get("enrollments")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_VIEW)
  listEnrollments(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
  ) {
    return this.enrollmentsService.listEnrollments(institutionId, studentId);
  }

  @Post("enrollments")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_CREATE)
  createEnrollment(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: CreateStudentEnrollmentDto,
  ) {
    return this.enrollmentsService.createEnrollment(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("promote")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_PROMOTE)
  promoteStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: PromoteStudentDto,
  ) {
    return this.enrollmentsService.promoteStudent(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("transfer")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_TRANSFER)
  transferStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: TransferStudentDto,
  ) {
    return this.enrollmentsService.transferStudent(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("graduate")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_GRADUATE)
  graduateStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: GraduateStudentDto,
  ) {
    return this.enrollmentsService.graduateStudent(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("withdraw")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_WITHDRAW)
  withdrawStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: WithdrawStudentDto,
  ) {
    return this.enrollmentsService.withdrawStudent(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("change-class")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_UPDATE)
  changeClass(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: ChangeClassDto,
  ) {
    return this.enrollmentsService.changeClass(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }

  @Post("change-program")
  @RequirePermissions(PERMISSIONS.ENROLLMENT_UPDATE)
  changeProgram(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @Req() req: any,
    @Body() dto: ChangeProgramDto,
  ) {
    return this.enrollmentsService.changeProgram(
      institutionId,
      studentId,
      req.user.userId,
      dto,
    );
  }
}