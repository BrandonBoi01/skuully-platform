import { StudentPositionScope } from "@prisma/client";

export type StudentPositionTemplate = {
  key: string;
  name: string;
  scope: StudentPositionScope;
  description?: string;
  isElective?: boolean;
  isVisible?: boolean;
  maxHolders?: number;
  sortOrder?: number;
};

export const DEFAULT_STUDENT_POSITION_TEMPLATES: StudentPositionTemplate[] = [
  {
    key: "SCHOOL_PRESIDENT",
    name: "School President",
    scope: StudentPositionScope.INSTITUTION,
    description: "Leads the student body at institution level",
    isElective: true,
    maxHolders: 1,
    sortOrder: 1,
  },
  {
    key: "DEPUTY_SCHOOL_PRESIDENT",
    name: "Deputy School President",
    scope: StudentPositionScope.INSTITUTION,
    description: "Supports the school president",
    isElective: true,
    maxHolders: 1,
    sortOrder: 2,
  },
  {
    key: "HEAD_PREFECT",
    name: "Head Prefect",
    scope: StudentPositionScope.INSTITUTION,
    description: "Coordinates student leadership and discipline support",
    isElective: false,
    maxHolders: 1,
    sortOrder: 3,
  },
  {
    key: "CLASS_MONITOR",
    name: "Class Monitor",
    scope: StudentPositionScope.CLASS,
    description: "Represents and helps coordinate a class",
    isElective: false,
    maxHolders: 1,
    sortOrder: 10,
  },
  {
    key: "DINING_HALL_CAPTAIN",
    name: "Dining Hall Captain",
    scope: StudentPositionScope.INSTITUTION,
    description: "Supports dining hall order and coordination",
    isElective: false,
    maxHolders: 2,
    sortOrder: 20,
  },
  {
    key: "BELL_RINGER",
    name: "Bell Ringer",
    scope: StudentPositionScope.INSTITUTION,
    description: "Responsible for school bell duties",
    isElective: false,
    maxHolders: 2,
    sortOrder: 21,
  },
  {
    key: "LIBRARY_PREFECT",
    name: "Library Prefect",
    scope: StudentPositionScope.DEPARTMENT,
    description: "Supports library order and use",
    isElective: false,
    maxHolders: 2,
    sortOrder: 22,
  },
  {
    key: "SPORTS_CAPTAIN",
    name: "Sports Captain",
    scope: StudentPositionScope.INSTITUTION,
    description: "Leads sports activities and representation",
    isElective: true,
    maxHolders: 2,
    sortOrder: 23,
  },
];