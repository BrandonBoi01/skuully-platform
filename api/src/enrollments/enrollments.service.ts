import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EnrollmentStatus,
  EnrollmentType,
  StudentStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentEnrollmentDto } from "./dto/create-student-enrollment.dto";
import { PromoteStudentDto } from "./dto/promote-student.dto";
import { TransferStudentDto } from "./dto/transfer-student.dto";
import { GraduateStudentDto } from "./dto/graduate-student.dto";
import { WithdrawStudentDto } from "./dto/withdraw-student.dto";
import { ChangeClassDto } from "./dto/change-class.dto";
import { ChangeProgramDto } from "./dto/change-program.dto";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listEnrollments(institutionId: string, studentId: string) {
    await this.assertStudentBelongsToInstitution(institutionId, studentId);

    return this.prisma.studentEnrollment.findMany({
      where: {
        institutionId,
        studentProfileId: studentId,
      },
      orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        institutionId: true,
        studentProfileId: true,
        programId: true,
        gradeId: true,
        classId: true,
        academicYear: true,
        termLabel: true,
        enrollmentType: true,
        status: true,
        admittedAt: true,
        effectiveFrom: true,
        effectiveTo: true,
        note: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
            order: true,
            stage: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            skuullyId: true,
          },
        },
      },
    });
  }

  async createEnrollment(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: CreateStudentEnrollmentDto,
  ) {
    const student = await this.getStudentOrThrow(institutionId, studentId);

    await this.assertProgramBelongsToInstitution(institutionId, dto.programId);

    if (dto.gradeId) {
      await this.assertGradeBelongsToProgram(dto.programId, dto.gradeId);
    }

    if (dto.classId) {
      await this.assertClassBelongsToInstitution(institutionId, dto.classId);
      await this.assertClassBelongsToProgram(dto.classId, dto.programId);
      if (dto.gradeId) {
        await this.assertClassBelongsToGrade(dto.classId, dto.gradeId);
      }
    }

    const activeEnrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        institutionId,
        studentProfileId: studentId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (activeEnrollment) {
      throw new BadRequestException(
        "Student already has an active enrollment. Close or transition it first",
      );
    }

    const effectiveFrom = new Date(dto.effectiveFrom);
    const admittedAt = dto.admittedAt ? new Date(dto.admittedAt) : null;

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentEnrollment.create({
        data: {
          institutionId,
          studentProfileId: studentId,
          programId: dto.programId,
          gradeId: dto.gradeId ?? null,
          classId: dto.classId ?? null,
          academicYear: this.normalizeOptionalText(dto.academicYear) ?? null,
          termLabel: this.normalizeOptionalText(dto.termLabel) ?? null,
          enrollmentType: dto.enrollmentType ?? EnrollmentType.NEW_ADMISSION,
          status: EnrollmentStatus.ACTIVE,
          admittedAt,
          effectiveFrom,
          note: this.normalizeOptionalText(dto.note) ?? null,
          createdByUserId,
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          programId: true,
          gradeId: true,
          classId: true,
          academicYear: true,
          termLabel: true,
          enrollmentType: true,
          status: true,
          admittedAt: true,
          effectiveFrom: true,
          effectiveTo: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          programId: dto.programId,
          classId: dto.classId ?? null,
          status: StudentStatus.ACTIVE,
          joinedAt: student.joinedAt ?? admittedAt ?? effectiveFrom,
        },
      });

      return created;
    });

    return {
      message: "Student enrollment created successfully",
      enrollment,
    };
  }

  async promoteStudent(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: PromoteStudentDto,
  ) {
    return this.transitionEnrollment(
      institutionId,
      studentId,
      createdByUserId,
      {
        programId: dto.programId,
        gradeId: dto.gradeId ?? null,
        classId: dto.classId ?? null,
        academicYear: dto.academicYear,
        termLabel: dto.termLabel,
        note: dto.note,
        effectiveFrom: dto.effectiveFrom,
        enrollmentType: EnrollmentType.PROMOTION,
        nextStudentStatus: StudentStatus.ACTIVE,
      },
    );
  }

  async changeClass(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: ChangeClassDto,
  ) {
    const student = await this.getStudentOrThrow(institutionId, studentId);

    if (!student.programId) {
      throw new BadRequestException(
        "Student must have a current program before changing class",
      );
    }

    const classRoom = await this.prisma.classRoom.findFirst({
      where: {
        id: dto.classId,
        institutionId,
        programId: student.programId,
      },
      select: {
        id: true,
        gradeId: true,
      },
    });

    if (!classRoom) {
      throw new BadRequestException(
        "Selected class does not belong to the student's current program",
      );
    }

    return this.transitionEnrollment(
      institutionId,
      studentId,
      createdByUserId,
      {
        programId: student.programId,
        gradeId: classRoom.gradeId ?? null,
        classId: dto.classId,
        note: dto.note,
        effectiveFrom: dto.effectiveFrom,
        enrollmentType: EnrollmentType.CLASS_CHANGE,
        nextStudentStatus: StudentStatus.ACTIVE,
      },
    );
  }

  async changeProgram(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: ChangeProgramDto,
  ) {
    return this.transitionEnrollment(
      institutionId,
      studentId,
      createdByUserId,
      {
        programId: dto.programId,
        gradeId: dto.gradeId ?? null,
        classId: dto.classId ?? null,
        note: dto.note,
        effectiveFrom: dto.effectiveFrom,
        enrollmentType: EnrollmentType.PROGRAM_CHANGE,
        nextStudentStatus: StudentStatus.ACTIVE,
      },
    );
  }

  async transferStudent(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: TransferStudentDto,
  ) {
    const active = await this.getActiveEnrollmentOrThrow(institutionId, studentId);
    const effectiveFrom = new Date(dto.effectiveFrom);

    if (effectiveFrom < active.effectiveFrom) {
      throw new BadRequestException(
        "Transfer date cannot be earlier than active enrollment start date",
      );
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const closed = await tx.studentEnrollment.update({
        where: { id: active.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          effectiveTo: effectiveFrom,
          note: this.mergeNotes(active.note, dto.note),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          programId: true,
          gradeId: true,
          classId: true,
          enrollmentType: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
          note: true,
        },
      });

      await tx.studentEnrollment.create({
        data: {
          institutionId,
          studentProfileId: studentId,
          programId: active.programId,
          gradeId: active.gradeId,
          classId: active.classId,
          enrollmentType: EnrollmentType.TRANSFER_OUT,
          status: EnrollmentStatus.COMPLETED,
          effectiveFrom,
          effectiveTo: effectiveFrom,
          note: this.normalizeOptionalText(dto.note) ?? null,
          createdByUserId,
          academicYear: active.academicYear,
          termLabel: active.termLabel,
        },
      });

      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          status: StudentStatus.TRANSFERRED,
          classId: null,
        },
      });

      return closed;
    });

    return {
      message: "Student transferred successfully",
      enrollment,
    };
  }

  async graduateStudent(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: GraduateStudentDto,
  ) {
    return this.closeEnrollmentWithStatus(
      institutionId,
      studentId,
      createdByUserId,
      dto.effectiveFrom,
      dto.note,
      EnrollmentType.GRADUATION,
      StudentStatus.GRADUATED,
      "Student graduated successfully",
    );
  }

  async withdrawStudent(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    dto: WithdrawStudentDto,
  ) {
    return this.closeEnrollmentWithStatus(
      institutionId,
      studentId,
      createdByUserId,
      dto.effectiveFrom,
      dto.note,
      EnrollmentType.WITHDRAWAL,
      StudentStatus.ARCHIVED,
      "Student withdrawn successfully",
    );
  }

  private async transitionEnrollment(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    input: {
      programId: string;
      gradeId: string | null;
      classId: string | null;
      academicYear?: string;
      termLabel?: string;
      note?: string;
      effectiveFrom: string;
      enrollmentType: EnrollmentType;
      nextStudentStatus: StudentStatus;
    },
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, input.programId);

    if (input.gradeId) {
      await this.assertGradeBelongsToProgram(input.programId, input.gradeId);
    }

    if (input.classId) {
      await this.assertClassBelongsToInstitution(institutionId, input.classId);
      await this.assertClassBelongsToProgram(input.classId, input.programId);
      if (input.gradeId) {
        await this.assertClassBelongsToGrade(input.classId, input.gradeId);
      }
    }

    const active = await this.getActiveEnrollmentOrThrow(institutionId, studentId);
    const effectiveFrom = new Date(input.effectiveFrom);

    if (effectiveFrom < active.effectiveFrom) {
      throw new BadRequestException(
        "New enrollment effective date cannot be earlier than current enrollment start date",
      );
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      await tx.studentEnrollment.update({
        where: { id: active.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          effectiveTo: effectiveFrom,
        },
      });

      const created = await tx.studentEnrollment.create({
        data: {
          institutionId,
          studentProfileId: studentId,
          programId: input.programId,
          gradeId: input.gradeId,
          classId: input.classId,
          academicYear: this.normalizeOptionalText(input.academicYear) ?? active.academicYear ?? null,
          termLabel: this.normalizeOptionalText(input.termLabel) ?? active.termLabel ?? null,
          enrollmentType: input.enrollmentType,
          status: EnrollmentStatus.ACTIVE,
          admittedAt: active.admittedAt,
          effectiveFrom,
          note: this.normalizeOptionalText(input.note) ?? null,
          createdByUserId,
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          programId: true,
          gradeId: true,
          classId: true,
          academicYear: true,
          termLabel: true,
          enrollmentType: true,
          status: true,
          admittedAt: true,
          effectiveFrom: true,
          effectiveTo: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          programId: input.programId,
          classId: input.classId,
          status: input.nextStudentStatus,
        },
      });

      return created;
    });

    return {
      message: "Student enrollment updated successfully",
      enrollment,
    };
  }

  private async closeEnrollmentWithStatus(
    institutionId: string,
    studentId: string,
    createdByUserId: string,
    effectiveFromInput: string,
    noteInput: string | undefined,
    enrollmentType: EnrollmentType,
    nextStudentStatus: StudentStatus,
    message: string,
  ) {
    const active = await this.getActiveEnrollmentOrThrow(institutionId, studentId);
    const effectiveFrom = new Date(effectiveFromInput);

    if (effectiveFrom < active.effectiveFrom) {
      throw new BadRequestException(
        "Closing date cannot be earlier than active enrollment start date",
      );
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      await tx.studentEnrollment.update({
        where: { id: active.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          effectiveTo: effectiveFrom,
        },
      });

      const created = await tx.studentEnrollment.create({
        data: {
          institutionId,
          studentProfileId: studentId,
          programId: active.programId,
          gradeId: active.gradeId,
          classId: active.classId,
          academicYear: active.academicYear,
          termLabel: active.termLabel,
          enrollmentType,
          status: EnrollmentStatus.COMPLETED,
          admittedAt: active.admittedAt,
          effectiveFrom,
          effectiveTo: effectiveFrom,
          note: this.normalizeOptionalText(noteInput) ?? null,
          createdByUserId,
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          programId: true,
          gradeId: true,
          classId: true,
          academicYear: true,
          termLabel: true,
          enrollmentType: true,
          status: true,
          admittedAt: true,
          effectiveFrom: true,
          effectiveTo: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          status: nextStudentStatus,
          classId: null,
        },
      });

      return created;
    });

    return {
      message,
      enrollment,
    };
  }

  private async getStudentOrThrow(institutionId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: {
        id: true,
        joinedAt: true,
        programId: true,
        classId: true,
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return student;
  }

  private async getActiveEnrollmentOrThrow(
    institutionId: string,
    studentId: string,
  ) {
    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        institutionId,
        studentProfileId: studentId,
        status: EnrollmentStatus.ACTIVE,
      },
      orderBy: [{ effectiveFrom: "desc" }],
      select: {
        id: true,
        institutionId: true,
        studentProfileId: true,
        programId: true,
        gradeId: true,
        classId: true,
        academicYear: true,
        termLabel: true,
        admittedAt: true,
        note: true,
        effectiveFrom: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException("Student has no active enrollment");
    }

    return enrollment;
  }

  private async assertStudentBelongsToInstitution(
    institutionId: string,
    studentId: string,
  ) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }
  }

  private async assertProgramBelongsToInstitution(
    institutionId: string,
    programId: string,
  ) {
    const program = await this.prisma.program.findFirst({
      where: {
        id: programId,
        institutionId,
      },
      select: { id: true },
    });

    if (!program) {
      throw new BadRequestException("Program not found in this institution");
    }
  }

  private async assertGradeBelongsToProgram(programId: string, gradeId: string) {
    const grade = await this.prisma.programGrade.findFirst({
      where: {
        id: gradeId,
        programId,
      },
      select: { id: true },
    });

    if (!grade) {
      throw new BadRequestException("Grade not found in this program");
    }
  }

  private async assertClassBelongsToInstitution(
    institutionId: string,
    classId: string,
  ) {
    const classRoom = await this.prisma.classRoom.findFirst({
      where: {
        id: classId,
        institutionId,
      },
      select: { id: true },
    });

    if (!classRoom) {
      throw new BadRequestException("Class not found in this institution");
    }
  }

  private async assertClassBelongsToProgram(classId: string, programId: string) {
    const classRoom = await this.prisma.classRoom.findFirst({
      where: {
        id: classId,
        programId,
      },
      select: { id: true },
    });

    if (!classRoom) {
      throw new BadRequestException(
        "Selected class does not belong to selected program",
      );
    }
  }

  private async assertClassBelongsToGrade(classId: string, gradeId: string) {
    const classRoom = await this.prisma.classRoom.findFirst({
      where: {
        id: classId,
        gradeId,
      },
      select: { id: true },
    });

    if (!classRoom) {
      throw new BadRequestException(
        "Selected class does not belong to selected grade",
      );
    }
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned.length ? cleaned : null;
  }

  private mergeNotes(existing?: string | null, next?: string | null) {
    const left = this.normalizeOptionalText(existing);
    const right = this.normalizeOptionalText(next);

    if (left && right) return `${left}\n${right}`;
    return left ?? right ?? null;
  }
}