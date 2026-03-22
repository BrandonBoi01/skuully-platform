import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AttendancePersonType, MembershipType } from "@prisma/client";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProgramContextGuard } from "../auth/program-context.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SchoolContextGuard } from "../auth/school-context.guard";
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceEventDto } from "./dto/create-event.dto";
import { CreateAttendanceSessionDto } from "./dto/create-session.dto";
import { MarkAttendanceSessionDto } from "./dto/mark-session.dto";
import { MarkStaffSessionDto } from "./dto/mark-staff-session.dto";
import { DashboardService } from "../dashboard/dashboard.service";

@UseGuards(JwtAuthGuard, SchoolContextGuard, ProgramContextGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(
    private readonly attendance: AttendanceService,
    private readonly dashboard: DashboardService
  ) {}

  // =========================================================
  // SESSIONS (Student rollcall)
  // =========================================================

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("sessions")
  createSession(@Req() req: any, @Body() dto: CreateAttendanceSessionDto) {
    return this.attendance.createSession(
      req.user.userId,
      req.user.schoolId,
      req.user.programId,
      dto
    );
  }

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("sessions/:sessionId/mark")
  markStudents(
    @Req() req: any,
    @Param("sessionId") sessionId: string,
    @Body() dto: MarkAttendanceSessionDto
  ) {
    return this.attendance.markSession(
      req.user.userId,
      req.user.schoolId,
      req.user.programId,
      req.user.role,
      sessionId,
      dto
    );
  }

  // =========================================================
  // STAFF SESSION ATTENDANCE
  // =========================================================

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("sessions/:sessionId/mark-staff")
  markStaff(
    @Req() req: any,
    @Param("sessionId") sessionId: string,
    @Body() dto: MarkStaffSessionDto
  ) {
    return this.attendance.markStaffSession(
      req.user.userId,
      req.user.schoolId,
      req.user.programId,
      req.user.role,
      sessionId,
      dto
    );
  }

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("sessions/:sessionId/close")
  close(@Req() req: any, @Param("sessionId") sessionId: string) {
    return this.attendance.closeSession(
      req.user.schoolId,
      req.user.programId,
      sessionId
    );
  }

  // =========================================================
  // CLASS DAILY SUMMARY
  // =========================================================

  @Get("classes/:classId/daily")
  daily(
    @Req() req: any,
    @Param("classId") classId: string,
    @Query("date") date: string
  ) {
    return this.attendance.classDailySummary(
      req.user.schoolId,
      req.user.programId,
      classId,
      date
    );
  }

  // =========================================================
  // SMART EVENTS
  // =========================================================

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN, MembershipType.STAFF)
  @Post("events")
  createEvent(@Req() req: any, @Body() dto: CreateAttendanceEventDto) {
    return this.attendance.createEvent(
      req.user.userId,
      req.user.schoolId,
      req.user.programId,
      dto
    );
  }

  // =========================================================
  // DAILY PERSON VIEW
  // =========================================================

  @Get("daily/person/:personType/:personId")
  dailyPerson(
    @Req() req: any,
    @Param("personType") personType: AttendancePersonType,
    @Param("personId") personId: string,
    @Query("date") date: string
  ) {
    return this.attendance.dailyPerson(
      req.user.schoolId,
      req.user.programId,
      personType,
      personId,
      date
    );
  }

  // =========================================================
  // DAILY HISTORY
  // =========================================================

  @Get("daily/person/:personType/:personId/history")
  dailyPersonHistory(
    @Req() req: any,
    @Param("personType") personType: AttendancePersonType,
    @Param("personId") personId: string,
    @Query("date") date: string
  ) {
    return this.attendance.dailyPersonHistory(
      req.user.schoolId,
      req.user.programId,
      personType,
      personId,
      date
    );
  }

  // =========================================================
  // DASHBOARDS
  // =========================================================

  @Get("dashboard/school/today")
  schoolToday(@Req() req: any, @Query("date") date?: string) {
    return this.attendance.schoolTodayDashboard(req.user.schoolId, date);
  }

  @Get("dashboard/program/today")
  programToday(@Req() req: any, @Query("date") date?: string) {
    return this.attendance.programTodayDashboard(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @Get("dashboard/class/:classId/today")
  classToday(
    @Req() req: any,
    @Param("classId") classId: string,
    @Query("date") date?: string
  ) {
    return this.attendance.classTodayDashboard(
      req.user.schoolId,
      req.user.programId,
      classId,
      date
    );
  }

  @Get("dashboard/student/:studentId/summary")
  studentSummary(
    @Req() req: any,
    @Param("studentId") studentId: string,
    @Query("days") days?: string
  ) {
    return this.attendance.studentAttendanceSummary(
      req.user.schoolId,
      req.user.programId,
      studentId,
      days ? Number(days) : 30
    );
  }

  @Get("dashboard/staff/today")
  staffToday(@Req() req: any, @Query("date") date?: string) {
    return this.attendance.staffTodayDashboard(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @Get("dashboard/risk/students")
  riskStudents(@Req() req: any, @Query("days") days?: string) {
    return this.attendance.riskStudentsDashboard(
      req.user.schoolId,
      req.user.programId,
      days ? Number(days) : 30
    );
  }

  // =========================================================
  // CONTROL CENTER
  // =========================================================

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("dashboard/control-center")
  controlCenter(@Req() req: any, @Query("date") date?: string) {
    return this.dashboard.controlCenter(
      req.user.schoolId,
      req.user.programId,
      date
    );
  }

  @UseGuards(RolesGuard)
  @Roles(MembershipType.OWNER, MembershipType.ADMIN)
  @Get("dashboard/control-center/live")
  controlCenterLive(@Req() req: any, @Query("date") date?: string) {
    return Promise.all([
      this.attendance.programTodayDashboard(
        req.user.schoolId,
        req.user.programId,
        date
      ),
      this.attendance.staffTodayDashboard(
        req.user.schoolId,
        req.user.programId,
        date
      ),
      this.attendance.riskStudentsDashboard(
        req.user.schoolId,
        req.user.programId,
        30
      ),
    ]).then(([program, staff, risk]) => ({
      scope: "control_center_live",
      schoolId: req.user.schoolId,
      programId: req.user.programId,
      date: program.date,
      program,
      staff,
      risk,
    }));
  }
}