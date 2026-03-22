import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { MembershipType } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProgramContextGuard } from "../auth/program-context.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AssignClassDto } from "./dto/assign-class.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentsService } from "./students.service";

@UseGuards(JwtAuthGuard, SchoolContextGuard, ProgramContextGuard)
@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("form")
  getFormSchema(@Req() req: any) {
    return this.students.getFormSchema(req.user.schoolId, req.user.programId);
  }

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post()
  createStudent(@Req() req: any, @Body() dto: CreateStudentDto) {
    return this.students.createStudent(
      req.user.schoolId,
      req.user.programId,
      dto
    );
  }

  @Get()
  listStudents(@Req() req: any) {
    return this.students.listStudents(req.user.schoolId, req.user.programId);
  }

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Patch(":studentId/assign-class")
  assignClass(
    @Req() req: any,
    @Param("studentId") studentId: string,
    @Body() dto: AssignClassDto
  ) {
    return this.students.assignClass(
      req.user.schoolId,
      req.user.programId,
      studentId,
      dto.classId
    );
  }

  @Get("class/:classId/roster")
  roster(@Req() req: any, @Param("classId") classId: string) {
    return this.students.roster(
      req.user.schoolId,
      req.user.programId,
      classId
    );
  }
}