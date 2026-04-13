import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ProgramStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { ListProgramsQueryDto } from "./dto/list-programs-query.dto";
import { CreateClassRoomDto } from "./dto/create-class-room.dto";
import { UpdateClassRoomDto } from "./dto/update-class-room.dto";
import { ListClassRoomsQueryDto } from "./dto/list-class-rooms-query.dto";
import { CreateProgramGradeDto } from "./dto/create-program-grade.dto";
import { UpdateProgramGradeDto } from "./dto/update-program-grade.dto";

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPrograms(institutionId: string, query: ListProgramsQueryDto) {
    await this.assertInstitutionExists(institutionId);

    const search = query.search?.trim();
    const status = query.status;

    const where: Prisma.ProgramWhereInput = {
      institutionId,
      ...(status ? { status } : {}),
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

    return this.prisma.program.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        institutionId: true,
        templateId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            classes: true,
            grades: true,
            subjects: true,
            students: true,
          },
        },
      },
    });
  }

  async getProgramById(institutionId: string, programId: string) {
    const program = await this.prisma.program.findFirst({
      where: {
        id: programId,
        institutionId,
      },
      select: {
        id: true,
        institutionId: true,
        templateId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        template: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        grades: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            programId: true,
            templateGradeId: true,
            name: true,
            order: true,
            stage: true,
            _count: {
              select: {
                classes: true,
                subjects: true,
              },
            },
          },
        },
        subjects: {
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            code: true,
            isCore: true,
          },
        },
        classes: {
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            institutionId: true,
            programId: true,
            gradeId: true,
            name: true,
            code: true,
            capacity: true,
            createdAt: true,
            updatedAt: true,
            grade: {
              select: {
                id: true,
                name: true,
                order: true,
                stage: true,
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            classes: true,
            grades: true,
            subjects: true,
            students: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    return program;
  }

  async createProgram(institutionId: string, dto: CreateProgramDto) {
    await this.assertInstitutionExists(institutionId);

    const name = this.normalizeRequiredText(dto.name, "Program name");
    const code = this.normalizeOptionalCode(dto.code);
    const templateId = dto.templateId?.trim() || null;

    if (templateId) {
      await this.assertCurriculumTemplateExists(templateId);
    }

    const duplicateByName = await this.prisma.program.findFirst({
      where: {
        institutionId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateByName) {
      throw new BadRequestException("Program name already exists");
    }

    if (code) {
      const duplicateByCode = await this.prisma.program.findFirst({
        where: {
          institutionId,
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Program code already exists");
      }
    }

    const program = await this.prisma.program.create({
      data: {
        institutionId,
        name,
        code,
        templateId,
        status: dto.status ?? ProgramStatus.ACTIVE,
      },
      select: {
        id: true,
        institutionId: true,
        templateId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Program created successfully",
      program,
    };
  }

  async updateProgram(
    institutionId: string,
    programId: string,
    dto: UpdateProgramDto,
  ) {
    const existing = await this.prisma.program.findFirst({
      where: {
        id: programId,
        institutionId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Program not found");
    }

    const name =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name, "Program name")
        : undefined;

    const code =
      dto.code !== undefined ? this.normalizeOptionalCode(dto.code) : undefined;

    const templateId =
      dto.templateId !== undefined ? dto.templateId?.trim() || null : undefined;

    if (templateId) {
      await this.assertCurriculumTemplateExists(templateId);
    }

    if (name) {
      const duplicateByName = await this.prisma.program.findFirst({
        where: {
          institutionId,
          id: { not: programId },
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateByName) {
        throw new BadRequestException("Program name already exists");
      }
    }

    if (code) {
      const duplicateByCode = await this.prisma.program.findFirst({
        where: {
          institutionId,
          id: { not: programId },
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Program code already exists");
      }
    }

    const program = await this.prisma.program.update({
      where: { id: programId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(templateId !== undefined ? { templateId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: {
        id: true,
        institutionId: true,
        templateId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Program updated successfully",
      program,
    };
  }

  async listClassRooms(
    institutionId: string,
    programId: string,
    query: ListClassRoomsQueryDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const search = query.search?.trim();

    const where: Prisma.ClassRoomWhereInput = {
      institutionId,
      programId,
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

    return this.prisma.classRoom.findMany({
      where,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        institutionId: true,
        programId: true,
        gradeId: true,
        name: true,
        code: true,
        capacity: true,
        createdAt: true,
        updatedAt: true,
        grade: {
          select: {
            id: true,
            name: true,
            order: true,
            stage: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async getClassRoomById(
    institutionId: string,
    programId: string,
    classRoomId: string,
  ) {
    const classRoom = await this.prisma.classRoom.findFirst({
      where: {
        id: classRoomId,
        institutionId,
        programId,
      },
      select: {
        id: true,
        institutionId: true,
        programId: true,
        gradeId: true,
        name: true,
        code: true,
        capacity: true,
        createdAt: true,
        updatedAt: true,
        grade: {
          select: {
            id: true,
            name: true,
            order: true,
            stage: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classRoom) {
      throw new NotFoundException("Class not found");
    }

    return classRoom;
  }

  async createClassRoom(
    institutionId: string,
    programId: string,
    dto: CreateClassRoomDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const name = this.normalizeRequiredText(dto.name, "Class name");
    const code = this.normalizeOptionalCode(dto.code);
    const gradeId = dto.gradeId?.trim() || null;

    if (gradeId) {
      await this.assertGradeBelongsToProgram(programId, gradeId);
    }

    const duplicateByName = await this.prisma.classRoom.findFirst({
      where: {
        institutionId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateByName) {
      throw new BadRequestException("Class name already exists in this institution");
    }

    if (code) {
      const duplicateByCode = await this.prisma.classRoom.findFirst({
        where: {
          institutionId,
          programId,
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Class code already exists in this program");
      }
    }

    const classRoom = await this.prisma.classRoom.create({
      data: {
        institutionId,
        programId,
        gradeId,
        name,
        code,
        capacity: dto.capacity ?? null,
      },
      select: {
        id: true,
        institutionId: true,
        programId: true,
        gradeId: true,
        name: true,
        code: true,
        capacity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Class created successfully",
      classRoom,
    };
  }

  async updateClassRoom(
    institutionId: string,
    programId: string,
    classRoomId: string,
    dto: UpdateClassRoomDto,
  ) {
    const existing = await this.prisma.classRoom.findFirst({
      where: {
        id: classRoomId,
        institutionId,
        programId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Class not found");
    }

    const name =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name, "Class name")
        : undefined;

    const code =
      dto.code !== undefined ? this.normalizeOptionalCode(dto.code) : undefined;

    const gradeId =
      dto.gradeId !== undefined ? dto.gradeId?.trim() || null : undefined;

    if (gradeId) {
      await this.assertGradeBelongsToProgram(programId, gradeId);
    }

    if (name) {
      const duplicateByName = await this.prisma.classRoom.findFirst({
        where: {
          institutionId,
          id: { not: classRoomId },
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateByName) {
        throw new BadRequestException("Class name already exists in this institution");
      }
    }

    if (code) {
      const duplicateByCode = await this.prisma.classRoom.findFirst({
        where: {
          institutionId,
          programId,
          id: { not: classRoomId },
          code,
        },
        select: { id: true },
      });

      if (duplicateByCode) {
        throw new BadRequestException("Class code already exists in this program");
      }
    }

    const classRoom = await this.prisma.classRoom.update({
      where: { id: classRoomId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(gradeId !== undefined ? { gradeId } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      },
      select: {
        id: true,
        institutionId: true,
        programId: true,
        gradeId: true,
        name: true,
        code: true,
        capacity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Class updated successfully",
      classRoom,
    };
  }

  async listProgramGrades(institutionId: string, programId: string) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    return this.prisma.programGrade.findMany({
      where: {
        programId,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        programId: true,
        templateGradeId: true,
        name: true,
        order: true,
        stage: true,
        _count: {
          select: {
            classes: true,
            subjects: true,
          },
        },
      },
    });
  }

  async getProgramGradeById(
    institutionId: string,
    programId: string,
    gradeId: string,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const grade = await this.prisma.programGrade.findFirst({
      where: {
        id: gradeId,
        programId,
      },
      select: {
        id: true,
        programId: true,
        templateGradeId: true,
        name: true,
        order: true,
        stage: true,
        classes: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            institutionId: true,
            programId: true,
            gradeId: true,
            name: true,
            code: true,
            capacity: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        subjects: {
          select: {
            id: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                isCore: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException("Program grade not found");
    }

    return grade;
  }

  async createProgramGrade(
    institutionId: string,
    programId: string,
    dto: CreateProgramGradeDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const name = this.normalizeRequiredText(dto.name, "Grade name");
    const stage = this.normalizeOptionalText(dto.stage);
    const templateGradeId = dto.templateGradeId?.trim() || null;

    const duplicateByName = await this.prisma.programGrade.findFirst({
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
      throw new BadRequestException("Grade name already exists in this program");
    }

    const duplicateByOrder = await this.prisma.programGrade.findFirst({
      where: {
        programId,
        order: dto.order,
      },
      select: { id: true },
    });

    if (duplicateByOrder) {
      throw new BadRequestException("Grade order already exists in this program");
    }

    const grade = await this.prisma.programGrade.create({
      data: {
        programId,
        templateGradeId,
        name,
        order: dto.order,
        stage,
      },
      select: {
        id: true,
        programId: true,
        templateGradeId: true,
        name: true,
        order: true,
        stage: true,
      },
    });

    return {
      message: "Program grade created successfully",
      grade,
    };
  }

  async updateProgramGrade(
    institutionId: string,
    programId: string,
    gradeId: string,
    dto: UpdateProgramGradeDto,
  ) {
    await this.assertProgramBelongsToInstitution(institutionId, programId);

    const existing = await this.prisma.programGrade.findFirst({
      where: {
        id: gradeId,
        programId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Program grade not found");
    }

    const name =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name, "Grade name")
        : undefined;

    const stage =
      dto.stage !== undefined ? this.normalizeOptionalText(dto.stage) : undefined;

    const templateGradeId =
      dto.templateGradeId !== undefined
        ? dto.templateGradeId?.trim() || null
        : undefined;

    if (name) {
      const duplicateByName = await this.prisma.programGrade.findFirst({
        where: {
          programId,
          id: { not: gradeId },
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateByName) {
        throw new BadRequestException("Grade name already exists in this program");
      }
    }

    if (dto.order !== undefined) {
      const duplicateByOrder = await this.prisma.programGrade.findFirst({
        where: {
          programId,
          id: { not: gradeId },
          order: dto.order,
        },
        select: { id: true },
      });

      if (duplicateByOrder) {
        throw new BadRequestException("Grade order already exists in this program");
      }
    }

    const grade = await this.prisma.programGrade.update({
      where: { id: gradeId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(stage !== undefined ? { stage } : {}),
        ...(templateGradeId !== undefined ? { templateGradeId } : {}),
      },
      select: {
        id: true,
        programId: true,
        templateGradeId: true,
        name: true,
        order: true,
        stage: true,
      },
    });

    return {
      message: "Program grade updated successfully",
      grade,
    };
  }

  private async assertInstitutionExists(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true },
    });

    if (!institution) {
      throw new NotFoundException("Institution not found");
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

  private async assertCurriculumTemplateExists(templateId: string) {
    const template = await this.prisma.curriculumTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });

    if (!template) {
      throw new BadRequestException("Curriculum template not found");
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

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned.length ? cleaned : null;
  }
}