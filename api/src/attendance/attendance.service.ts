// src/attendance/attendance.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AttendancePersonType,
  AttendanceSource,
  AttendanceStatus,
  AttendanceSessionStatus,
  DailyAttendanceChangeType,
  DailyAttendanceComputedFrom,
  Prisma,
  SchoolRole,
} from "@prisma/client";

import { DashboardGateway } from "../dashboard/dashboard.gateway";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAttendanceEventDto } from "./dto/create-event.dto";
import { CreateAttendanceSessionDto } from "./dto/create-session.dto";
import { MarkAttendanceSessionDto } from "./dto/mark-session.dto";
import { MarkStaffSessionDto } from "./dto/mark-staff-session.dto";

function normalizeDateToUTCStart(dateStr: string) {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00.000Z` : dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayEndUTC(dayStart: Date) {
  return new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
}

type SessionCounts = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
};

type SessionSummary = {
  id: string;
  periodName: string | null;
  status: AttendanceSessionStatus;
  counts: SessionCounts;
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway
  ) {}

  // =========================================================
  // HELPERS
  // =========================================================

  private canOverrideBeyondTwo(role: SchoolRole) {
    return role === SchoolRole.OWNER || role === SchoolRole.ADMIN;
  }

  private assertExcusedAllowed(role: SchoolRole) {
    if (role !== SchoolRole.OWNER && role !== SchoolRole.ADMIN) {
      throw new ForbiddenException(
        "EXCUSED requires approval (ADMIN/OWNER). Submit an excuse request instead."
      );
    }
  }

  private normalizeDashboardDay(dateStr?: string) {
    if (!dateStr) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    const day = normalizeDateToUTCStart(dateStr);
    if (!day) {
      throw new BadRequestException("date must be a valid ISO date string");
    }

    return day;
  }

  private makeRate(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
  }

  private buildStatusCounts(rows: Array<{ status: AttendanceStatus }>): SessionCounts {
    const counts: SessionCounts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const row of rows) {
      counts[row.status] += 1;
    }

    return counts;
  }

  private safeMetaJson(
    input: unknown
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (input == null) return undefined;

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return undefined;

      try {
        return JSON.parse(trimmed) as Prisma.InputJsonValue;
      } catch {
        return { raw: trimmed };
      }
    }

    if (typeof input === "object") {
      return input as Prisma.InputJsonValue;
    }

    return undefined;
  }

  // =========================================================
  // DAILY WRITE WITH AUDIT
  // =========================================================

  private async setDailyStatusWithAudit(args: {
    tx: Prisma.TransactionClient;
    schoolId: string;
    programId: string;
    personType: AttendancePersonType;
    personId: string;
    date: Date;
    newStatus: AttendanceStatus;
    role: SchoolRole;
    userId: string;
    source: AttendanceSource;
    reason?: string | null;
    firstIn?: Date | null;
    lastOut?: Date | null;
    minutesOnSite?: number;
    computedFrom: DailyAttendanceComputedFrom;
  }) {
    const {
      tx,
      schoolId,
      programId,
      personType,
      personId,
      date,
      newStatus,
      role,
      userId,
      source,
      reason,
      firstIn,
      lastOut,
      minutesOnSite,
      computedFrom,
    } = args;

    if (newStatus === AttendanceStatus.EXCUSED) {
      this.assertExcusedAllowed(role);
    }

    const existing = await tx.dailyAttendance.findUnique({
      where: { unique_daily_person_date: { personType, personId, date } },
      select: {
        id: true,
        status: true,
        declaredCount: true,
        isLocked: true,
        computedFrom: true,
        lockedAt: true,
        lockedByUserId: true,
        lockedByRole: true,
      },
    });

    const prevStatus = existing?.status ?? null;
    const declaredCount = existing?.declaredCount ?? 0;
    const isLocked = existing?.isLocked ?? false;

    if (existing && existing.status === newStatus) {
      throw new BadRequestException("Attendance already set to this status for the day.");
    }

    if (isLocked && !this.canOverrideBeyondTwo(role)) {
      throw new ForbiddenException(
        "Attendance is locked for this person/day. Admin approval required."
      );
    }

    if (declaredCount >= 2 && !this.canOverrideBeyondTwo(role)) {
      throw new ForbiddenException(
        "Attendance already declared and corrected once for this day. Admin approval required for further changes."
      );
    }

    const nextDeclaredCount = existing ? Math.min(declaredCount + 1, 999) : 1;
    const shouldLockNow = nextDeclaredCount >= 2 && !this.canOverrideBeyondTwo(role);

    const nextComputedFrom: DailyAttendanceComputedFrom =
      existing?.computedFrom === DailyAttendanceComputedFrom.MANUAL ||
      existing?.computedFrom === DailyAttendanceComputedFrom.MIXED
        ? DailyAttendanceComputedFrom.MIXED
        : computedFrom;

    const daily = await tx.dailyAttendance.upsert({
      where: { unique_daily_person_date: { personType, personId, date } },
      update: {
        status: newStatus,
        computedFrom: nextComputedFrom,
        ...(firstIn !== undefined ? { firstIn } : {}),
        ...(lastOut !== undefined ? { lastOut } : {}),
        ...(minutesOnSite !== undefined ? { minutesOnSite } : {}),
        declaredCount: nextDeclaredCount,
        lastDeclaredAt: new Date(),
        lastDeclaredByUserId: userId,
        lockedSource: source,
        isLocked: shouldLockNow ? true : existing?.isLocked ?? false,
        lockedAt: shouldLockNow ? new Date() : existing?.lockedAt ?? null,
        lockedByUserId: shouldLockNow ? userId : existing?.lockedByUserId ?? null,
        lockedByRole: shouldLockNow ? role : existing?.lockedByRole ?? null,
      },
      create: {
        schoolId,
        programId,
        personType,
        personId,
        date,
        status: newStatus,
        computedFrom,
        ...(firstIn !== undefined ? { firstIn } : {}),
        ...(lastOut !== undefined ? { lastOut } : {}),
        ...(minutesOnSite !== undefined ? { minutesOnSite } : {}),
        declaredCount: 1,
        lastDeclaredAt: new Date(),
        lastDeclaredByUserId: userId,
        lockedSource: source,
        isLocked: false,
      },
      select: { id: true },
    });

    await tx.dailyAttendanceChange.create({
      data: {
        dailyAttendanceId: daily.id,
        schoolId,
        programId: programId ?? null,
        personType,
        personId,
        date,
        fromStatus: prevStatus,
        toStatus: newStatus,
        changeType: DailyAttendanceChangeType.STATUS,
        changedByUserId: userId,
        changedByRole: role,
        source,
        reason: reason?.trim() || null,
      },
    });

    if (shouldLockNow) {
      await tx.dailyAttendanceChange.create({
        data: {
          dailyAttendanceId: daily.id,
          schoolId,
          programId: programId ?? null,
          personType,
          personId,
          date,
          fromStatus: newStatus,
          toStatus: newStatus,
          changeType: DailyAttendanceChangeType.LOCK,
          changedByUserId: userId,
          changedByRole: role,
          source,
          reason: "Auto-locked after second change",
        },
      });
    }
  }

  // =========================================================
  // HISTORY
  // =========================================================

  async dailyPersonHistory(
    schoolId: string,
    programId: string,
    personType: AttendancePersonType,
    personId: string,
    dateStr: string
  ) {
    const day = normalizeDateToUTCStart(dateStr);
    if (!day) {
      throw new BadRequestException("date must be a valid ISO date string");
    }

    if (personType === AttendancePersonType.STUDENT) {
      const exists = await this.prisma.student.findFirst({
        where: { id: personId, schoolId, programId },
        select: { id: true },
      });
      if (!exists) {
        throw new ForbiddenException("Student not found in active program");
      }
    }

    if (personType === AttendancePersonType.STAFF) {
      const exists = await this.prisma.staff.findFirst({
        where: { id: personId, schoolId, programId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!exists) {
        throw new ForbiddenException("Staff not found in school/program");
      }
    }

    const daily = await this.prisma.dailyAttendance.findUnique({
      where: { unique_daily_person_date: { personType, personId, date: day } },
      select: {
        id: true,
        status: true,
        firstIn: true,
        lastOut: true,
        minutesOnSite: true,
        computedFrom: true,
        declaredCount: true,
        isLocked: true,
        lockedAt: true,
        lockedByRole: true,
        lockedByUserId: true,
        updatedAt: true,
      },
    });

    if (!daily) {
      return {
        personType,
        personId,
        date: day,
        attendance: null,
        history: [],
      };
    }

    const history = await this.prisma.dailyAttendanceChange.findMany({
      where: {
        dailyAttendanceId: daily.id,
        schoolId,
        ...(programId ? { programId } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        changeType: true,
        source: true,
        reason: true,
        changedByUserId: true,
        changedByRole: true,
        createdAt: true,
      },
    });

    return {
      personType,
      personId,
      date: day,
      attendance: daily,
      history,
    };
  }

  // =========================================================
  // SESSIONS
  // =========================================================

  async createSession(
    userId: string,
    schoolId: string,
    programId: string,
    dto: CreateAttendanceSessionDto
  ) {
    const day = normalizeDateToUTCStart(dto.date);
    if (!day) {
      throw new BadRequestException("date must be a valid ISO date string");
    }

    const cls = await this.prisma.programClass.findFirst({
      where: { id: dto.classId, programId },
      select: { id: true },
    });

    if (!cls) {
      throw new ForbiddenException("classId is not in the active program");
    }

    try {
      const session = await this.prisma.attendanceSession.create({
        data: {
          schoolId,
          programId,
          classId: dto.classId,
          date: day,
          periodName: dto.periodName?.trim() || null,
          createdById: userId,
        },
        select: {
          id: true,
          classId: true,
          date: true,
          periodName: true,
          status: true,
          createdAt: true,
        },
      });

      this.dashboardGateway.emitClassRefresh(
        schoolId,
        programId,
        dto.classId,
        "session_created"
      );

      return { message: "Session created", session };
    } catch {
      throw new BadRequestException("Session already exists for this class/date/period");
    }
  }

  async markSession(
    userId: string,
    schoolId: string,
    programId: string,
    role: SchoolRole,
    sessionId: string,
    dto: MarkAttendanceSessionDto
  ) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId, programId },
      select: { id: true, status: true, classId: true, date: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.status !== AttendanceSessionStatus.OPEN) {
      throw new BadRequestException("Session is closed");
    }

    const studentIds: string[] = [...new Set(dto.marks.map((m) => m.studentId))];

    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        programId,
        classId: session.classId,
        id: { in: studentIds },
      },
      select: { id: true },
    });

    const okSet = new Set(students.map((s) => s.id));
    const bad = studentIds.filter((id) => !okSet.has(id));

    if (bad.length) {
      throw new BadRequestException(
        `Some students are not in this class: ${bad.slice(0, 5).join(", ")}`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const m of dto.marks) {
        await tx.attendanceMark.upsert({
          where: {
            unique_mark_per_session_student: {
              sessionId: session.id,
              studentId: m.studentId,
            },
          },
          update: {
            status: m.status,
            note: m.note?.trim() || null,
            markedById: userId,
            markedAt: new Date(),
          },
          create: {
            sessionId: session.id,
            studentId: m.studentId,
            status: m.status,
            note: m.note?.trim() || null,
            markedById: userId,
          },
        });

        await this.setDailyStatusWithAudit({
          tx,
          schoolId,
          programId,
          personType: AttendancePersonType.STUDENT,
          personId: m.studentId,
          date: session.date,
          newStatus: m.status,
          role,
          userId,
          source: AttendanceSource.TEACHER_ROLLCALL,
          computedFrom: DailyAttendanceComputedFrom.MANUAL,
          reason: (m as any).reason ?? (dto as any).reason ?? m.note ?? null,
        });
      }
    });

    this.dashboardGateway.emitClassRefresh(
      schoolId,
      programId,
      session.classId,
      "student_attendance_marked"
    );

    // push individual student updates
    for (const m of dto.marks) {
      this.dashboardGateway.emitStudentRefresh(
        schoolId,
        programId,
        m.studentId,
        "student_daily_updated"
      );
    }

    return { message: "Marked", sessionId: session.id, count: dto.marks.length };
  }

  async markStaffSession(
    userId: string,
    schoolId: string,
    programId: string,
    role: SchoolRole,
    sessionId: string,
    dto: MarkStaffSessionDto
  ) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId, programId },
      select: { id: true, status: true, date: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.status !== AttendanceSessionStatus.OPEN) {
      throw new BadRequestException("Session is closed");
    }

    const staffIds: string[] = [...new Set(dto.marks.map((m) => m.staffId))];

    const staff = await this.prisma.staff.findMany({
      where: { schoolId, programId, id: { in: staffIds }, status: "ACTIVE" },
      select: { id: true },
    });

    const okSet = new Set(staff.map((s) => s.id));
    const bad = staffIds.filter((id) => !okSet.has(id));

    if (bad.length) {
      throw new BadRequestException(
        `Some staff are not in this school/program: ${bad.slice(0, 5).join(", ")}`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const m of dto.marks) {
        const status = m.status as AttendanceStatus;

        await tx.staffSessionMark.upsert({
          where: {
            unique_staff_mark_per_session: {
              sessionId: session.id,
              staffId: m.staffId,
            },
          },
          update: {
            status,
            note: m.note?.trim() || null,
            markedById: userId,
            markedAt: new Date(),
          },
          create: {
            sessionId: session.id,
            staffId: m.staffId,
            status,
            note: m.note?.trim() || null,
            markedById: userId,
          },
        });

        await this.setDailyStatusWithAudit({
          tx,
          schoolId,
          programId,
          personType: AttendancePersonType.STAFF,
          personId: m.staffId,
          date: session.date,
          newStatus: status,
          role,
          userId,
          source: AttendanceSource.TEACHER_ROLLCALL,
          computedFrom: DailyAttendanceComputedFrom.MANUAL,
          reason: m.reason ?? dto.reason ?? m.note ?? null,
        });
      }
    });

    this.dashboardGateway.emitProgramRefresh(
      schoolId,
      programId,
      "staff_attendance_marked"
    );

    return { message: "Staff marked", sessionId: session.id, count: dto.marks.length };
  }

  async closeSession(schoolId: string, programId: string, sessionId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId, programId },
      select: { id: true, status: true, classId: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.status === AttendanceSessionStatus.CLOSED) {
      return { message: "Session already closed" };
    }

    await this.prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: AttendanceSessionStatus.CLOSED, closedAt: new Date() },
    });

    this.dashboardGateway.emitClassRefresh(
      schoolId,
      programId,
      session.classId,
      "session_closed"
    );

    return { message: "Session closed" };
  }

  // =========================================================
  // DAILY SUMMARIES
  // =========================================================

  async classDailySummary(
    schoolId: string,
    programId: string,
    classId: string,
    dateStr: string
  ) {
    const day = normalizeDateToUTCStart(dateStr);
    if (!day) {
      throw new BadRequestException("date must be a valid ISO date string");
    }

    const end = dayEndUTC(day);

    const cls = await this.prisma.programClass.findFirst({
      where: { id: classId, programId },
      select: { id: true, name: true },
    });

    if (!cls) {
      throw new ForbiddenException("classId is not in the active program");
    }

    const roster = await this.prisma.student.findMany({
      where: { schoolId, programId, classId, status: "ACTIVE" },
      select: { id: true },
    });

    const rosterIds = roster.map((s) => s.id);

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { schoolId, programId, classId, date: day },
      orderBy: { createdAt: "asc" },
      select: { id: true, periodName: true, status: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    const allMarks = sessionIds.length
      ? await this.prisma.attendanceMark.findMany({
          where: { sessionId: { in: sessionIds } },
          select: { sessionId: true, studentId: true, status: true },
        })
      : [];

    const excusedSet = await this.getExcusedStudentSetForDay(
      schoolId,
      programId,
      rosterIds,
      day,
      end
    );

    const marksBySession = new Map<
      string,
      Array<{ studentId: string; status: AttendanceStatus }>
    >();

    for (const m of allMarks) {
      const arr = marksBySession.get(m.sessionId) ?? [];
      arr.push({ studentId: m.studentId, status: m.status });
      marksBySession.set(m.sessionId, arr);
    }

    const sessionSummaries: SessionSummary[] = [];

    for (const s of sessions) {
      const marks = marksBySession.get(s.id) ?? [];
      const counts: SessionCounts = {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };

      const markedMap = new Map<string, AttendanceStatus>();

      for (const m of marks) {
        markedMap.set(m.studentId, m.status);
        counts[m.status] += 1;
      }

      for (const sid of rosterIds) {
        if (markedMap.has(sid)) continue;
        if (excusedSet.has(sid)) counts.EXCUSED += 1;
        else counts.ABSENT += 1;
      }

      sessionSummaries.push({
        id: s.id,
        periodName: s.periodName,
        status: s.status,
        counts,
      });
    }

    return {
      class: cls,
      date: day,
      rosterCount: rosterIds.length,
      sessions: sessionSummaries,
    };
  }

  async dailyPerson(
    schoolId: string,
    programId: string,
    personType: AttendancePersonType,
    personId: string,
    dateStr: string
  ) {
    const day = normalizeDateToUTCStart(dateStr);
    if (!day) {
      throw new BadRequestException("date must be a valid ISO date string");
    }

    const row = await this.prisma.dailyAttendance.findFirst({
      where: { schoolId, programId, personType, personId, date: day },
      select: {
        status: true,
        firstIn: true,
        lastOut: true,
        minutesOnSite: true,
        computedFrom: true,
        declaredCount: true,
        isLocked: true,
        updatedAt: true,
      },
    });

    return { personType, personId, date: day, attendance: row ?? null };
  }

  // =========================================================
  // DASHBOARDS
  // =========================================================

  async schoolTodayDashboard(schoolId: string, dateStr?: string) {
    const day = this.normalizeDashboardDay(dateStr);

    const rows = await this.prisma.dailyAttendance.findMany({
      where: { schoolId, date: day },
      select: {
        status: true,
        computedFrom: true,
        isLocked: true,
      },
    });

    const counts = this.buildStatusCounts(rows);
    const total = rows.length;

    const manualCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MANUAL
    ).length;
    const eventsCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.EVENTS
    ).length;
    const mixedCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MIXED
    ).length;
    const lockedCount = rows.filter((r) => r.isLocked).length;

    const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

    return {
      scope: "school",
      schoolId,
      date: day,
      total,
      counts,
      attendanceRate: this.makeRate(positive, total),
      lockedCount,
      computedFrom: {
        MANUAL: manualCount,
        EVENTS: eventsCount,
        MIXED: mixedCount,
      },
    };
  }

  async programTodayDashboard(schoolId: string, programId: string, dateStr?: string) {
    const day = this.normalizeDashboardDay(dateStr);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: { id: true, name: true },
    });

    if (!program) {
      throw new ForbiddenException("Program not found in active school");
    }

    const rows = await this.prisma.dailyAttendance.findMany({
      where: { schoolId, programId, date: day },
      select: {
        status: true,
        computedFrom: true,
        isLocked: true,
      },
    });

    const counts = this.buildStatusCounts(rows);
    const total = rows.length;

    const manualCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MANUAL
    ).length;
    const eventsCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.EVENTS
    ).length;
    const mixedCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MIXED
    ).length;
    const lockedCount = rows.filter((r) => r.isLocked).length;

    const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

    return {
      scope: "program",
      schoolId,
      program,
      date: day,
      total,
      counts,
      attendanceRate: this.makeRate(positive, total),
      lockedCount,
      computedFrom: {
        MANUAL: manualCount,
        EVENTS: eventsCount,
        MIXED: mixedCount,
      },
    };
  }

  async classTodayDashboard(
    schoolId: string,
    programId: string,
    classId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);

    const cls = await this.prisma.programClass.findFirst({
      where: { id: classId, programId },
      select: {
        id: true,
        name: true,
        grade: {
          select: { id: true, name: true, order: true, stage: true },
        },
      },
    });

    if (!cls) {
      throw new ForbiddenException("classId is not in the active program");
    }

    const students = await this.prisma.student.findMany({
      where: { schoolId, programId, classId, status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
      },
    });

    const studentIds = students.map((s) => s.id);

    const dailyRows = studentIds.length
      ? await this.prisma.dailyAttendance.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            personId: { in: studentIds },
            date: day,
          },
          select: {
            personId: true,
            status: true,
            computedFrom: true,
            isLocked: true,
            updatedAt: true,
          },
        })
      : [];

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { schoolId, programId, classId, date: day },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        periodName: true,
        status: true,
        createdAt: true,
        closedAt: true,
      },
    });

    const counts = this.buildStatusCounts(dailyRows);
    const rosterCount = students.length;
    const markedCount = dailyRows.length;
    const unmarkedCount = Math.max(0, rosterCount - markedCount);
    const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

    const attendanceByStudent = new Map(dailyRows.map((r) => [r.personId, r]));
    const roster = students.map((student) => ({
      ...student,
      attendance: attendanceByStudent.get(student.id) ?? null,
    }));

    return {
      scope: "class",
      schoolId,
      programId,
      class: cls,
      date: day,
      rosterCount,
      markedCount,
      unmarkedCount,
      counts,
      attendanceRate: this.makeRate(positive, rosterCount),
      sessions,
      roster,
    };
  }

  async studentAttendanceSummary(
    schoolId: string,
    programId: string,
    studentId: string,
    days = 30
  ) {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId, programId },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        class: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found in this program");
    }

    const today = this.normalizeDashboardDay();
    const start = new Date(today.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.dailyAttendance.findMany({
      where: {
        schoolId,
        programId,
        personType: AttendancePersonType.STUDENT,
        personId: studentId,
        date: { gte: start, lte: today },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        status: true,
        computedFrom: true,
        isLocked: true,
        firstIn: true,
        lastOut: true,
        updatedAt: true,
      },
    });

    const counts = this.buildStatusCounts(rows);
    const totalTrackedDays = rows.length;
    const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

    let presentStreak = 0;
    let absenceStreak = 0;

    for (const row of rows) {
      if (row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE) {
        if (absenceStreak === 0) presentStreak += 1;
        else break;
      } else {
        break;
      }
    }

    for (const row of rows) {
      if (row.status === AttendanceStatus.ABSENT) {
        if (presentStreak === 0) absenceStreak += 1;
        else break;
      } else {
        break;
      }
    }

    const recentHistory = rows.slice(0, 10);

    const recentChanges = rows.length
      ? await this.prisma.dailyAttendanceChange.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            personId: studentId,
            date: { gte: start, lte: today },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            date: true,
            fromStatus: true,
            toStatus: true,
            changeType: true,
            source: true,
            reason: true,
            changedByUserId: true,
            changedByRole: true,
            createdAt: true,
          },
        })
      : [];

    return {
      scope: "student",
      schoolId,
      programId,
      days: safeDays,
      range: { start, end: today },
      student,
      today: rows.find((r) => r.date.getTime() === today.getTime()) ?? null,
      totalTrackedDays,
      counts,
      attendanceRate: this.makeRate(positive, totalTrackedDays),
      streaks: {
        presentOrLate: presentStreak,
        absent: absenceStreak,
      },
      recentHistory,
      recentChanges,
    };
  }

  async staffTodayDashboard(schoolId: string, programId: string, dateStr?: string) {
    const day = this.normalizeDashboardDay(dateStr);

    const activeStaff = await this.prisma.staff.count({
      where: { schoolId, programId, status: "ACTIVE" },
    });

    const rows = await this.prisma.dailyAttendance.findMany({
      where: {
        schoolId,
        programId,
        personType: AttendancePersonType.STAFF,
        date: day,
      },
      select: {
        status: true,
        computedFrom: true,
        isLocked: true,
        firstIn: true,
      },
    });

    const counts = this.buildStatusCounts(rows);
    const trackedCount = rows.length;
    const lockedCount = rows.filter((r) => r.isLocked).length;
    const onSiteCount = rows.filter((r) => !!r.firstIn).length;

    const manualCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MANUAL
    ).length;
    const eventsCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.EVENTS
    ).length;
    const mixedCount = rows.filter(
      (r) => r.computedFrom === DailyAttendanceComputedFrom.MIXED
    ).length;

    const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

    return {
      scope: "staff",
      schoolId,
      programId,
      date: day,
      activeStaff,
      trackedCount,
      untrackedCount: Math.max(0, activeStaff - trackedCount),
      counts,
      attendanceRate: this.makeRate(positive, trackedCount || activeStaff),
      lockedCount,
      onSiteCount,
      computedFrom: {
        MANUAL: manualCount,
        EVENTS: eventsCount,
        MIXED: mixedCount,
      },
    };
  }

  async riskStudentsDashboard(schoolId: string, programId: string, days = 30) {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;
    const today = this.normalizeDashboardDay();
    const start = new Date(today.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000);

    const students = await this.prisma.student.findMany({
      where: { schoolId, programId, status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        class: { select: { id: true, name: true } },
      },
    });

    const studentIds = students.map((s) => s.id);

    const rows = studentIds.length
      ? await this.prisma.dailyAttendance.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            personId: { in: studentIds },
            date: { gte: start, lte: today },
          },
          select: {
            personId: true,
            status: true,
          },
        })
      : [];

    const changes = studentIds.length
      ? await this.prisma.dailyAttendanceChange.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            personId: { in: studentIds },
            date: { gte: start, lte: today },
            changeType: DailyAttendanceChangeType.STATUS,
          },
          select: {
            personId: true,
          },
        })
      : [];

    const rowsByStudent = new Map<string, Array<{ status: AttendanceStatus }>>();
    for (const row of rows) {
      const arr = rowsByStudent.get(row.personId) ?? [];
      arr.push({ status: row.status });
      rowsByStudent.set(row.personId, arr);
    }

    const changeCountByStudent = new Map<string, number>();
    for (const change of changes) {
      changeCountByStudent.set(
        change.personId,
        (changeCountByStudent.get(change.personId) ?? 0) + 1
      );
    }

    const risky = students
      .map((student) => {
        const studentRows = rowsByStudent.get(student.id) ?? [];
        const counts = this.buildStatusCounts(studentRows);
        const totalTracked = studentRows.length;
        const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;
        const attendanceRate = this.makeRate(positive, totalTracked);
        const overrideCount = Math.max(
          0,
          (changeCountByStudent.get(student.id) ?? 0) - totalTracked
        );

        const riskScore = counts.ABSENT * 3 + counts.LATE * 1 + overrideCount * 1;

        const reasons: string[] = [];
        if (counts.ABSENT >= 3) reasons.push("High absences");
        if (counts.LATE >= 5) reasons.push("Frequent lateness");
        if (totalTracked > 0 && attendanceRate < 75) reasons.push("Low attendance rate");
        if (overrideCount >= 2) reasons.push("Many manual changes");

        return {
          student,
          totalTracked,
          counts,
          attendanceRate,
          overrideCount,
          riskScore,
          reasons,
        };
      })
      .filter((item) => item.reasons.length > 0)
      .sort(
        (a, b) =>
          b.riskScore - a.riskScore ||
          a.student.fullName.localeCompare(b.student.fullName)
      );

    return {
      scope: "risk_students",
      schoolId,
      programId,
      days: safeDays,
      range: { start, end: today },
      count: risky.length,
      students: risky,
    };
  }

  // =========================================================
  // EVENTS
  // =========================================================

  async createEvent(
    userId: string,
    schoolId: string,
    programId: string,
    dto: CreateAttendanceEventDto
  ) {
    const occurredAt = new Date(dto.occurredAt);
    if (isNaN(occurredAt.getTime())) {
      throw new BadRequestException("occurredAt must be a valid ISO datetime string");
    }

    if (dto.personType === AttendancePersonType.STUDENT) {
      const exists = await this.prisma.student.findFirst({
        where: { id: dto.personId, schoolId, programId },
        select: { id: true },
      });
      if (!exists) {
        throw new ForbiddenException("Student not found in active program");
      }
    }

    if (dto.personType === AttendancePersonType.STAFF) {
      const exists = await this.prisma.staff.findFirst({
        where: { id: dto.personId, schoolId, programId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!exists) {
        throw new ForbiddenException("Staff not found in school/program");
      }
    }

    const day = new Date(
      Date.UTC(occurredAt.getUTCFullYear(), occurredAt.getUTCMonth(), occurredAt.getUTCDate())
    );
    const dayEnd = dayEndUTC(day);

    const created = await this.prisma.$transaction(async (tx) => {
      const metaJson = this.safeMetaJson(dto.metaJson);

      const event = await tx.attendanceEvent.create({
        data: {
          schoolId,
          programId,
          personType: dto.personType,
          personId: dto.personId,
          eventType: dto.eventType,
          source: dto.source,
          occurredAt,
          deviceId: dto.deviceId || null,
          metaJson,
        },
        select: {
          id: true,
          personType: true,
          personId: true,
          eventType: true,
          source: true,
          occurredAt: true,
          deviceId: true,
        },
      });

      await this.recomputeDailyFromEvents(
        tx,
        schoolId,
        programId,
        dto.personType,
        dto.personId,
        day,
        dayEnd,
        dto.source
      );

      return event;
    });

    if (dto.personType === AttendancePersonType.STUDENT) {
      this.dashboardGateway.emitProgramRefresh(
        schoolId,
        programId,
        "student_event_recorded"
      );
    }

    if (dto.personType === AttendancePersonType.STAFF) {
      this.dashboardGateway.emitProgramRefresh(
        schoolId,
        programId,
        "staff_event_recorded"
      );
    }

    return { message: "Event recorded", event: created };
  }

  private async recomputeDailyFromEvents(
    tx: Prisma.TransactionClient,
    schoolId: string,
    programId: string,
    personType: AttendancePersonType,
    personId: string,
    dayStart: Date,
    dayEnd: Date,
    source: AttendanceSource
  ) {
    const lockRow = await tx.dailyAttendance.findUnique({
      where: { unique_daily_person_date: { personType, personId, date: dayStart } },
      select: { isLocked: true },
    });

    if (lockRow?.isLocked) {
      return;
    }

    const events = await tx.attendanceEvent.findMany({
      where: {
        schoolId,
        programId,
        personType,
        personId,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { occurredAt: "asc" },
      select: { occurredAt: true, eventType: true },
    });

    const firstIn = events.find((e) => e.eventType === "CHECK_IN")?.occurredAt ?? null;
    const lastOut =
      [...events].reverse().find((e) => e.eventType === "CHECK_OUT")?.occurredAt ?? null;

    const status = firstIn ? AttendanceStatus.PRESENT : null;

    let minutesOnSite = 0;
    if (firstIn) {
      const end = lastOut ?? new Date();
      minutesOnSite = Math.max(0, Math.floor((end.getTime() - firstIn.getTime()) / 60000));
    }

    const existing = await tx.dailyAttendance.findUnique({
      where: { unique_daily_person_date: { personType, personId, date: dayStart } },
      select: { computedFrom: true, status: true, id: true },
    });

    const manualTruth =
      existing &&
      (existing.computedFrom === DailyAttendanceComputedFrom.MANUAL ||
        existing.computedFrom === DailyAttendanceComputedFrom.MIXED);

    const shouldOverrideStatus = !manualTruth;
    const desiredComputedFrom = manualTruth
      ? DailyAttendanceComputedFrom.MIXED
      : DailyAttendanceComputedFrom.EVENTS;

    const beforeStatus = existing?.status ?? null;

    const daily = await tx.dailyAttendance.upsert({
      where: { unique_daily_person_date: { personType, personId, date: dayStart } },
      update: {
        ...(shouldOverrideStatus && status ? { status } : {}),
        firstIn,
        lastOut,
        minutesOnSite,
        computedFrom: desiredComputedFrom,
        lockedSource: source,
      },
      create: {
        schoolId,
        programId,
        personType,
        personId,
        date: dayStart,
        status: status ?? AttendanceStatus.ABSENT,
        firstIn,
        lastOut,
        minutesOnSite,
        computedFrom: DailyAttendanceComputedFrom.EVENTS,
        declaredCount: status ? 1 : 0,
        lastDeclaredAt: status ? new Date() : null,
        lastDeclaredByUserId: null,
        lockedSource: source,
        isLocked: false,
      },
      select: { id: true, status: true },
    });

    if (shouldOverrideStatus && status && beforeStatus !== status) {
      await tx.dailyAttendanceChange.create({
        data: {
          dailyAttendanceId: daily.id,
          schoolId,
          programId: programId ?? null,
          personType,
          personId,
          date: dayStart,
          fromStatus: beforeStatus,
          toStatus: status,
          changeType: DailyAttendanceChangeType.SYSTEM,
          changedByUserId: null,
          changedByRole: null,
          source,
          reason: "Recomputed from events",
        },
      });
    }

    if (firstIn || lastOut) {
      await tx.dailyAttendanceChange.create({
        data: {
          dailyAttendanceId: daily.id,
          schoolId,
          programId: programId ?? null,
          personType,
          personId,
          date: dayStart,
          fromStatus: daily.status,
          toStatus: daily.status,
          changeType: DailyAttendanceChangeType.TIMES,
          changedByUserId: null,
          changedByRole: null,
          source,
          reason: "Updated firstIn/lastOut from events",
        },
      });
    }
  }

  // =========================================================
  // EXCUSE / LEAVEOUT HELPERS
  // =========================================================

  private async getExcusedStudentSetForDay(
    schoolId: string,
    programId: string,
    studentIds: string[],
    dayStart: Date,
    dayEnd: Date
  ) {
    if (studentIds.length === 0) return new Set<string>();

    const excuses = await this.prisma.excuseRequest.findMany({
      where: {
        schoolId,
        programId,
        status: "APPROVED",
        studentId: { in: studentIds },
        AND: [{ dateFrom: { lte: dayEnd } }, { dateTo: { gte: dayStart } }],
      },
      select: { studentId: true },
    });

    const leaveouts = await this.prisma.leaveOutPass.findMany({
      where: {
        schoolId,
        programId,
        status: "APPROVED",
        studentId: { in: studentIds },
        AND: [
          { grantedAt: { not: null, lte: dayEnd } },
          { OR: [{ returnedAt: null }, { returnedAt: { gte: dayStart } }] },
        ],
      },
      select: { studentId: true },
    });

    const set = new Set<string>();
    for (const e of excuses) set.add(e.studentId);
    for (const l of leaveouts) set.add(l.studentId);
    return set;
  }
}