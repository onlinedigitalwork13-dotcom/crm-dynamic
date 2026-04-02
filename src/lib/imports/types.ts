export type CourseImportSourceType = "csv" | "website" | "api";

export type CourseImportRowBase = {
  providerName: string;
  courseName: string;
  courseCode?: string;
  level?: string;
  duration?: string;
  intakeMonths?: string;
  campus?: string;
  description?: string;
  category?: string;
  studyMode?: string;
  durationUnit?: string;
  currency?: string;
  entryRequirements?: string;
  englishRequirements?: string;
  notes?: string;
  sourceType: CourseImportSourceType;
  sourceValue?: string;
  rawRowIndex?: number;
};

export type CourseImportRowData = CourseImportRowBase & {
  tuitionFee?: string | number;
  durationValue?: string | number;
  applicationFee?: string | number;
  materialFee?: string | number;
};

export type RawNormalizedCourseImportRow = CourseImportRowData;
export type NormalizedCourseImportRow = CourseImportRowData;

export type CourseImportPreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: CourseImportRowData;
  isValid: boolean;
  errors: string[];
  matchedProviderId?: string;
  matchedProviderName?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  willImport: boolean;
};

export type CourseImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importableRows: number;
  unmatchedProviders: number;
};

export type CourseImportPreviewResult = {
  sourceType: CourseImportSourceType;
  sourceValue?: string;
  rows: CourseImportPreviewRow[];
  summary: CourseImportPreviewSummary;
};

export type CourseImportPreviewRequest = {
  sourceType: CourseImportSourceType;
  sourceValue?: string;
  rows: Record<string, unknown>[];
};

export type CourseImportCommitRequest = {
  importJobId?: string;
  sourceType: CourseImportSourceType;
  sourceValue?: string;
  rows: CourseImportPreviewRow[];
};

export type CourseImportCommitResult = {
  importJobId: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  invalidRows: number;
};

export type ProviderMatchResult = {
  providerId?: string;
  providerName?: string;
  matched: boolean;
};

export type CourseDuplicateCheckResult = {
  isDuplicate: boolean;
  reason?: string;
};