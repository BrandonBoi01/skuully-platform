import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AttendancePersonType,
  AttendanceSessionStatus,
  AttendanceStatus,
  DailyAttendanceChangeType,
  DailyAttendanceComputedFrom,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

function normalizeDateToUTCStart(dateStr: string) {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00.000Z` : dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayEndUTC(dayStart: Date) {
  return new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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

  private buildStatusCounts(
    rows: Array<{ status: AttendanceStatus }>
  ): Record<AttendanceStatus, number> {
    const counts: Record<AttendanceStatus, number> = {
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

  async adminOverview(schoolId: string, dateStr?: string) {
    const day = this.normalizeDashboardDay(dateStr);

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        country: true,
        county: true,
      },
    });

    if (!school) {
      throw new NotFoundException("School not found");
    }

    const [programs, classes, students, staff, invites, openSessions, attendanceRows] =
      await Promise.all([
        this.prisma.schoolProgram.count({
          where: { schoolId, status: "ACTIVE" },
        }),
        this.prisma.programClass.count({
          where: { program: { schoolId } },
        }),
        this.prisma.student.count({
          where: { schoolId, status: "ACTIVE" },
        }),
        this.prisma.staff.count({
          where: { schoolId, status: "ACTIVE" },
        }),
        this.prisma.schoolInvite.count({
          where: { schoolId, status: "PENDING" },
        }),
        this.prisma.attendanceSession.count({
          where: {
            schoolId,
            date: day,
            status: AttendanceSessionStatus.OPEN,
          },
        }),
        this.prisma.dailyAttendance.findMany({
          where: {
            schoolId,
            date: day,
            personType: AttendancePersonType.STUDENT,
          },
          select: {
            status: true,
            computedFrom: true,
            isLocked: true,
          },
        }),
      ]);

    const todayCounts = this.buildStatusCounts(attendanceRows);
    const totalTracked = attendanceRows.length;
    const positive = todayCounts.PRESENT + todayCounts.LATE + todayCounts.EXCUSED;

    const computedFrom = {
      MANUAL: attendanceRows.filter(
        (r) => r.computedFrom === DailyAttendanceComputedFrom.MANUAL
      ).length,
      EVENTS: attendanceRows.filter(
        (r) => r.computedFrom === DailyAttendanceComputedFrom.EVENTS
      ).length,
      MIXED: attendanceRows.filter(
        (r) => r.computedFrom === DailyAttendanceComputedFrom.MIXED
      ).length,
    };

    const lockedCount = attendanceRows.filter((r) => r.isLocked).length;
    const riskStudents = await this.computeRiskStudents(schoolId, undefined, 30);

    return {
      school,
      date: day,
      totals: {
        programs,
        classes,
        students,
        staff,
      },
      today: {
        trackedStudents: totalTracked,
        studentAttendanceRate: this.makeRate(positive, totalTracked),
        presentStudents: todayCounts.PRESENT,
        absentStudents: todayCounts.ABSENT,
        lateStudents: todayCounts.LATE,
        excusedStudents: todayCounts.EXCUSED,
        lockedRows: lockedCount,
        computedFrom,
      },
      alerts: {
        riskStudents: riskStudents.length,
        pendingInvites: invites,
        openSessions,
      },
    };
  }

  async teacherOverview(
    schoolId: string,
    programId: string,
    userId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: {
        id: true,
        name: true,
        status: true,
        template: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const todaySessions = await this.prisma.attendanceSession.findMany({
      where: {
        schoolId,
        programId,
        createdById: userId,
        date: day,
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        classId: true,
        periodName: true,
        status: true,
        createdAt: true,
        closedAt: true,
        class: {
          select: {
            id: true,
            name: true,
            grade: {
              select: { id: true, name: true, order: true, stage: true },
            },
          },
        },
      },
    });

    const classIds = [...new Set(todaySessions.map((s) => s.classId))];

    const classRosters = classIds.length
      ? await this.prisma.student.groupBy({
          by: ["classId"],
          where: {
            schoolId,
            programId,
            status: "ACTIVE",
            classId: { in: classIds },
          },
          _count: { _all: true },
        })
      : [];

    const rosterMap = new Map(
      classRosters.map((row) => [row.classId ?? "", row._count._all])
    );

    const classStudents = classIds.length
      ? await this.prisma.student.findMany({
          where: {
            schoolId,
            programId,
            status: "ACTIVE",
            classId: { in: classIds },
          },
          select: {
            id: true,
            classId: true,
          },
        })
      : [];

    const studentsByClass = new Map<string, string[]>();
    for (const student of classStudents) {
      const classId = student.classId ?? "";
      const arr = studentsByClass.get(classId) ?? [];
      arr.push(student.id);
      studentsByClass.set(classId, arr);
    }

    const dailyRows = classStudents.length
      ? await this.prisma.dailyAttendance.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            personId: { in: classStudents.map((s) => s.id) },
            date: day,
          },
          select: {
            personId: true,
            status: true,
            isLocked: true,
          },
        })
      : [];

    const attendanceByStudent = new Map(dailyRows.map((row) => [row.personId, row]));

    const classesToday = classIds.map((classId) => {
      const studentIds = studentsByClass.get(classId) ?? [];
      const rows = studentIds
        .map((studentId) => attendanceByStudent.get(studentId))
        .filter(Boolean) as Array<{
          personId: string;
          status: AttendanceStatus;
          isLocked: boolean;
        }>;

      const counts = this.buildStatusCounts(rows);
      const rosterCount = rosterMap.get(classId) ?? 0;
      const markedCount = rows.length;
      const unmarkedCount = Math.max(0, rosterCount - markedCount);
      const positive = counts.PRESENT + counts.LATE + counts.EXCUSED;

      const session = todaySessions.find((s) => s.classId === classId);

      return {
        class: session?.class ?? { id: classId, name: "Unknown class", grade: null },
        rosterCount,
        markedCount,
        unmarkedCount,
        counts,
        attendanceRate: this.makeRate(positive, rosterCount),
        hasOpenSession: todaySessions.some(
          (s) => s.classId === classId && s.status === AttendanceSessionStatus.OPEN
        ),
      };
    });

    const riskStudents = await this.computeRiskStudents(schoolId, programId, 30);

    return {
      date: day,
      teacher: { userId },
      program,
      sessions: {
        total: todaySessions.length,
        open: todaySessions.filter((s) => s.status === AttendanceSessionStatus.OPEN).length,
        closed: todaySessions.filter((s) => s.status === AttendanceSessionStatus.CLOSED).length,
        items: todaySessions,
      },
      classesToday,
      risks: {
        count: riskStudents.length,
        top: riskStudents.slice(0, 10),
      },
    };
  }

  async controlCenter(schoolId: string, programId: string, dateStr?: string) {
    const day = this.normalizeDashboardDay(dateStr);
    const end = dayEndUTC(day);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: { id: true, name: true },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const [classes, students, staff, dailyRows, sessions, recentEvents, riskStudents] =
      await Promise.all([
        this.prisma.programClass.findMany({
          where: { programId },
          select: {
            id: true,
            name: true,
            grade: { select: { id: true, name: true, order: true, stage: true } },
          },
          orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
        }),
        this.prisma.student.findMany({
          where: { schoolId, programId, status: "ACTIVE" },
          select: { id: true, classId: true, fullName: true, admissionNo: true },
        }),
        this.prisma.staff.findMany({
          where: { schoolId, programId, status: "ACTIVE" },
          select: { id: true, fullName: true, staffNo: true },
        }),
        this.prisma.dailyAttendance.findMany({
          where: { schoolId, programId, date: day },
          select: {
            personType: true,
            personId: true,
            status: true,
            isLocked: true,
            firstIn: true,
            lastOut: true,
            computedFrom: true,
          },
        }),
        this.prisma.attendanceSession.findMany({
          where: { schoolId, programId, date: day },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            classId: true,
            periodName: true,
            status: true,
            createdAt: true,
            closedAt: true,
            class: { select: { id: true, name: true } },
          },
        }),
        this.prisma.attendanceEvent.findMany({
          where: {
            schoolId,
            programId,
            occurredAt: { gte: day, lte: end },
          },
          orderBy: { occurredAt: "desc" },
          take: 20,
          select: {
            id: true,
            personType: true,
            personId: true,
            eventType: true,
            source: true,
            occurredAt: true,
            deviceId: true,
          },
        }),
        this.computeRiskStudents(schoolId, programId, 30),
      ]);

    const studentRows = dailyRows.filter((r) => r.personType === AttendancePersonType.STUDENT);
    const staffRows = dailyRows.filter((r) => r.personType === AttendancePersonType.STAFF);

    const studentCounts = this.buildStatusCounts(studentRows);
    const staffCounts = this.buildStatusCounts(staffRows);

    const trackedStudentIds = new Set(studentRows.map((r) => r.personId));
    const trackedStaffIds = new Set(staffRows.map((r) => r.personId));

    const studentPositive =
      studentCounts.PRESENT + studentCounts.LATE + studentCounts.EXCUSED;
    const staffPositive =
      staffCounts.PRESENT + staffCounts.LATE + staffCounts.EXCUSED;

    const lockedCount = dailyRows.filter((r) => r.isLocked).length;
    const studentOnCampus = studentRows.filter((r) => !!r.firstIn && !r.lastOut).length;
    const staffOnCampus = staffRows.filter((r) => !!r.firstIn && !r.lastOut).length;

    const sessionClassIds = new Set(sessions.map((s) => s.classId));
    const classesWithoutSessions = classes.filter((c) => !sessionClassIds.has(c.id));
    const openSessions = sessions.filter((s) => s.status === AttendanceSessionStatus.OPEN);

    return {
      scope: "control_center",
      schoolId,
      program,
      date: day,
      totals: {
        activeStudents: students.length,
        activeStaff: staff.length,
        trackedStudents: trackedStudentIds.size,
        trackedStaff: trackedStaffIds.size,
        studentOnCampus,
        staffOnCampus,
        lockedRows: lockedCount,
      },
      operations: {
        expectedClasses: classes.length,
        classesMarkedToday: sessionClassIds.size,
        classesPendingToday: Math.max(0, classes.length - sessionClassIds.size),
        openSessions: openSessions.length,
      },
      students: {
        counts: studentCounts,
        attendanceRate: this.makeRate(studentPositive, students.length),
        untracked: Math.max(0, students.length - trackedStudentIds.size),
      },
      staff: {
        counts: staffCounts,
        attendanceRate: this.makeRate(staffPositive, staff.length),
        untracked: Math.max(0, staff.length - trackedStaffIds.size),
      },
      sessions: {
        total: sessions.length,
        open: openSessions.length,
        closed: sessions.length - openSessions.length,
        openItems: openSessions.map((s) => ({
          id: s.id,
          classId: s.classId,
          className: s.class?.name ?? null,
          periodName: s.periodName,
          createdAt: s.createdAt,
        })),
        classesWithoutSessions: classesWithoutSessions.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade?.name ?? null,
        })),
      },
      risks: {
        count: riskStudents.length,
        top: riskStudents.slice(0, 10),
      },
      recentEvents,
    };
  }

  async classesPendingToday(
    schoolId: string,
    programId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: { id: true, name: true },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const [classes, sessions] = await Promise.all([
      this.prisma.programClass.findMany({
        where: { programId },
        orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          grade: {
            select: {
              id: true,
              name: true,
              order: true,
              stage: true,
            },
          },
        },
      }),
      this.prisma.attendanceSession.findMany({
        where: {
          schoolId,
          programId,
          date: day,
        },
        select: {
          classId: true,
        },
      }),
    ]);

    const sessionClassIds = new Set(sessions.map((s) => s.classId));
    const pending = classes.filter((c) => !sessionClassIds.has(c.id));

    return {
      scope: "classes_pending",
      schoolId,
      program,
      date: day,
      totalClasses: classes.length,
      classesWithSessions: sessionClassIds.size,
      pendingCount: pending.length,
      classes: pending.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade?.name ?? null,
        stage: c.grade?.stage ?? null,
      })),
    };
  }

  async campusStatus(
    schoolId: string,
    programId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);
    const end = dayEndUTC(day);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: { id: true, name: true },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const [studentRows, staffRows, recentEvents] = await Promise.all([
      this.prisma.dailyAttendance.findMany({
        where: {
          schoolId,
          programId,
          personType: AttendancePersonType.STUDENT,
          date: day,
        },
        select: {
          personId: true,
          status: true,
          firstIn: true,
          lastOut: true,
          minutesOnSite: true,
          computedFrom: true,
        },
      }),
      this.prisma.dailyAttendance.findMany({
        where: {
          schoolId,
          programId,
          personType: AttendancePersonType.STAFF,
          date: day,
        },
        select: {
          personId: true,
          status: true,
          firstIn: true,
          lastOut: true,
          minutesOnSite: true,
          computedFrom: true,
        },
      }),
      this.prisma.attendanceEvent.findMany({
        where: {
          schoolId,
          programId,
          occurredAt: { gte: day, lte: end },
        },
        orderBy: { occurredAt: "desc" },
        take: 100,
        select: {
          id: true,
          personType: true,
          personId: true,
          eventType: true,
          source: true,
          occurredAt: true,
          deviceId: true,
        },
      }),
    ]);

    const studentsOnCampus = studentRows.filter((r) => !!r.firstIn && !r.lastOut);
    const staffOnCampus = staffRows.filter((r) => !!r.firstIn && !r.lastOut);

    const studentsCheckedOut = studentRows.filter((r) => !!r.firstIn && !!r.lastOut);
    const staffCheckedOut = staffRows.filter((r) => !!r.firstIn && !!r.lastOut);

    const sourceCounts = recentEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.source] = (acc[event.source] ?? 0) + 1;
      return acc;
    }, {});

    const eventTypeCounts = recentEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));

    for (const event of recentEvents) {
      const hour = event.occurredAt.getUTCHours();
      hourlyActivity[hour].count += 1;
    }

    const studentsPresent = studentRows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const studentsLate = studentRows.filter((r) => r.status === AttendanceStatus.LATE).length;
    const studentsAbsent = studentRows.filter((r) => r.status === AttendanceStatus.ABSENT).length;

    const staffPresent = staffRows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const staffLate = staffRows.filter((r) => r.status === AttendanceStatus.LATE).length;
    const staffAbsent = staffRows.filter((r) => r.status === AttendanceStatus.ABSENT).length;

    const alerts: string[] = [];
    if (studentsLate > 0) alerts.push(`${studentsLate} students late today`);
    if (staffLate > 0) alerts.push(`${staffLate} staff late today`);
    if (studentsAbsent > 0) alerts.push(`${studentsAbsent} students absent today`);
    if (staffAbsent > 0) alerts.push(`${staffAbsent} staff absent today`);

    return {
      scope: "campus_status",
      schoolId,
      program,
      date: day,
      occupancy: {
        studentsOnCampus: studentsOnCampus.length,
        staffOnCampus: staffOnCampus.length,
        studentsCheckedOut: studentsCheckedOut.length,
        staffCheckedOut: staffCheckedOut.length,
      },
      attendance: {
        students: {
          present: studentsPresent,
          late: studentsLate,
          absent: studentsAbsent,
        },
        staff: {
          present: staffPresent,
          late: staffLate,
          absent: staffAbsent,
        },
      },
      activity: {
        totalEvents: recentEvents.length,
        bySource: sourceCounts,
        byEventType: eventTypeCounts,
        byHour: hourlyActivity,
      },
      alerts,
      recentEvents: recentEvents.slice(0, 20),
    };
  }

  async controlCenterHeatMap(
    schoolId: string,
    programId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: {
        id: true,
        name: true,
        template: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const [classes, students, dailyRows, sessions, riskStudents] =
      await Promise.all([
        this.prisma.programClass.findMany({
          where: { programId },
          orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                id: true,
                name: true,
                order: true,
                stage: true,
              },
            },
          },
        }),
        this.prisma.student.findMany({
          where: { schoolId, programId, status: "ACTIVE" },
          select: {
            id: true,
            classId: true,
          },
        }),
        this.prisma.dailyAttendance.findMany({
          where: {
            schoolId,
            programId,
            personType: AttendancePersonType.STUDENT,
            date: day,
          },
          select: {
            personId: true,
            status: true,
          },
        }),
        this.prisma.attendanceSession.findMany({
          where: {
            schoolId,
            programId,
            date: day,
          },
          select: {
            classId: true,
          },
        }),
        this.computeRiskStudents(schoolId, programId, 30),
      ]);

    const studentsByClass = new Map<string, string[]>();
    for (const student of students) {
      const classId = student.classId ?? "";
      const arr = studentsByClass.get(classId) ?? [];
      arr.push(student.id);
      studentsByClass.set(classId, arr);
    }

    const attendanceByStudent = new Map(
      dailyRows.map((row) => [row.personId, row])
    );

    const sessionClassIds = new Set(sessions.map((s) => s.classId));

    const riskCountByClass = new Map<string, number>();
    for (const risk of riskStudents) {
      const classId = risk.student.class?.id;
      if (!classId) continue;
      riskCountByClass.set(classId, (riskCountByClass.get(classId) ?? 0) + 1);
    }

    const heatClasses = classes.map((cls) => {
      const studentIds = studentsByClass.get(cls.id) ?? [];
      const rows = studentIds
        .map((studentId) => attendanceByStudent.get(studentId))
        .filter(Boolean) as Array<{ personId: string; status: AttendanceStatus }>;

      const counts = this.buildStatusCounts(rows);
      const rosterCount = studentIds.length;
      const trackedCount = rows.length;
      const attendanceRate = this.makeRate(
        counts.PRESENT + counts.LATE + counts.EXCUSED,
        rosterCount
      );
      const riskCount = riskCountByClass.get(cls.id) ?? 0;
      const hasSession = sessionClassIds.has(cls.id);

      let status: "healthy" | "watch" | "risk" | "pending" = "healthy";

      if (!hasSession && trackedCount === 0) {
        status = "pending";
      } else if (
        attendanceRate < 60 ||
        counts.ABSENT >= Math.max(2, Math.ceil(rosterCount * 0.25)) ||
        riskCount > 0
      ) {
        status = "risk";
      } else if (
        attendanceRate < 85 ||
        counts.LATE > 0 ||
        trackedCount < rosterCount
      ) {
        status = "watch";
      }

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade?.name ?? null,
        rosterCount,
        trackedCount,
        present: counts.PRESENT,
        late: counts.LATE,
        absent: counts.ABSENT,
        excused: counts.EXCUSED,
        attendanceRate,
        riskCount,
        hasSession,
        status,
      };
    });

    return {
      scope: "control_center_heat_map",
      schoolId,
      programId,
      date: day,
      program,
      summary: {
        totalClasses: heatClasses.length,
        healthy: heatClasses.filter((c) => c.status === "healthy").length,
        watch: heatClasses.filter((c) => c.status === "watch").length,
        risk: heatClasses.filter((c) => c.status === "risk").length,
        pending: heatClasses.filter((c) => c.status === "pending").length,
      },
      classes: heatClasses,
    };
  }

  async classDrilldown(
    schoolId: string,
    programId: string,
    classId: string,
    dateStr?: string
  ) {
    const day = this.normalizeDashboardDay(dateStr);

    const schoolClass = await this.prisma.programClass.findFirst({
      where: {
        id: classId,
        programId,
      },
      select: {
        id: true,
        name: true,
        grade: {
          select: {
            id: true,
            name: true,
            order: true,
            stage: true,
          },
        },
      },
    });

    if (!schoolClass) {
      throw new NotFoundException("Class not found");
    }

    const [students, session, dailyRows] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          schoolId,
          programId,
          classId,
          status: "ACTIVE",
        },
        orderBy: {
          fullName: "asc",
        },
        select: {
          id: true,
          fullName: true,
          admissionNo: true,
        },
      }),
      this.prisma.attendanceSession.findFirst({
        where: {
          schoolId,
          programId,
          classId,
          date: day,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          periodName: true,
          createdAt: true,
          closedAt: true,
        },
      }),
      this.prisma.dailyAttendance.findMany({
        where: {
          schoolId,
          programId,
          date: day,
          personType: AttendancePersonType.STUDENT,
        },
        select: {
          personId: true,
          status: true,
          isLocked: true,
          firstIn: true,
          lastOut: true,
        },
      }),
    ]);

    const attendanceByStudent = new Map(
      dailyRows.map((row) => [row.personId, row])
    );

    const learners = students.map((student) => {
      const row = attendanceByStudent.get(student.id);

      return {
        id: student.id,
        fullName: student.fullName,
        admissionNo: student.admissionNo,
        status: row?.status ?? null,
        isTracked: !!row,
        isLocked: row?.isLocked ?? false,
        onCampus: !!row?.firstIn && !row?.lastOut,
      };
    });

    const trackedLearners = learners.filter((l) => l.isTracked);
    const counts = this.buildStatusCounts(
      trackedLearners
        .filter((l) => l.status)
        .map((l) => ({ status: l.status as AttendanceStatus }))
    );

    const rosterCount = learners.length;
    const trackedCount = trackedLearners.length;
    const untrackedCount = Math.max(0, rosterCount - trackedCount);
    const attendanceRate = this.makeRate(
      counts.PRESENT + counts.LATE + counts.EXCUSED,
      rosterCount
    );

    return {
      scope: "class_drilldown",
      date: day,
      class: schoolClass,
      session,
      summary: {
        rosterCount,
        trackedCount,
        untrackedCount,
        attendanceRate,
        counts,
      },
      groups: {
        absent: learners.filter((l) => l.status === AttendanceStatus.ABSENT),
        late: learners.filter((l) => l.status === AttendanceStatus.LATE),
        present: learners.filter((l) => l.status === AttendanceStatus.PRESENT),
        excused: learners.filter((l) => l.status === AttendanceStatus.EXCUSED),
        untracked: learners.filter((l) => !l.isTracked),
      },
      learners,
    };
  }

  private async computeRiskStudents(
    schoolId: string,
    programId?: string,
    days = 30
  ) {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;
    const today = this.normalizeDashboardDay();
    const start = new Date(today.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000);

    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        ...(programId ? { programId } : {}),
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        class: { select: { id: true, name: true } },
      },
    });

    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return [];
    }

    const [rows, changes] = await Promise.all([
      this.prisma.dailyAttendance.findMany({
        where: {
          schoolId,
          ...(programId ? { programId } : {}),
          personType: AttendancePersonType.STUDENT,
          personId: { in: studentIds },
          date: { gte: start, lte: today },
        },
        select: {
          personId: true,
          status: true,
        },
      }),
      this.prisma.dailyAttendanceChange.findMany({
        where: {
          schoolId,
          ...(programId ? { programId } : {}),
          personType: AttendancePersonType.STUDENT,
          personId: { in: studentIds },
          date: { gte: start, lte: today },
          changeType: DailyAttendanceChangeType.STATUS,
        },
        select: {
          personId: true,
        },
      }),
    ]);

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

    return students
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

        const riskScore = counts.ABSENT * 3 + counts.LATE + overrideCount;

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
  }
}