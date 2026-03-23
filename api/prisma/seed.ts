import { PrismaClient } from "@prisma/client";
import { seedGeo } from "./seed-geo";

const prisma = new PrismaClient();

type TemplateSeed = {
  code: string;
  name: string;
  description?: string;
  grades: { name: string; order: number; stage?: string }[];
  subjects: { name: string; code?: string; isCore?: boolean }[];
  gradeSubjects: Record<number, string[]>;
};

const seeds: TemplateSeed[] = [
  {
    code: "GENERIC",
    name: "Generic Curriculum",
    description: "Flexible starter curriculum. Install a specific template later.",
    grades: [
      { name: "Grade 1", order: 1, stage: "Primary" },
      { name: "Grade 2", order: 2, stage: "Primary" },
    ],
    subjects: [
      { name: "Mathematics", code: "MATH", isCore: true },
      { name: "English", code: "ENG", isCore: true },
    ],
    gradeSubjects: {
      1: ["Mathematics", "English"],
      2: ["Mathematics", "English"],
    },
  },
  {
    code: "KE_CBC",
    name: "Kenya CBC",
    description: "Competency Based Curriculum (basic starter set).",
    grades: [
      { name: "Grade 1", order: 1, stage: "Primary" },
      { name: "Grade 2", order: 2, stage: "Primary" },
      { name: "Grade 3", order: 3, stage: "Primary" },
      { name: "Grade 4", order: 4, stage: "Upper Primary" },
      { name: "Grade 5", order: 5, stage: "Upper Primary" },
      { name: "Grade 6", order: 6, stage: "Upper Primary" },
    ],
    subjects: [
      { name: "Mathematics", code: "MATH", isCore: true },
      { name: "English", code: "ENG", isCore: true },
      { name: "Kiswahili", code: "SWA", isCore: true },
      { name: "Science & Technology", code: "SCI", isCore: true },
      { name: "Social Studies", code: "SST", isCore: true },
      { name: "CRE", code: "CRE", isCore: false },
    ],
    gradeSubjects: {
      1: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies"],
      2: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies"],
      3: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies"],
      4: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies", "CRE"],
      5: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies", "CRE"],
      6: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies", "CRE"],
    },
  },
  {
    code: "CAM_IGCSE",
    name: "Cambridge Lower Secondary (Starter)",
    description: "Starter template for Cambridge-style lower secondary (Years 7–9).",
    grades: [
      { name: "Year 7", order: 7, stage: "Lower Secondary" },
      { name: "Year 8", order: 8, stage: "Lower Secondary" },
      { name: "Year 9", order: 9, stage: "Lower Secondary" },
    ],
    subjects: [
      { name: "Mathematics", code: "MATH", isCore: true },
      { name: "English", code: "ENG", isCore: true },
      { name: "Biology", code: "BIO", isCore: true },
      { name: "Chemistry", code: "CHEM", isCore: true },
      { name: "Physics", code: "PHY", isCore: true },
      { name: "Geography", code: "GEO", isCore: false },
      { name: "History", code: "HIST", isCore: false },
    ],
    gradeSubjects: {
      7: ["Mathematics", "English", "Biology", "Chemistry", "Physics", "Geography", "History"],
      8: ["Mathematics", "English", "Biology", "Chemistry", "Physics", "Geography", "History"],
      9: ["Mathematics", "English", "Biology", "Chemistry", "Physics", "Geography", "History"],
    },
  },
];

async function seedTemplate(t: TemplateSeed) {
  const template = await prisma.curriculumTemplate.upsert({
    where: { code: t.code },
    update: {
      name: t.name,
      description: t.description,
    },
    create: {
      code: t.code,
      name: t.name,
      description: t.description,
    },
    select: { id: true },
  });

  await prisma.curriculumTemplateGradeSubject.deleteMany({
    where: { grade: { templateId: template.id } },
  });

  await prisma.curriculumTemplateGrade.deleteMany({
    where: { templateId: template.id },
  });

  await prisma.curriculumTemplateSubject.deleteMany({
    where: { templateId: template.id },
  });

  await prisma.curriculumTemplateSubject.createMany({
    data: t.subjects.map((s) => ({
      templateId: template.id,
      name: s.name,
      code: s.code,
      isCore: s.isCore ?? true,
    })),
  });

  const subjectRows = await prisma.curriculumTemplateSubject.findMany({
    where: { templateId: template.id },
    select: { id: true, name: true },
  });

  const subjectIdByName = new Map(subjectRows.map((s) => [s.name, s.id]));

  for (const g of t.grades) {
    const grade = await prisma.curriculumTemplateGrade.create({
      data: {
        templateId: template.id,
        name: g.name,
        order: g.order,
        stage: g.stage,
      },
      select: { id: true, order: true },
    });

    const subjectNames = t.gradeSubjects[g.order] || [];
    const subjectIds = subjectNames
      .map((name) => subjectIdByName.get(name))
      .filter((id): id is string => Boolean(id));

    if (subjectIds.length > 0) {
      await prisma.curriculumTemplateGradeSubject.createMany({
        data: subjectIds.map((subjectId) => ({
          gradeId: grade.id,
          subjectId,
        })),
      });
    }
  }

  return { code: t.code, templateId: template.id };
}

async function seedCBCStudentFields() {
  const cbc = await prisma.curriculumTemplate.findUnique({
    where: { code: "KE_CBC" },
    select: { id: true },
  });

  if (!cbc) return;

  const fields = [
    { key: "nemisNumber", label: "NEMIS Number", type: "STRING", required: true },
    { key: "upi", label: "UPI", type: "STRING", required: false },
    { key: "birthCertNo", label: "Birth Certificate Number", type: "STRING", required: false },
  ] as const;

  for (const f of fields) {
    await prisma.templateStudentField.upsert({
      where: {
        templateId_key: {
          templateId: cbc.id,
          key: f.key,
        },
      },
      update: {
        label: f.label,
        type: f.type,
        required: f.required,
      },
      create: {
        templateId: cbc.id,
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
      },
    });
  }

  console.log(
    "✅ Seeded CBC student fields:",
    fields.map((f) => f.key).join(", ")
  );
}

async function main() {
  for (const t of seeds) {
    await seedTemplate(t);
  }

  await seedCBCStudentFields();
  await seedGeo(prisma);

  console.log(
    "✅ Seeded curriculum templates:",
    seeds.map((s) => s.code).join(", ")
  );
  console.log("✅ Geo seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });