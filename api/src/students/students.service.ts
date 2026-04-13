import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  RelationshipStatus,
  StudentPositionScope,
  StudentPositionStatus,
  StudentStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { ListStudentsQueryDto } from "./dto/list-students-query.dto";
import { CreateStudentPositionDefinitionDto } from "./dto/create-student-position-definition.dto";
import { AssignStudentPositionDto } from "./dto/assign-student-position.dto";
import { EndStudentPositionAssignmentDto } from "./dto/end-student-position-assignment.dto";
import { CreateStudentGuardianDto } from "./dto/create-student-guardian.dto";
import { UpdateStudentGuardianDto } from "./dto/update-student-guardian.dto";
import { ReviewStudentGuardianDto } from "./dto/review-student-guardian.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStudents(institutionId: string, query: ListStudentsQueryDto) {
    await this.assertInstitutionExists(institutionId);

    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const search = query.search?.trim();
    const status = query.status ?? undefined;
    const classId = query.classId?.trim() || undefined;
    const programId = query.programId?.trim() || undefined;

    const where: Prisma.StudentProfileWhereInput = {
      institutionId,
      ...(status ? { status } : {}),
      ...(classId ? { classId } : {}),
      ...(programId ? { programId } : {}),
      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                admissionNo: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          institutionId: true,
          userId: true,
          fullName: true,
          admissionNo: true,
          gender: true,
          dateOfBirth: true,
          nationalityCode: true,
          status: true,
          joinedAt: true,
          createdAt: true,
          updatedAt: true,
          programId: true,
          classId: true,
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          classRoom: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          positionAssignments: {
            where: {
              status: StudentPositionStatus.ACTIVE,
            },
            select: {
              id: true,
              positionDefinition: {
                select: {
                  id: true,
                  name: true,
                  key: true,
                  scope: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getStudentById(institutionId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: {
        id: true,
        institutionId: true,
        userId: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        dateOfBirth: true,
        nationalityCode: true,
        status: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        programId: true,
        classId: true,
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        guardians: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            relationshipType: true,
            status: true,
            isPrimary: true,
            canReceiveUpdates: true,
            canPayFees: true,
            canPickUp: true,
            guardianUserId: true,
            approvedAt: true,
          },
        },
        customFieldValues: {
          select: {
            id: true,
            value: true,
            field: {
              select: {
                id: true,
                key: true,
                label: true,
                type: true,
                required: true,
                uniqueScope: true,
                optionsJson: true,
              },
            },
          },
        },
        positionAssignments: {
          where: {
            status: StudentPositionStatus.ACTIVE,
          },
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            note: true,
            positionDefinition: {
              select: {
                id: true,
                name: true,
                key: true,
                scope: true,
                description: true,
                isElective: true,
                isVisible: true,
                maxHolders: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return student;
  }

  async createStudent(institutionId: string, dto: CreateStudentDto) {
    const fullName = this.normalizeRequiredText(dto.fullName, "Full name");
    const admissionNo = this.normalizeOptionalText(dto.admissionNo);
    const nationalityCode = this.normalizeCountryCode(dto.nationalityCode);
    const joinedAt = dto.joinedAt ? new Date(dto.joinedAt) : null;

    await this.assertInstitutionExists(institutionId);

    if (dto.programId) {
      await this.assertProgramBelongsToInstitution(institutionId, dto.programId);
    }

    if (dto.classId) {
      await this.assertClassBelongsToInstitution(institutionId, dto.classId);
    }

    if (dto.classId && dto.programId) {
      await this.assertClassBelongsToProgram(dto.classId, dto.programId);
    }

    if (admissionNo) {
      const existingAdmission = await this.prisma.studentProfile.findFirst({
        where: {
          institutionId,
          admissionNo,
        },
        select: { id: true },
      });

      if (existingAdmission) {
        throw new BadRequestException("Admission number already exists");
      }
    }

    if (dto.userId) {
      await this.assertUserExists(dto.userId);

      const existingLinkedUser = await this.prisma.studentProfile.findFirst({
        where: {
          institutionId,
          userId: dto.userId,
        },
        select: { id: true },
      });

      if (existingLinkedUser) {
        throw new BadRequestException(
          "That user is already linked to a student profile in this institution",
        );
      }
    }

    const student = await this.prisma.studentProfile.create({
      data: {
        institutionId,
        userId: dto.userId ?? null,
        fullName,
        admissionNo,
        gender: this.normalizeOptionalText(dto.gender),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        nationalityCode,
        status: dto.status ?? StudentStatus.ACTIVE,
        joinedAt,
        programId: dto.programId ?? null,
        classId: dto.classId ?? null,
      },
      select: {
        id: true,
        institutionId: true,
        userId: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        dateOfBirth: true,
        nationalityCode: true,
        status: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: "Student created successfully",
      student,
    };
  }

  async updateStudent(
    institutionId: string,
    studentId: string,
    dto: UpdateStudentDto,
  ) {
    const existingStudent = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: {
        id: true,
        institutionId: true,
        userId: true,
        programId: true,
        classId: true,
        admissionNo: true,
      },
    });

    if (!existingStudent) {
      throw new NotFoundException("Student not found");
    }

    if (dto.programId) {
      await this.assertProgramBelongsToInstitution(institutionId, dto.programId);
    }

    if (dto.classId) {
      await this.assertClassBelongsToInstitution(institutionId, dto.classId);
    }

    const effectiveProgramId = dto.programId ?? existingStudent.programId ?? null;
    const effectiveClassId = dto.classId ?? existingStudent.classId ?? null;

    if (effectiveProgramId && effectiveClassId) {
      await this.assertClassBelongsToProgram(effectiveClassId, effectiveProgramId);
    }

    const admissionNo =
      dto.admissionNo !== undefined
        ? this.normalizeOptionalText(dto.admissionNo)
        : undefined;

    if (admissionNo) {
      const duplicateAdmission = await this.prisma.studentProfile.findFirst({
        where: {
          institutionId,
          admissionNo,
          id: { not: studentId },
        },
        select: { id: true },
      });

      if (duplicateAdmission) {
        throw new BadRequestException("Admission number already exists");
      }
    }

    if (dto.userId) {
      await this.assertUserExists(dto.userId);

      const duplicateUserLink = await this.prisma.studentProfile.findFirst({
        where: {
          institutionId,
          userId: dto.userId,
          id: { not: studentId },
        },
        select: { id: true },
      });

      if (duplicateUserLink) {
        throw new BadRequestException(
          "That user is already linked to another student profile in this institution",
        );
      }
    }

    const updated = await this.prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        ...(dto.fullName !== undefined
          ? { fullName: this.normalizeRequiredText(dto.fullName, "Full name") }
          : {}),
        ...(dto.admissionNo !== undefined ? { admissionNo } : {}),
        ...(dto.gender !== undefined
          ? { gender: this.normalizeOptionalText(dto.gender) }
          : {}),
        ...(dto.dateOfBirth !== undefined
          ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
          : {}),
        ...(dto.nationalityCode !== undefined
          ? { nationalityCode: this.normalizeCountryCode(dto.nationalityCode) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.joinedAt !== undefined
          ? { joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : null }
          : {}),
        ...(dto.programId !== undefined ? { programId: dto.programId || null } : {}),
        ...(dto.classId !== undefined ? { classId: dto.classId || null } : {}),
        ...(dto.userId !== undefined ? { userId: dto.userId || null } : {}),
      },
      select: {
        id: true,
        institutionId: true,
        userId: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        dateOfBirth: true,
        nationalityCode: true,
        status: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: "Student updated successfully",
      student: updated,
    };
  }

  async listStudentPositionDefinitions(institutionId: string) {
    await this.assertInstitutionExists(institutionId);

    return this.prisma.studentPositionDefinition.findMany({
      where: { institutionId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        scope: true,
        isElective: true,
        isVisible: true,
        maxHolders: true,
        sortOrder: true,
        programId: true,
        classId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });
  }

  async createStudentPositionDefinition(
    institutionId: string,
    dto: CreateStudentPositionDefinitionDto,
  ) {
    await this.assertInstitutionExists(institutionId);

    const name = this.normalizeRequiredText(dto.name, "Position name");
    const key = this.normalizePositionKey(dto.key);
    const description = this.normalizeOptionalText(dto.description);

    const scope = dto.scope ?? StudentPositionScope.INSTITUTION;
    const programId = dto.programId?.trim() || null;
    const classId = dto.classId?.trim() || null;
    const departmentId = dto.departmentId?.trim() || null;

    if (programId) {
      await this.assertProgramBelongsToInstitution(institutionId, programId);
    }

    if (classId) {
      await this.assertClassBelongsToInstitution(institutionId, classId);
    }

    if (departmentId) {
      await this.assertDepartmentBelongsToInstitution(institutionId, departmentId);
    }

    if (programId && classId) {
      await this.assertClassBelongsToProgram(classId, programId);
    }

    const duplicateName = await this.prisma.studentPositionDefinition.findFirst({
      where: {
        institutionId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateName) {
      throw new BadRequestException("A student position with that name already exists");
    }

    const duplicateKey = await this.prisma.studentPositionDefinition.findFirst({
      where: {
        institutionId,
        key,
      },
      select: { id: true },
    });

    if (duplicateKey) {
      throw new BadRequestException("A student position with that key already exists");
    }

    const position = await this.prisma.studentPositionDefinition.create({
      data: {
        institutionId,
        name,
        key,
        description,
        scope,
        programId,
        classId,
        departmentId,
        isElective: dto.isElective ?? false,
        isVisible: dto.isVisible ?? true,
        maxHolders: dto.maxHolders ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        scope: true,
        isElective: true,
        isVisible: true,
        maxHolders: true,
        sortOrder: true,
        programId: true,
        classId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Student position created successfully",
      position,
    };
  }

  async listStudentPositionAssignments(institutionId: string, studentId: string) {
    await this.assertStudentBelongsToInstitution(institutionId, studentId);

    return this.prisma.studentPositionAssignment.findMany({
      where: {
        institutionId,
        studentProfileId: studentId,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        assignedByUserId: true,
        positionDefinition: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            scope: true,
            isElective: true,
            isVisible: true,
            maxHolders: true,
            sortOrder: true,
          },
        },
        assignedByUser: {
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

  async assignStudentPosition(
    institutionId: string,
    studentId: string,
    assignedByUserId: string,
    dto: AssignStudentPositionDto,
  ) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: {
        id: true,
        programId: true,
        classId: true,
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const position = await this.prisma.studentPositionDefinition.findFirst({
      where: {
        id: dto.positionDefinitionId,
        institutionId,
      },
      select: {
        id: true,
        scope: true,
        programId: true,
        classId: true,
        departmentId: true,
        maxHolders: true,
        name: true,
      },
    });

    if (!position) {
      throw new NotFoundException("Student position not found");
    }

    if (position.programId && student.programId !== position.programId) {
      throw new BadRequestException(
        "Student does not belong to the required program for this position",
      );
    }

    if (position.classId && student.classId !== position.classId) {
      throw new BadRequestException(
        "Student does not belong to the required class for this position",
      );
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (startAt && endAt && endAt < startAt) {
      throw new BadRequestException("Position end date cannot be earlier than start date");
    }

    const activeDuplicate = await this.prisma.studentPositionAssignment.findFirst({
      where: {
        institutionId,
        studentProfileId: studentId,
        positionDefinitionId: position.id,
        status: StudentPositionStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (activeDuplicate) {
      throw new BadRequestException("This student already holds that active position");
    }

    if (position.maxHolders) {
      const currentHolders = await this.prisma.studentPositionAssignment.count({
        where: {
          institutionId,
          positionDefinitionId: position.id,
          status: StudentPositionStatus.ACTIVE,
        },
      });

      if (currentHolders >= position.maxHolders) {
        throw new BadRequestException(
          `Maximum number of active holders reached for ${position.name}`,
        );
      }
    }

    const assignment = await this.prisma.studentPositionAssignment.create({
      data: {
        institutionId,
        studentProfileId: studentId,
        positionDefinitionId: position.id,
        assignedByUserId,
        status: StudentPositionStatus.ACTIVE,
        startAt,
        endAt,
        note: this.normalizeOptionalText(dto.note),
      },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        positionDefinition: {
          select: {
            id: true,
            name: true,
            key: true,
            scope: true,
          },
        },
      },
    });

    return {
      message: "Student position assigned successfully",
      assignment,
    };
  }

  async endStudentPositionAssignment(
    institutionId: string,
    studentId: string,
    assignmentId: string,
    dto: EndStudentPositionAssignmentDto,
  ) {
    const assignment = await this.prisma.studentPositionAssignment.findFirst({
      where: {
        id: assignmentId,
        institutionId,
        studentProfileId: studentId,
      },
      select: {
        id: true,
        status: true,
        startAt: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException("Student position assignment not found");
    }

    if (assignment.status !== StudentPositionStatus.ACTIVE) {
      throw new BadRequestException("Only active assignments can be ended or revoked");
    }

    const nextStatus = dto.status ?? StudentPositionStatus.ENDED;
    const endAt = dto.endAt ? new Date(dto.endAt) : new Date();

    if (assignment.startAt && endAt < assignment.startAt) {
      throw new BadRequestException("End date cannot be earlier than assignment start date");
    }

    const updated = await this.prisma.studentPositionAssignment.update({
      where: { id: assignment.id },
      data: {
        status: nextStatus,
        endAt,
        ...(dto.note !== undefined
          ? { note: this.normalizeOptionalText(dto.note) }
          : {}),
      },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        note: true,
        updatedAt: true,
        positionDefinition: {
          select: {
            id: true,
            name: true,
            key: true,
            scope: true,
          },
        },
      },
    });

    return {
      message:
        nextStatus === StudentPositionStatus.REVOKED
          ? "Student position revoked successfully"
          : "Student position ended successfully",
      assignment: updated,
    };
  }

  async listStudentGuardians(institutionId: string, studentId: string) {
    await this.assertStudentBelongsToInstitution(institutionId, studentId);

    return this.prisma.studentGuardianLink.findMany({
      where: {
        institutionId,
        studentProfileId: studentId,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        institutionId: true,
        studentProfileId: true,
        studentUserId: true,
        guardianUserId: true,
        fullName: true,
        email: true,
        phone: true,
        relationshipType: true,
        status: true,
        isPrimary: true,
        canReceiveUpdates: true,
        canPayFees: true,
        canPickUp: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        guardianUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            skuullyId: true,
          },
        },
      },
    });
  }

  async createStudentGuardian(
    institutionId: string,
    studentId: string,
    dto: CreateStudentGuardianDto,
  ) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        institutionId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const guardianUserId = dto.guardianUserId?.trim() || null;
    const studentUserId = dto.studentUserId?.trim() || student.userId || null;
    const fullName = this.normalizeRequiredText(dto.fullName, "Guardian full name");
    const email = this.normalizeOptionalEmail(dto.email);
    const phone = this.normalizeOptionalText(dto.phone);

    if (guardianUserId) {
      await this.assertUserExists(guardianUserId);
    }

    if (studentUserId) {
      await this.assertUserExists(studentUserId);
    }

    if (guardianUserId) {
      const duplicateLinkedGuardian = await this.prisma.studentGuardianLink.findFirst({
        where: {
          institutionId,
          studentProfileId: studentId,
          guardianUserId,
          relationshipType: dto.relationshipType,
        },
        select: { id: true },
      });

      if (duplicateLinkedGuardian) {
        throw new BadRequestException(
          "That guardian is already linked to this student with the same relationship type",
        );
      }
    }

    if (!guardianUserId && email) {
      const duplicateByEmail = await this.prisma.studentGuardianLink.findFirst({
        where: {
          institutionId,
          studentProfileId: studentId,
          email,
          relationshipType: dto.relationshipType,
        },
        select: { id: true },
      });

      if (duplicateByEmail) {
        throw new BadRequestException(
          "A guardian with that email is already linked to this student",
        );
      }
    }

    const shouldBePrimary = dto.isPrimary ?? false;

    const guardian = await this.prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.studentGuardianLink.updateMany({
          where: {
            institutionId,
            studentProfileId: studentId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

            return tx.studentGuardianLink.create({
        data: {
          institutionId,
          studentProfileId: studentId,
          studentUserId,
          guardianUserId,
          fullName,
          email,
          phone,
          relationshipType: dto.relationshipType,
          status: RelationshipStatus.PENDING,
          isPrimary: shouldBePrimary,
          canReceiveUpdates: dto.canReceiveUpdates ?? true,
          canPayFees: dto.canPayFees ?? false,
          canPickUp: dto.canPickUp ?? false,
          approvedAt: null,
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          studentUserId: true,
          guardianUserId: true,
          fullName: true,
          email: true,
          phone: true,
          relationshipType: true,
          status: true,
          isPrimary: true,
          canReceiveUpdates: true,
          canPayFees: true,
          canPickUp: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: "Student guardian created successfully",
      guardian,
    };
  }

  async updateStudentGuardian(
    institutionId: string,
    studentId: string,
    guardianId: string,
    dto: UpdateStudentGuardianDto,
  ) {
    const guardian = await this.prisma.studentGuardianLink.findFirst({
      where: {
        id: guardianId,
        institutionId,
        studentProfileId: studentId,
      },
      select: {
        id: true,
        guardianUserId: true,
        isPrimary: true,
      },
    });

    if (!guardian) {
      throw new NotFoundException("Student guardian not found");
    }

    if (dto.guardianUserId) {
      await this.assertUserExists(dto.guardianUserId);
    }

    const shouldBePrimary = dto.isPrimary === true;

    const updatedGuardian = await this.prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.studentGuardianLink.updateMany({
          where: {
            institutionId,
            studentProfileId: studentId,
            isPrimary: true,
            id: { not: guardianId },
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.studentGuardianLink.update({
        where: { id: guardianId },
        data: {
          ...(dto.guardianUserId !== undefined
            ? { guardianUserId: dto.guardianUserId || null }
            : {}),
          ...(dto.fullName !== undefined
            ? {
                fullName: this.normalizeRequiredText(
                  dto.fullName,
                  "Guardian full name",
                ),
              }
            : {}),
          ...(dto.email !== undefined
            ? { email: this.normalizeOptionalEmail(dto.email) }
            : {}),
          ...(dto.phone !== undefined
            ? { phone: this.normalizeOptionalText(dto.phone) }
            : {}),
          ...(dto.relationshipType !== undefined
            ? { relationshipType: dto.relationshipType }
            : {}),
          ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
          ...(dto.canReceiveUpdates !== undefined
            ? { canReceiveUpdates: dto.canReceiveUpdates }
            : {}),
          ...(dto.canPayFees !== undefined ? { canPayFees: dto.canPayFees } : {}),
          ...(dto.canPickUp !== undefined ? { canPickUp: dto.canPickUp } : {}),
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          studentUserId: true,
          guardianUserId: true,
          fullName: true,
          email: true,
          phone: true,
          relationshipType: true,
          status: true,
          isPrimary: true,
          canReceiveUpdates: true,
          canPayFees: true,
          canPickUp: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: "Student guardian updated successfully",
      guardian: updatedGuardian,
    };
  }

  async reviewStudentGuardian(
    institutionId: string,
    studentId: string,
    guardianId: string,
    dto: ReviewStudentGuardianDto,
  ) {
    const guardian = await this.prisma.studentGuardianLink.findFirst({
      where: {
        id: guardianId,
        institutionId,
        studentProfileId: studentId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!guardian) {
      throw new NotFoundException("Student guardian not found");
    }

    const nextApprovedAt =
      dto.status === RelationshipStatus.ACTIVE ? new Date() : null;

    const updated = await this.prisma.studentGuardianLink.update({
      where: { id: guardianId },
      data: {
        status: dto.status,
        approvedAt: nextApprovedAt,
      },
      select: {
        id: true,
        institutionId: true,
        studentProfileId: true,
        guardianUserId: true,
        fullName: true,
        email: true,
        phone: true,
        relationshipType: true,
        status: true,
        isPrimary: true,
        canReceiveUpdates: true,
        canPayFees: true,
        canPickUp: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Student guardian reviewed successfully",
      guardian: updated,
    };
  }

  async setPrimaryGuardian(
    institutionId: string,
    studentId: string,
    guardianId: string,
  ) {
    const guardian = await this.prisma.studentGuardianLink.findFirst({
      where: {
        id: guardianId,
        institutionId,
        studentProfileId: studentId,
      },
      select: {
        id: true,
      },
    });

    if (!guardian) {
      throw new NotFoundException("Student guardian not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.studentGuardianLink.updateMany({
        where: {
          institutionId,
          studentProfileId: studentId,
          isPrimary: true,
          id: { not: guardianId },
        },
        data: {
          isPrimary: false,
        },
      });

      return tx.studentGuardianLink.update({
        where: { id: guardianId },
        data: {
          isPrimary: true,
        },
        select: {
          id: true,
          institutionId: true,
          studentProfileId: true,
          guardianUserId: true,
          fullName: true,
          email: true,
          phone: true,
          relationshipType: true,
          status: true,
          isPrimary: true,
          canReceiveUpdates: true,
          canPayFees: true,
          canPickUp: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: "Primary guardian updated successfully",
      guardian: updated,
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

  private async assertDepartmentBelongsToInstitution(
    institutionId: string,
    departmentId: string,
  ) {
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        institutionId,
      },
      select: { id: true },
    });

    if (!department) {
      throw new BadRequestException("Department not found in this institution");
    }
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

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException("Linked user not found");
    }
  }

  private normalizeRequiredText(value: string, fieldLabel: string) {
    const cleaned = value.replace(/\s+/g, " ").trim();

    if (!cleaned) {
      throw new BadRequestException(`${fieldLabel} is required`);
    }

    return cleaned;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned.length ? cleaned : null;
  }

  private normalizeOptionalEmail(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.trim().toLowerCase();
    return cleaned.length ? cleaned : null;
  }

  private normalizeCountryCode(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.trim().toUpperCase();

    if (!cleaned) {
      return null;
    }

    if (!/^[A-Z]{2}$/.test(cleaned)) {
      throw new BadRequestException(
        "Nationality code must be a valid ISO-2 code",
      );
    }

    return cleaned;
  }

  private normalizePositionKey(value: string) {
    const cleaned = value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!cleaned || cleaned.length < 2) {
      throw new BadRequestException("Position key is required");
    }

    return cleaned;
  }
}