// src/students/students.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, TemplateStudentField } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto } from "./dto/create-student.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // FORM SCHEMA
  // =========================================================

  async getFormSchema(schoolId: string, programId: string) {
    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: {
        id: true,
        name: true,
        templateId: true,
        template: { select: { code: true, name: true } },
      },
    });

    if (!program) {
      throw new NotFoundException("Program not found");
    }

    const templateFields = await this.prisma.templateStudentField.findMany({
      where: { templateId: program.templateId },
      orderBy: { createdAt: "asc" },
      select: {
        key: true,
        label: true,
        type: true,
        required: true,
        optionsJson: true,
      },
    });

    return {
      program: {
        id: program.id,
        name: program.name,
        template: program.template,
      },
      coreFields: [
        { key: "fullName", label: "Full Name", type: "STRING", required: true },
        {
          key: "admissionNo",
          label: "Admission Number",
          type: "STRING",
          required: false,
        },
        { key: "gender", label: "Gender", type: "STRING", required: false },
        { key: "dob", label: "Date of Birth", type: "DATE", required: false },
        { key: "classId", label: "Class", type: "STRING", required: false },
      ],
      templateFields,
    };
  }

  // =========================================================
  // CREATE
  // =========================================================

  async createStudent(
    schoolId: string,
    programId: string,
    dto: CreateStudentDto
  ) {
    const fullName = dto.fullName?.trim();
    if (!fullName) {
      throw new BadRequestException("fullName is required");
    }

    const program = await this.prisma.schoolProgram.findFirst({
      where: { id: programId, schoolId },
      select: {
        id: true,
        templateId: true,
      },
    });

    if (!program) {
      throw new NotFoundException("Active program not found");
    }

    const templateFields = await this.prisma.templateStudentField.findMany({
      where: { templateId: program.templateId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        key: true,
        label: true,
        required: true,
        type: true,
      },
    });

    const fieldKeyToDef = new Map<
      string,
      Pick<TemplateStudentField, "id" | "key" | "label" | "required" | "type">
    >(templateFields.map((f) => [f.key, f]));

    const normalizedFields = this.normalizeFields(dto.fields);

    for (const field of templateFields) {
      if (!field.required) continue;

      const value = normalizedFields[field.key];
      if (!value || value.trim() === "") {
        throw new BadRequestException(`Missing required field: ${field.key}`);
      }
    }

    if (dto.classId) {
      const cls = await this.prisma.programClass.findFirst({
        where: { id: dto.classId, programId },
        select: { id: true },
      });

      if (!cls) {
        throw new BadRequestException("classId is not in the active program");
      }
    }

    const dob = this.parseOptionalDate(dto.dob, "dob");
    const admissionNo = dto.admissionNo?.trim() || null;
    const gender = dto.gender?.trim() || null;

    if (admissionNo) {
      const existingAdmission = await this.prisma.student.findFirst({
        where: { schoolId, admissionNo },
        select: { id: true },
      });

      if (existingAdmission) {
        throw new BadRequestException("admissionNo already exists in this school");
      }
    }

    await this.assertUniqueTemplateFields(
      schoolId,
      normalizedFields,
      templateFields,
      undefined
    );

    const student = await this.prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          schoolId,
          programId,
          classId: dto.classId || null,
          admissionNo,
          fullName,
          gender,
          dob: dob ?? null,
        },
        select: {
          id: true,
          fullName: true,
          admissionNo: true,
          gender: true,
          programId: true,
          classId: true,
          createdAt: true,
          class: { select: { id: true, name: true } },
        },
      });

      const entries: Prisma.StudentFieldValueCreateManyInput[] = [];

      for (const [key, rawValue] of Object.entries(normalizedFields)) {
        const def = fieldKeyToDef.get(key);
        if (!def) {
          throw new BadRequestException(`Unknown field for this program: ${key}`);
        }

        const value = rawValue.trim();
        if (!value) continue;

        entries.push({
          studentId: created.id,
          fieldId: def.id,
          value,
        });
      }

      if (entries.length > 0) {
        await tx.studentFieldValue.createMany({ data: entries });
      }

      return created;
    });

    return { message: "Student created", student };
  }

  // =========================================================
  // LIST
  // =========================================================

  async listStudents(schoolId: string, programId: string) {
    return this.prisma.student.findMany({
      where: { schoolId, programId },
      orderBy: [{ createdAt: "desc" }, { fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        dob: true,
        status: true,
        createdAt: true,
        class: {
          select: { id: true, name: true },
        },
        fields: {
          orderBy: { field: { createdAt: "asc" } },
          select: {
            value: true,
            field: {
              select: {
                key: true,
                label: true,
                type: true,
                required: true,
              },
            },
          },
        },
      },
    });
  }

  // =========================================================
  // ASSIGN CLASS
  // =========================================================

  async assignClass(
    schoolId: string,
    programId: string,
    studentId: string,
    classId: string
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId, programId },
      select: { id: true, classId: true },
    });

    if (!student) {
      throw new NotFoundException("Student not found in this program");
    }

    const cls = await this.prisma.programClass.findFirst({
      where: { id: classId, programId },
      select: { id: true, name: true },
    });

    if (!cls) {
      throw new BadRequestException("Class not found in this program");
    }

    if (student.classId === classId) {
      const current = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          fullName: true,
          admissionNo: true,
          classId: true,
          class: { select: { id: true, name: true } },
          updatedAt: true,
        },
      });

      return {
        message: "Student already assigned to this class",
        student: current,
      };
    }

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { classId },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        classId: true,
        class: { select: { id: true, name: true } },
        updatedAt: true,
      },
    });

    return { message: "Student assigned to class", student: updated };
  }

  // =========================================================
  // CLASS ROSTER
  // =========================================================

  async roster(schoolId: string, programId: string, classId: string) {
    const cls = await this.prisma.programClass.findFirst({
      where: { id: classId, programId },
      select: { id: true, name: true },
    });

    if (!cls) {
      throw new BadRequestException("classId is not in the active program");
    }

    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        programId,
        classId,
        status: "ACTIVE",
      },
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        status: true,
      },
    });

    return {
      class: cls,
      count: students.length,
      students,
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private normalizeFields(fields?: Record<string, string>) {
    if (!fields) return {};

    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      const cleanKey = String(key).trim();
      if (!cleanKey) continue;

      normalized[cleanKey] = String(value ?? "").trim();
    }

    return normalized;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string) {
    if (!value) return undefined;

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date string`);
    }

    return parsed;
  }

  private async assertUniqueTemplateFields(
    schoolId: string,
    normalizedFields: Record<string, string>,
    templateFields: Array<
      Pick<TemplateStudentField, "id" | "key" | "label" | "required" | "type">
    >,
    excludeStudentId?: string
  ) {
    const uniqueBySchoolKeys = new Set(
      templateFields
        .filter((f) => ["nemisNumber", "upi", "birthCertNo"].includes(f.key))
        .map((f) => f.key)
    );

    for (const key of uniqueBySchoolKeys) {
      const value = normalizedFields[key];
      if (!value) continue;

      const def = templateFields.find((f) => f.key === key);
      if (!def) continue;

      const existing = await this.prisma.studentFieldValue.findFirst({
        where: {
          fieldId: def.id,
          value,
          student: {
            schoolId,
            ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}),
          },
        },
        select: {
          id: true,
          student: { select: { id: true, fullName: true } },
        },
      });

      if (existing) {
        throw new BadRequestException(`${key} already exists for another student`);
      }
    }
  }
}