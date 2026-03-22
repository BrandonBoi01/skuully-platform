import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { MembershipType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProgramDto } from "./dto/create-program.dto";

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async listTemplates() {
    return this.prisma.curriculumTemplate.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    });
  }

  async listPrograms(schoolId: string) {
    return this.prisma.schoolProgram.findMany({
      where: { schoolId },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        status: true,
        template: {
          select: {
            code: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createProgram(schoolId: string, dto: CreateProgramDto) {
    const templateCode = dto.templateCode?.trim().toUpperCase();
    const programName = dto.name?.trim();

    if (!templateCode) {
      throw new BadRequestException("templateCode is required");
    }

    if (!programName) {
      throw new BadRequestException("name is required");
    }

    const template = await this.prisma.curriculumTemplate.findUnique({
      where: { code: templateCode },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    try {
      const program = await this.prisma.schoolProgram.create({
        data: {
          schoolId,
          templateId: template.id,
          name: programName,
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          template: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      return {
        message: "Program created",
        program,
      };
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "Program name already exists in this school"
        );
      }
      throw e;
    }
  }

  private async ensureGenericTemplateHasDefaults(
    templateId: string,
    templateCode: string
  ) {
    if (templateCode !== "GENERIC") {
      return;
    }

    const existingTemplate = await this.prisma.curriculumTemplate.findUnique({
      where: { id: templateId },
      include: {
        grades: {
          include: {
            subjects: true,
          },
        },
        subjects: true,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundException("Template not found");
    }

    const hasGrades = existingTemplate.grades.length > 0;
    const hasSubjects = existingTemplate.subjects.length > 0;

    if (hasGrades && hasSubjects) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      let templateSubjects = existingTemplate.subjects;

      if (!hasSubjects) {
        const defaultSubjects = [
          { name: "English", code: "ENG", isCore: true },
          { name: "Mathematics", code: "MATH", isCore: true },
          { name: "Science", code: "SCI", isCore: true },
          { name: "Kiswahili", code: "KIS", isCore: true },
          { name: "Social Studies", code: "SST", isCore: true },
        ];

        for (const subject of defaultSubjects) {
          await tx.curriculumTemplateSubject.create({
            data: {
              templateId,
              name: subject.name,
              code: subject.code,
              isCore: subject.isCore,
            },
          });
        }

        templateSubjects = await tx.curriculumTemplateSubject.findMany({
          where: { templateId },
          orderBy: { name: "asc" },
        });
      }

      if (!hasGrades) {
        const defaultGrades = [
          { name: "Grade 1", order: 1, stage: "Primary" },
          { name: "Grade 2", order: 2, stage: "Primary" },
          { name: "Grade 3", order: 3, stage: "Primary" },
          { name: "Grade 4", order: 4, stage: "Primary" },
          { name: "Grade 5", order: 5, stage: "Primary" },
          { name: "Grade 6", order: 6, stage: "Primary" },
          { name: "Grade 7", order: 7, stage: "Primary" },
          { name: "Grade 8", order: 8, stage: "Primary" },
        ];

        for (const grade of defaultGrades) {
          const createdGrade = await tx.curriculumTemplateGrade.create({
            data: {
              templateId,
              name: grade.name,
              order: grade.order,
              stage: grade.stage,
            },
          });

          for (const subject of templateSubjects) {
            await tx.curriculumTemplateGradeSubject.create({
              data: {
                gradeId: createdGrade.id,
                subjectId: subject.id,
              },
            });
          }
        }
      }
    });
  }

  async seedProgram(schoolId: string, programId: string) {
    const baseProgram = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: {
        id: true,
        templateId: true,
        template: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!baseProgram) {
      throw new NotFoundException("Program not found");
    }

    await this.ensureGenericTemplateHasDefaults(
      baseProgram.templateId,
      baseProgram.template.code
    );

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      include: {
        template: {
          include: {
            grades: {
              orderBy: { order: "asc" },
              include: {
                subjects: true,
              },
            },
            subjects: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const alreadySeeded = await this.prisma.programGrade.findFirst({
      where: { programId },
      select: { id: true },
    });

    if (alreadySeeded) {
      throw new BadRequestException("Program already seeded");
    }

    if (program.template.grades.length === 0) {
      throw new BadRequestException(
        "Template has no grades. Add template grades before seeding."
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const gradeMap = new Map<string, string>();
      const subjectMap = new Map<string, string>();

      for (const subject of program.template.subjects) {
        const created = await tx.programSubject.create({
          data: {
            programId,
            templateSubjectId: subject.id,
            name: subject.name,
            code: subject.code,
            isCore: subject.isCore,
          },
          select: { id: true },
        });

        subjectMap.set(subject.id, created.id);
      }

      for (const grade of program.template.grades) {
        const created = await tx.programGrade.create({
          data: {
            programId,
            templateGradeId: grade.id,
            name: grade.name,
            order: grade.order,
            stage: grade.stage,
          },
          select: { id: true },
        });

        gradeMap.set(grade.id, created.id);
      }

      for (const grade of program.template.grades) {
        const programGradeId = gradeMap.get(grade.id);
        if (!programGradeId) continue;

        for (const link of grade.subjects) {
          const programSubjectId = subjectMap.get(link.subjectId);
          if (!programSubjectId) continue;

          await tx.programGradeSubject.create({
            data: {
              gradeId: programGradeId,
              subjectId: programSubjectId,
            },
          });
        }
      }
    });

    return { message: "Program seeded successfully" };
  }

  async generateClasses(schoolId: string, programId: string) {
    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      include: {
        grades: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    if (program.grades.length === 0) {
      throw new BadRequestException(
        "Program has no grades yet. Seed the program first."
      );
    }

    const existingClass = await this.prisma.programClass.findFirst({
      where: { programId },
      select: { id: true },
    });

    if (existingClass) {
      throw new BadRequestException("Classes already exist for this program");
    }

    const data = program.grades.map((grade) => ({
      programId,
      gradeId: grade.id,
      name: grade.name,
    }));

    await this.prisma.programClass.createMany({ data });

    return {
      message: "Classes generated",
      count: data.length,
    };
  }

  async getProgram(schoolId: string, programId: string) {
    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      include: {
        template: {
          select: {
            code: true,
            name: true,
          },
        },
        grades: {
          orderBy: { order: "asc" },
          include: {
            classes: {
              orderBy: { name: "asc" },
            },
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        },
        subjects: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    return program;
  }

  async switchProgram(
    userId: string,
    schoolId: string,
    role: MembershipType | string,
    programId: string
  ) {
    const normalizedRole = role as MembershipType;

    const allowedRoles: MembershipType[] = [
      MembershipType.OWNER,
      MembershipType.ADMIN,
      MembershipType.STAFF,
    ];

    if (!allowedRoles.includes(normalizedRole)) {
      throw new ForbiddenException("You are not allowed to switch programs");
    }

    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        userId,
        schoolId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        membershipType: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "You are not an active member of this school"
      );
    }

    const program = await this.prisma.schoolProgram.findFirst({
      where: {
        id: programId,
        schoolId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!program) {
      throw new ForbiddenException("Program not found in active school");
    }

    if (normalizedRole === MembershipType.STAFF) {
      const staffProfile = await this.prisma.staff.findFirst({
        where: {
          schoolId,
          userId,
          status: "ACTIVE",
          OR: [{ programId: program.id }, { programId: null }],
        },
        select: {
          id: true,
          programId: true,
        },
      });

      const createdSession = await this.prisma.attendanceSession.findFirst({
        where: {
          schoolId,
          programId: program.id,
          createdById: userId,
        },
        select: { id: true },
      });

      const markedStaffInProgram = staffProfile
        ? await this.prisma.staffSessionMark.findFirst({
            where: {
              staffId: staffProfile.id,
              session: {
                schoolId,
                programId: program.id,
              },
            },
            select: { id: true },
          })
        : null;

      const hasProgramAccess =
        !!staffProfile || !!createdSession || !!markedStaffInProgram;

      if (!hasProgramAccess) {
        throw new ForbiddenException(
          "You can only switch to programs you are assigned to."
        );
      }
    }

    const token = await this.jwt.signAsync({
      sub: userId,
      schoolId,
      role: membership.membershipType,
      membershipId: membership.id,
      programId: program.id,
    });

    return {
      token,
      active: {
        program: {
          id: program.id,
          name: program.name,
        },
        schoolId,
        membershipType: membership.membershipType,
        membershipId: membership.id,
      },
    };
  }

  async activeProgramContext(
    userId: string,
    schoolId?: string | null,
    role?: MembershipType | string | null,
    programId?: string | null
  ) {
    if (!schoolId || !programId) {
      return {
        active: null,
        note: "No active program selected. Use POST /programs/switch/:programId",
      };
    }

    const program = await this.prisma.schoolProgram.findFirst({
      where: {
        id: programId,
        schoolId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        schoolId: true,
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    return {
      active: {
        userId,
        schoolId,
        membershipType: role ?? null,
        program: {
          id: program.id,
          name: program.name,
          status: program.status,
        },
      },
    };
  }

  async listProgramClasses(programId: string) {
    return this.prisma.programClass.findMany({
      where: { programId },
      orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        createdAt: true,
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
  }
}