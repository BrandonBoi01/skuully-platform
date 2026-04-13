import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AcademicPeriodStatus,
  AcademicPeriodType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAcademicPeriodDto } from "./dto/create-academic-period.dto";
import { UpdateAcademicPeriodDto } from "./dto/update-academic-period.dto";
import { ListAcademicPeriodsQueryDto } from "./dto/list-academic-periods-query.dto";
import { SetCurrentAcademicPeriodDto } from "./dto/set-current-academic-period.dto";
import { CloseAcademicPeriodDto } from "./dto/close-academic-period.dto";

@Injectable()
export class AcademicPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAcademicPeriods(
    institutionId: string,
    query: ListAcademicPeriodsQueryDto,
  ) {
    await this.assertInstitutionExists(institutionId);

    const search = query.search?.trim();

    const where: Prisma.AcademicPeriodWhereInput = {
      institutionId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.parentPeriodId
        ? { parentPeriodId: query.parentPeriodId }
        : {}),
      ...(query.academicYearLabel
        ? { academicYearLabel: query.academicYearLabel.trim() }
        : {}),
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

    return this.prisma.academicPeriod.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { startsAt: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        institutionId: true,
        parentPeriodId: true,
        name: true,
        code: true,
        type: true,
        status: true,
        academicYearLabel: true,
        termNumber: true,
        startsAt: true,
        endsAt: true,
        isCurrent: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        parentPeriod: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            academicYearLabel: true,
          },
        },
        childPeriods: {
          orderBy: [{ sortOrder: "asc" }, { startsAt: "asc" }],
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            status: true,
            startsAt: true,
            endsAt: true,
            isCurrent: true,
            sortOrder: true,
          },
        },
      },
    });
  }

  async getCurrentAcademicPeriod(institutionId: string) {
    await this.assertInstitutionExists(institutionId);

    const current = await this.prisma.academicPeriod.findFirst({
      where: {
        institutionId,
        isCurrent: true,
      },
      orderBy: [{ startsAt: "desc" }],
      select: {
        id: true,
        institutionId: true,
        parentPeriodId: true,
        name: true,
        code: true,
        type: true,
        status: true,
        academicYearLabel: true,
        termNumber: true,
        startsAt: true,
        endsAt: true,
        isCurrent: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        parentPeriod: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });

    return {
      current,
    };
  }

  async getAcademicPeriodById(institutionId: string, periodId: string) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: {
        id: periodId,
        institutionId,
      },
      select: {
        id: true,
        institutionId: true,
        parentPeriodId: true,
        name: true,
        code: true,
        type: true,
        status: true,
        academicYearLabel: true,
        termNumber: true,
        startsAt: true,
        endsAt: true,
        isCurrent: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        parentPeriod: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            academicYearLabel: true,
          },
        },
        childPeriods: {
          orderBy: [{ sortOrder: "asc" }, { startsAt: "asc" }],
          select: {
            id: true,
            institutionId: true,
            parentPeriodId: true,
            name: true,
            code: true,
            type: true,
            status: true,
            academicYearLabel: true,
            termNumber: true,
            startsAt: true,
            endsAt: true,
            isCurrent: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Academic period not found");
    }

    return period;
  }

  async createAcademicPeriod(
    institutionId: string,
    dto: CreateAcademicPeriodDto,
  ) {
    await this.assertInstitutionExists(institutionId);

    const name = this.normalizeRequiredText(dto.name, "Academic period name");
    const code = this.normalizeOptionalCode(dto.code);
    const academicYearLabel = this.normalizeOptionalText(dto.academicYearLabel);
    const parentPeriodId = dto.parentPeriodId?.trim() || null;
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        "Academic period end date must be later than start date",
      );
    }

    if (parentPeriodId) {
      await this.assertAcademicPeriodBelongsToInstitution(
        institutionId,
        parentPeriodId,
      );
    }

    const duplicateName = await this.prisma.academicPeriod.findFirst({
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
      throw new BadRequestException(
        "Academic period name already exists in this institution",
      );
    }

    if (code) {
      const duplicateCode = await this.prisma.academicPeriod.findFirst({
        where: {
          institutionId,
          code,
        },
        select: { id: true },
      });

      if (duplicateCode) {
        throw new BadRequestException(
          "Academic period code already exists in this institution",
        );
      }
    }

    await this.assertNoInvalidOverlap(
      institutionId,
      dto.type,
      startsAt,
      endsAt,
      null,
      parentPeriodId,
    );

    const period = await this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicPeriod.updateMany({
          where: {
            institutionId,
            isCurrent: true,
          },
          data: {
            isCurrent: false,
          },
        });
      }

      return tx.academicPeriod.create({
        data: {
          institutionId,
          parentPeriodId,
          name,
          code,
          type: dto.type,
          status: dto.status ?? AcademicPeriodStatus.PLANNED,
          academicYearLabel,
          termNumber: dto.termNumber ?? null,
          startsAt,
          endsAt,
          isCurrent: dto.isCurrent ?? false,
          sortOrder: dto.sortOrder ?? 0,
        },
        select: {
          id: true,
          institutionId: true,
          parentPeriodId: true,
          name: true,
          code: true,
          type: true,
          status: true,
          academicYearLabel: true,
          termNumber: true,
          startsAt: true,
          endsAt: true,
          isCurrent: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: "Academic period created successfully",
      period,
    };
  }

  async updateAcademicPeriod(
    institutionId: string,
    periodId: string,
    dto: UpdateAcademicPeriodDto,
  ) {
    const existing = await this.prisma.academicPeriod.findFirst({
      where: {
        id: periodId,
        institutionId,
      },
      select: {
        id: true,
        parentPeriodId: true,
        type: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Academic period not found");
    }

    const name =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name, "Academic period name")
        : undefined;

    const code =
      dto.code !== undefined ? this.normalizeOptionalCode(dto.code) : undefined;

    const academicYearLabel =
      dto.academicYearLabel !== undefined
        ? this.normalizeOptionalText(dto.academicYearLabel)
        : undefined;

    const parentPeriodId =
      dto.parentPeriodId !== undefined
        ? dto.parentPeriodId?.trim() || null
        : undefined;

    if (parentPeriodId) {
      if (parentPeriodId === periodId) {
        throw new BadRequestException("A period cannot be its own parent");
      }

      await this.assertAcademicPeriodBelongsToInstitution(
        institutionId,
        parentPeriodId,
      );
    }

    const startsAt =
      dto.startsAt !== undefined ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined ? new Date(dto.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        "Academic period end date must be later than start date",
      );
    }

    const effectiveType = dto.type ?? existing.type;
    const effectiveParentPeriodId =
      parentPeriodId !== undefined ? parentPeriodId : existing.parentPeriodId;

    if (name) {
      const duplicateName = await this.prisma.academicPeriod.findFirst({
        where: {
          institutionId,
          id: { not: periodId },
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateName) {
        throw new BadRequestException(
          "Academic period name already exists in this institution",
        );
      }
    }

    if (code) {
      const duplicateCode = await this.prisma.academicPeriod.findFirst({
        where: {
          institutionId,
          id: { not: periodId },
          code,
        },
        select: { id: true },
      });

      if (duplicateCode) {
        throw new BadRequestException(
          "Academic period code already exists in this institution",
        );
      }
    }

    await this.assertNoInvalidOverlap(
      institutionId,
      effectiveType,
      startsAt,
      endsAt,
      periodId,
      effectiveParentPeriodId,
    );

    const period = await this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent === true) {
        await tx.academicPeriod.updateMany({
          where: {
            institutionId,
            isCurrent: true,
            id: { not: periodId },
          },
          data: {
            isCurrent: false,
          },
        });
      }

      return tx.academicPeriod.update({
        where: { id: periodId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(code !== undefined ? { code } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(parentPeriodId !== undefined ? { parentPeriodId } : {}),
          ...(academicYearLabel !== undefined ? { academicYearLabel } : {}),
          ...(dto.termNumber !== undefined ? { termNumber: dto.termNumber } : {}),
          ...(dto.startsAt !== undefined ? { startsAt } : {}),
          ...(dto.endsAt !== undefined ? { endsAt } : {}),
          ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
        select: {
          id: true,
          institutionId: true,
          parentPeriodId: true,
          name: true,
          code: true,
          type: true,
          status: true,
          academicYearLabel: true,
          termNumber: true,
          startsAt: true,
          endsAt: true,
          isCurrent: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: "Academic period updated successfully",
      period,
    };
  }

  async setCurrentAcademicPeriod(
    institutionId: string,
    periodId: string,
    dto: SetCurrentAcademicPeriodDto,
  ) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: {
        id: periodId,
        institutionId,
      },
      select: {
        id: true,
      },
    });

    if (!period) {
      throw new NotFoundException("Academic period not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicPeriod.updateMany({
          where: {
            institutionId,
            isCurrent: true,
            id: { not: periodId },
          },
          data: {
            isCurrent: false,
          },
        });
      }

      return tx.academicPeriod.update({
        where: { id: periodId },
        data: {
          isCurrent: dto.isCurrent,
          ...(dto.isCurrent ? { status: AcademicPeriodStatus.ACTIVE } : {}),
        },
        select: {
          id: true,
          institutionId: true,
          parentPeriodId: true,
          name: true,
          code: true,
          type: true,
          status: true,
          academicYearLabel: true,
          termNumber: true,
          startsAt: true,
          endsAt: true,
          isCurrent: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      message: dto.isCurrent
        ? "Academic period set as current successfully"
        : "Academic period unset as current successfully",
      period: updated,
    };
  }

  async closeAcademicPeriod(
    institutionId: string,
    periodId: string,
    dto: CloseAcademicPeriodDto,
  ) {
    const existing = await this.prisma.academicPeriod.findFirst({
      where: {
        id: periodId,
        institutionId,
      },
      select: {
        id: true,
        isCurrent: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Academic period not found");
    }

    const nextStatus = dto.status ?? AcademicPeriodStatus.CLOSED;

    const period = await this.prisma.academicPeriod.update({
      where: { id: periodId },
      data: {
        status: nextStatus,
        ...(existing.isCurrent ? { isCurrent: false } : {}),
      },
      select: {
        id: true,
        institutionId: true,
        parentPeriodId: true,
        name: true,
        code: true,
        type: true,
        status: true,
        academicYearLabel: true,
        termNumber: true,
        startsAt: true,
        endsAt: true,
        isCurrent: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Academic period closed successfully",
      period,
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

  private async assertAcademicPeriodBelongsToInstitution(
    institutionId: string,
    periodId: string,
  ) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: {
        id: periodId,
        institutionId,
      },
      select: { id: true },
    });

    if (!period) {
      throw new BadRequestException(
        "Academic period not found in this institution",
      );
    }
  }

  private async assertNoInvalidOverlap(
    institutionId: string,
    type: AcademicPeriodType,
    startsAt: Date,
    endsAt: Date,
    excludeId: string | null,
    parentPeriodId: string | null,
  ) {
    const overlapping = await this.prisma.academicPeriod.findFirst({
      where: {
        institutionId,
        type,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(parentPeriodId !== undefined ? { parentPeriodId } : {}),
        AND: [
          { startsAt: { lt: endsAt } },
          { endsAt: { gt: startsAt } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        `Academic period overlaps with existing period: ${overlapping.name}`,
      );
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

  private normalizeOptionalCode(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const cleaned = value.replace(/\s+/g, " ").trim().toUpperCase();
    return cleaned.length ? cleaned : null;
  }
}