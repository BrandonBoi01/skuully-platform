import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProgramSubjectDto } from "./dto/create-program-subject.dto";
import { UpdateProgramSubjectDto } from "./dto/update-program-subject.dto";
import { ListProgramSubjectsQueryDto } from "./dto/list-program-subjects-query.dto";
import { AssignSubjectToGradeDto } from "./dto/assign-subject-to-grade.dto";

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProgramSubjects(
    institutionId: string,
    programId: string,
    query: ListProgramSubjectsQueryDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const search = query.search?.trim();
    const isCore = query.isCore;

    const where: Prisma.ProgramSubjectWhereInput = {
      programId,
      ...(typeof isCore === "boolean" ? { isCore } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.programSubject.findMany({
      where,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        programId: true,
        templateSubjectId: true,
        name: true,
        code: true,
        isCore: true,
        _count: {
          select: {
            grades: true,
          },
        },
      },
    });
  }

  async getProgramSubjectById(
    institutionId: string,
    programId: string,
    subjectId: string,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const subject = await this.prisma.programSubject.findFirst({
      where: {
        id: subjectId,
        programId,
      },
      select: {
        id: true,
        programId: true,
        templateSubjectId: true,
        name: true,
        code: true,
        isCore: true,
        grades: {
          select: {
            id: true,
            grade: {
              select: {
                id: true,
                name: true,
                order: true,
                stage: true,
              },
            },
          },
          orderBy: {
            grade: {
              order: "asc",
            },
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException("Program subject not found");
    }

    return subject;
  }

  async createProgramSubject(
    institutionId: string,
    programId: string,
    dto: CreateProgramSubjectDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const name = this.normalizeRequiredText(dto.name, "Subject name");
    const code = this.normalizeOptionalCode(dto.code);

    const duplicateByName = await this.prisma.programSubject.findFirst({
      where: {
        programId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateByName) {
      throw new BadRequestException("Subject name already exists in this program");
    }

    if (code) {
      const duplicateByCode = await this.prisma.programSubject.findFirst({
        where: {
          programId,
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Subject code already exists in this program");
      }
    }

    const subject = await this.prisma.programSubject.create({
      data: {
        programId,
        name,
        code,
        isCore: dto.isCore ?? true,
      },
      select: {
        id: true,
        programId: true,
        templateSubjectId: true,
        name: true,
        code: true,
        isCore: true,
      },
    });

    return {
      message: "Program subject created successfully",
      subject,
    };
  }

  async updateProgramSubject(
    institutionId: string,
    programId: string,
    subjectId: string,
    dto: UpdateProgramSubjectDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const existing = await this.prisma.programSubject.findFirst({
      where: {
        id: subjectId,
        programId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Program subject not found");
    }

    const name =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name, "Subject name")
        : undefined;

    const code =
      dto.code !== undefined ? this.normalizeOptionalCode(dto.code) : undefined;

    if (name) {
      const duplicateByName = await this.prisma.programSubject.findFirst({
        where: {
          programId,
          id: { not: subjectId },
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateByName) {
        throw new BadRequestException("Subject name already exists in this program");
      }
    }

    if (code) {
      const duplicateByCode = await this.prisma.programSubject.findFirst({
        where: {
          programId,
          id: { not: subjectId },
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Subject code already exists in this program");
      }
    }

    const subject = await this.prisma.programSubject.update({
      where: { id: subjectId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(dto.isCore !== undefined ? { isCore: dto.isCore } : {}),
      },
      select: {
        id: true,
        programId: true,
        templateSubjectId: true,
        name: true,
        code: true,
        isCore: true,
      },
    });

    return {
      message: "Program subject updated successfully",
      subject,
    };
  }

  async listGradeSubjects(
    institutionId: string,
    programId: string,
    gradeId: string,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);
    await this.assertGradeBelongsToProgram(programId, gradeId);

    return this.prisma.programGradeSubject.findMany({
      where: {
        gradeId,
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
      select: {
        id: true,
        gradeId: true,
        subjectId: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            isCore: true,
          },
        },
      },
    });
  }

  async assignSubjectToGrade(
    institutionId: string,
    programId: string,
    gradeId: string,
    dto: AssignSubjectToGradeDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);
    await this.assertGradeBelongsToProgram(programId, gradeId);
    await this.assertSubjectBelongsToProgram(programId, dto.subjectId);

    const link = await this.prisma.programGradeSubject.upsert({
      where: {
        gradeId_subjectId: {
          gradeId,
          subjectId: dto.subjectId,
        },
      },
      update: {},
      create: {
        gradeId,
        subjectId: dto.subjectId,
      },
      select: {
        id: true,
        gradeId: true,
        subjectId: true,
        grade: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            isCore: true,
          },
        },
      },
    });

    return {
      message: "Subject assigned to grade successfully",
      assignment: link,
    };
  }

  async removeSubjectFromGrade(
    institutionId: string,
    programId: string,
    gradeId: string,
    subjectId: string,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);
    await this.assertGradeBelongsToProgram(programId, gradeId);
    await this.assertSubjectBelongsToProgram(programId, subjectId);

    const existing = await this.prisma.programGradeSubject.findFirst({
      where: {
        gradeId,
        subjectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Subject is not assigned to this grade");
    }

    await this.prisma.programGradeSubject.delete({
      where: {
        gradeId_subjectId: {
          gradeId,
          subjectId,
        },
      },
    });

    return {
      message: "Subject removed from grade successfully",
    };
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

  private async assertSubjectBelongsToProgram(programId: string, subjectId: string) {
    const subject = await this.prisma.programSubject.findFirst({
      where: {
        id: subjectId,
        programId,
      },
      select: { id: true },
    });

    if (!subject) {
      throw new BadRequestException("Subject not found in this program");
    }
  }

  private normalizeRequiredText(value: string, fieldLabel: string) {
    const cleaned = value.replace(/\s+/g, " ").trim();

    if (!cleaned) {
      throw new BadRequestException(`${fieldLabel} is required`);
    }

    return cleaned;
  }

  private normalizeOptionalCode(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.replace(/\s+/g, " ").trim().toUpperCase();
    return cleaned.length ? cleaned : null;
  }
}