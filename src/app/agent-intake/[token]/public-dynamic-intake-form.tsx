"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";
import type { NormalizedSection } from "./normalize-form-schema";

type PublicFormData = {
  id: string;
  token: string;
  title: string;
  description: string | null;
  status: string;
  isActive: boolean;
  submitButtonText: string | null;
  successMessage: string | null;
};

type Props = {
  form: PublicFormData;
  schema: NormalizedSection[];
};

type StudentSearchMatch = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  branchId: string | null;
  createdAt: string;
};

type StudentSearchResponse = {
  exists: boolean;
  matches: StudentSearchMatch[];
  error?: string;
};

type ProviderOption = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
};

type CourseOption = {
  id: string;
  name: string;
  level: string | null;
  campus: string | null;
  intakeMonths: string | null;
  duration: string | null;
};

const CLIENT_FIELD_KEYS = new Set([
  "title",
  "surname",
  "lastname",
  "firstname",
  "middlename",
  "preferredname",
  "nationality",
  "country",
  "passportno",
  "passportnumber",
  "residentialaddress",
  "postaladdress",
  "mobile",
  "phone",
  "home",
  "work",
  "email",
  "occupation",
  "subclass",
  "expireson",
  "conditions",
  "applicablefamilymembers",
  "emergencyfirstname",
  "emergencysurname",
  "emergencyaddress",
  "emergencymobile",
  "emergencyhome",
  "emergencywork",
  "emergencyemail",
  "dateofbirth",
  "dob",
  "city",
  "address",
]);

const APPLICATION_FIELD_KEYS = new Set([
  "destinationcountry",
  "providername",
  "providerid",
  "coursename",
  "courseid",
  "subjectarea",
  "intake",
  "studylevel",
  "preferredcampus",
  "applicationstatus",
  "appliedon",
  "duration",
]);

const SUBAGENT_FIELD_KEYS = new Set([
  "subagentname",
  "agencyname",
  "subagentemail",
  "subagentphone",
  "subagentreference",
]);

function toFormDataValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function getVisibleSectionCount(schema: NormalizedSection[]) {
  return schema.filter((section) =>
    section.fields.some((field) => field.visible !== false)
  ).length;
}

function getVisibleFieldCount(schema: NormalizedSection[]) {
  return schema.reduce(
    (sum, section) =>
      sum + section.fields.filter((field) => field.visible !== false).length,
    0
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fieldKeys(section: NormalizedSection) {
  return section.fields.map((field) => field.key.toLowerCase());
}

function getDynamicSections(schema: NormalizedSection[]) {
  const referralSections: NormalizedSection[] = [];
  const otherSections: NormalizedSection[] = [];

  for (const section of schema) {
    const keys = fieldKeys(section);

    const hasClientField = keys.some((key) => CLIENT_FIELD_KEYS.has(key));
    const hasApplicationField = keys.some((key) =>
      APPLICATION_FIELD_KEYS.has(key)
    );
    const hasSubagentField = keys.some((key) => SUBAGENT_FIELD_KEYS.has(key));
    const hasNotesField = keys.includes("notes");

    if (hasClientField || hasApplicationField) {
      const nextFields = section.fields.filter(
        (field) =>
          !CLIENT_FIELD_KEYS.has(field.key.toLowerCase()) &&
          !APPLICATION_FIELD_KEYS.has(field.key.toLowerCase())
      );

      if (nextFields.length > 0) {
        otherSections.push({
          ...section,
          fields: nextFields,
        });
      }
      continue;
    }

    if (hasSubagentField || hasNotesField) {
      referralSections.push(section);
      continue;
    }

    otherSections.push(section);
  }

  return {
    referralSections,
    otherSections,
  };
}

function SnapshotField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function SectionShell({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {badge || "Section"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function TitleSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["Mr", "Mrs", "Ms", "Miss", "Other"];

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        Title
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PublicDynamicIntakeForm({ form, schema }: Props) {
  const { values, setValue, resetValues } = useDynamicForm(schema as never);

  const [searchingStudent, setSearchingStudent] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [matchedStudents, setMatchedStudents] = useState<StudentSearchMatch[]>(
    []
  );
  const [selectedStudent, setSelectedStudent] =
    useState<StudentSearchMatch | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{
    message?: string;
    matchedExistingClient?: boolean;
    subagentId?: string | null;
  } | null>(null);

  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const visibleSectionCount = useMemo(
    () => getVisibleSectionCount(schema),
    [schema]
  );

  const visibleFieldCount = useMemo(
    () => getVisibleFieldCount(schema),
    [schema]
  );

  const searchValues = useMemo(
    () => ({
      firstName: normalizeString(values.firstName),
      lastName:
        normalizeString(values.lastName) || normalizeString(values.surname),
      email: normalizeString(values.email),
      phone:
        normalizeString(values.phone) || normalizeString(values.mobile),
    }),
    [values]
  );

  const canSearch =
    Boolean(searchValues.firstName) ||
    Boolean(searchValues.lastName) ||
    Boolean(searchValues.email) ||
    Boolean(searchValues.phone);

  const showSearchStep = !searchCompleted && !submitSuccess;

  const dynamicSections = useMemo(() => getDynamicSections(schema), [schema]);

  const applicationSnapshot = useMemo(
    () => ({
      destinationCountry: normalizeString(values.destinationCountry),
      providerName: normalizeString(values.providerName),
      courseName: normalizeString(values.courseName),
      studyLevel: normalizeString(values.studyLevel),
      intake: normalizeString(values.intake),
      preferredCampus: normalizeString(values.preferredCampus),
      subjectArea: normalizeString(values.subjectArea),
      duration: normalizeString(values.duration),
      notes: normalizeString(values.notes),
      subagentName: normalizeString(values.subagentName),
      agencyName: normalizeString(values.agencyName),
    }),
    [values]
  );

  const clientSnapshot = useMemo(
    () => ({
      fullName:
        selectedStudent?.fullName ||
        [
          normalizeString(values.firstName),
          normalizeString(values.surname) || normalizeString(values.lastName),
        ]
          .filter(Boolean)
          .join(" "),
      email: selectedStudent?.email || normalizeString(values.email),
      phone:
        selectedStudent?.phone ||
        normalizeString(values.mobile) ||
        normalizeString(values.phone),
      country: normalizeString(values.country),
    }),
    [selectedStudent, values]
  );

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      setProvidersLoading(true);
      setProvidersError(null);

      try {
        const response = await fetch("/api/public/providers");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load providers");
        }

        if (!active) return;
        setProviders(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (!active) return;
        setProvidersError(
          error instanceof Error ? error.message : "Failed to load providers"
        );
        setProviders([]);
      } finally {
        if (active) {
          setProvidersLoading(false);
        }
      }
    }

    loadProviders();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      if (!selectedProviderId) {
        setCourses([]);
        setSelectedCourseId("");
        setCoursesError(null);
        return;
      }

      setCoursesLoading(true);
      setCoursesError(null);

      try {
        const response = await fetch(
          `/api/public/providers/${selectedProviderId}/courses`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load courses");
        }

        if (!active) return;
        setCourses(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (!active) return;
        setCoursesError(
          error instanceof Error ? error.message : "Failed to load courses"
        );
        setCourses([]);
      } finally {
        if (active) {
          setCoursesLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [selectedProviderId]);

  useEffect(() => {
    const matchedProvider = providers.find(
      (provider) => provider.name === normalizeString(values.providerName)
    );

    if (matchedProvider && matchedProvider.id !== selectedProviderId) {
      setSelectedProviderId(matchedProvider.id);
    }
  }, [providers, selectedProviderId, values.providerName]);

  function handleProviderChange(providerId: string) {
    setSelectedProviderId(providerId);
    setSelectedCourseId("");

    const provider = providers.find((item) => item.id === providerId);

    setValue("providerId", providerId);
    setValue("providerName", provider?.name || "");

    if (provider?.country && !normalizeString(values.destinationCountry)) {
      setValue("destinationCountry", provider.country);
    }

    setValue("courseId", "");
    setValue("courseName", "");
    setValue("studyLevel", "");
    setValue("preferredCampus", "");
    setValue("duration", "");
  }

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);

    const course = courses.find((item) => item.id === courseId);

    setValue("courseId", courseId);
    setValue("courseName", course?.name || "");

    if (course?.level) {
      setValue("studyLevel", course.level);
    }

    if (course?.campus) {
      setValue("preferredCampus", course.campus);
    }

    if (course?.intakeMonths && !normalizeString(values.intake)) {
      setValue("intake", course.intakeMonths);
    }

    if (course?.duration) {
      setValue("duration", course.duration);
    }
  }

  async function handleStudentSearch() {
    setSearchingStudent(true);
    setSearchError(null);

    try {
      const response = await fetch("/api/intake/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchValues),
      });

      const data = (await response.json()) as StudentSearchResponse;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to search student");
      }

      setMatchedStudents(data.matches || []);
      setSelectedStudent(data.matches?.[0] ?? null);
      setSearchCompleted(true);
    } catch (error) {
      console.error("Student search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search student"
      );
      setMatchedStudents([]);
      setSelectedStudent(null);
      setSearchCompleted(false);
    } finally {
      setSearchingStudent(false);
    }
  }

  function continueAsNewStudent() {
    setMatchedStudents([]);
    setSelectedStudent(null);
    setSearchCompleted(true);
    setSearchError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      for (const section of schema) {
        for (const field of section.fields) {
          if (field.visible === false) continue;

          const value = values[field.key];

          if (field.type === "checkbox") {
            if (value === true || value === "true") {
              formData.append(field.key, "on");
            }
            continue;
          }

          formData.append(field.key, toFormDataValue(value));
        }
      }

      const fixedFields: Record<string, string> = {
        title: normalizeString(values.title),
        surname:
          normalizeString(values.surname) || normalizeString(values.lastName),
        lastName:
          normalizeString(values.surname) || normalizeString(values.lastName),
        firstName: normalizeString(values.firstName),
        preferredName: normalizeString(values.preferredName),
        nationality: normalizeString(values.nationality),
        country: normalizeString(values.country),
        passportNo:
          normalizeString(values.passportNo) ||
          normalizeString(values.passportNumber),
        passportNumber:
          normalizeString(values.passportNo) ||
          normalizeString(values.passportNumber),
        residentialAddress:
          normalizeString(values.residentialAddress) ||
          normalizeString(values.address),
        address:
          normalizeString(values.residentialAddress) ||
          normalizeString(values.address),
        postalAddress: normalizeString(values.postalAddress),
        mobile:
          normalizeString(values.mobile) || normalizeString(values.phone),
        phone:
          normalizeString(values.mobile) || normalizeString(values.phone),
        home: normalizeString(values.home),
        work: normalizeString(values.work),
        email: normalizeString(values.email),
        occupation: normalizeString(values.occupation),
        subclass: normalizeString(values.subclass),
        expiresOn: normalizeString(values.expiresOn),
        conditions: normalizeString(values.conditions),
        applicableFamilyMembers: normalizeString(values.applicableFamilyMembers),
        emergencyFirstName: normalizeString(values.emergencyFirstName),
        emergencySurname: normalizeString(values.emergencySurname),
        emergencyAddress: normalizeString(values.emergencyAddress),
        emergencyMobile: normalizeString(values.emergencyMobile),
        emergencyHome: normalizeString(values.emergencyHome),
        emergencyWork: normalizeString(values.emergencyWork),
        emergencyEmail: normalizeString(values.emergencyEmail),
        destinationCountry: normalizeString(values.destinationCountry),
        providerId: normalizeString(values.providerId),
        providerName: normalizeString(values.providerName),
        courseId: normalizeString(values.courseId),
        courseName: normalizeString(values.courseName),
        intake: normalizeString(values.intake),
        studyLevel: normalizeString(values.studyLevel),
        preferredCampus: normalizeString(values.preferredCampus),
        subjectArea: normalizeString(values.subjectArea),
        duration: normalizeString(values.duration),
        notes: normalizeString(values.notes),
        subagentName: normalizeString(values.subagentName),
        agencyName: normalizeString(values.agencyName),
        subagentEmail: normalizeString(values.subagentEmail),
        subagentPhone: normalizeString(values.subagentPhone),
        subagentReference: normalizeString(values.subagentReference),
      };

      for (const [key, value] of Object.entries(fixedFields)) {
        formData.set(key, value);
      }

      if (selectedStudent) {
        formData.append("existingClientId", selectedStudent.id);
        formData.append("existingClientMatched", "true");
        formData.append("isExistingStudent", "true");
      } else {
        formData.append("existingClientMatched", "false");
        formData.append("isExistingStudent", "false");
      }

      if (!selectedStudent) {
        const requiredChecks = [
          {
            key: "firstName",
            label: "First Name",
            value: normalizeString(values.firstName),
          },
          {
            key: "surname",
            label: "Surname",
            value:
              normalizeString(values.surname) ||
              normalizeString(values.lastName),
          },
          {
            key: "mobile",
            label: "Mobile",
            value:
              normalizeString(values.mobile) ||
              normalizeString(values.phone),
          },
          {
            key: "emergencyFirstName",
            label: "Emergency Contact First Name",
            value: normalizeString(values.emergencyFirstName),
          },
          {
            key: "emergencySurname",
            label: "Emergency Contact Surname",
            value: normalizeString(values.emergencySurname),
          },
          {
            key: "emergencyAddress",
            label: "Emergency Contact Address",
            value: normalizeString(values.emergencyAddress),
          },
          {
            key: "emergencyMobile",
            label: "Emergency Contact Mobile",
            value: normalizeString(values.emergencyMobile),
          },
          {
            key: "emergencyEmail",
            label: "Emergency Contact Email",
            value: normalizeString(values.emergencyEmail),
          },
          {
            key: "destinationCountry",
            label: "Destination Country",
            value: normalizeString(values.destinationCountry),
          },
          {
            key: "providerName",
            label: "Provider / University / College",
            value: normalizeString(values.providerName),
          },
          {
            key: "courseName",
            label: "Course Name",
            value: normalizeString(values.courseName),
          },
          {
            key: "subagentName",
            label: "Subagent Name",
            value: normalizeString(values.subagentName),
          },
        ];

        const missing = requiredChecks.find((item) => !item.value);

        if (missing) {
          setSubmitError(`${missing.label} is required.`);
          setSubmitting(false);
          return;
        }
      }

      const response = await fetch(`/api/forms/${form.token}`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData?.details?.[0] ||
              errorData?.error ||
              "Failed to submit form"
          );
        }

        const text = await response.text();
        throw new Error(text || "Failed to submit form");
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Unexpected server response");
      }

      const data = await response.json();

      setSuccessPayload({
        message:
          typeof data?.message === "string" ? data.message : undefined,
        matchedExistingClient: Boolean(
          data?.matchedExistingClient || selectedStudent
        ),
        subagentId:
          typeof data?.subagentId === "string" ? data.subagentId : null,
      });

      setSubmitSuccess(true);
      resetValues();
      setMatchedStudents([]);
      setSelectedStudent(null);
      setSearchCompleted(false);
      setSearchError(null);
      setSelectedProviderId("");
      setSelectedCourseId("");
      setCourses([]);
    } catch (error) {
      console.error("Public form submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Agent Intake • Public Submission
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {form.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {form.description ||
                    "Search the student first, continue with a premium intake workflow, and submit directly into CRM without creating unnecessary duplicates."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {form.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">
                    Sections
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {visibleSectionCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">
                    Fields
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {visibleFieldCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {submitSuccess ? (
              <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-7 w-7"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-emerald-950">
                      Submission Successful
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-900">
                      {successPayload?.message ||
                        form.successMessage ||
                        "Thank you. Your form has been submitted successfully."}
                    </p>

                    {successPayload?.matchedExistingClient ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
                        This application was linked to an existing student profile,
                        keeping the CRM clean while still recording the new intake.
                      </div>
                    ) : null}

                    {successPayload?.subagentId ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        Referral tracking has been linked successfully for CRM processing.
                      </div>
                    ) : null}

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitSuccess(false);
                          setSuccessPayload(null);
                          setSubmitError(null);
                          setMatchedStudents([]);
                          setSelectedStudent(null);
                          setSearchCompleted(false);
                          setSearchError(null);
                        }}
                        className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        Submit another response
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : showSearchStep ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <SectionShell
                  badge="Step 1"
                  title="Search Student First"
                  description="Search by name, email, or phone before continuing. This prevents duplicates and ensures repeat applicants stay under the same student profile."
                >
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    Enter at least one of: first name, last name, email, or phone.
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="First Name"
                      value={normalizeString(values.firstName)}
                      onChange={(value) => setValue("firstName", value)}
                      placeholder="Enter first name"
                    />
                    <InputField
                      label="Last Name"
                      value={
                        normalizeString(values.surname) ||
                        normalizeString(values.lastName)
                      }
                      onChange={(value) => {
                        setValue("surname", value);
                        setValue("lastName", value);
                      }}
                      placeholder="Enter last name"
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={normalizeString(values.email)}
                      onChange={(value) => setValue("email", value)}
                      placeholder="Enter email"
                    />
                    <InputField
                      label="Phone"
                      value={
                        normalizeString(values.mobile) ||
                        normalizeString(values.phone)
                      }
                      onChange={(value) => {
                        setValue("mobile", value);
                        setValue("phone", value);
                      }}
                      placeholder="Enter phone"
                    />
                  </div>

                  {searchError ? (
                    <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {searchError}
                    </div>
                  ) : null}

                  {matchedStudents.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Matching Students
                      </p>

                      {matchedStudents.map((student) => {
                        const isSelected = selectedStudent?.id === student.id;

                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className={`w-full rounded-[24px] border p-4 text-left transition ${
                              isSelected
                                ? "border-slate-950 bg-slate-50 shadow-sm"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                                  {getInitials(student.fullName || "S")}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {student.fullName}
                                  </p>
                                  <p className="mt-1 truncate text-sm text-slate-600">
                                    {student.email || "No email"}
                                    {student.phone ? ` • ${student.phone}` : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="text-xs text-slate-500">
                                Added {formatDate(student.createdAt)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={handleStudentSearch}
                      disabled={searchingStudent || !canSearch}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {searchingStudent ? "Searching..." : "Search Student"}
                    </button>

                    <button
                      type="button"
                      onClick={continueAsNewStudent}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Continue as New Student
                    </button>
                  </div>

                  {matchedStudents.length > 0 ? (
                    <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">
                        Existing student found
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Continue with the intake below. The new enquiry will stay
                        linked to the same student profile instead of creating a
                        duplicate.
                      </p>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setSearchCompleted(true)}
                          disabled={!selectedStudent}
                          className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Continue with Existing Student
                        </button>
                      </div>
                    </div>
                  ) : null}
                </SectionShell>

                <aside className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Before you submit
                    </h2>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <p>
                        Search first to reduce duplicate student records and speed
                        up repeat applications.
                      </p>
                      <p>
                        If a student already exists, the CRM will keep the same
                        profile and still record the new intake cleanly.
                      </p>
                      <p>
                        If no student is found, continue as a new student and
                        submit the full intake.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Submission details
                    </h2>

                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Form token</dt>
                        <dd className="break-all text-right font-medium text-slate-900">
                          {form.token}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Status</dt>
                        <dd className="font-medium text-slate-900">
                          {form.status}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Visibility</dt>
                        <dd className="font-medium text-slate-900">
                          {form.isActive ? "Open for submission" : "Unavailable"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </aside>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
              >
                <div className="space-y-6">
                  <SectionShell
                    badge="Client"
                    title={
                      selectedStudent
                        ? "Existing Student Matched"
                        : "Client Details"
                    }
                    description={
                      selectedStudent
                        ? "We found an existing student profile. The identity record stays preserved, while this new enquiry continues into a fresh application flow."
                        : "Complete the client block exactly like Add Client, with personal details, address & contact, visa, and emergency contact information."
                    }
                  >
                    {selectedStudent ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                              {getInitials(selectedStudent.fullName || "S")}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                Matched Student
                              </p>
                              <h3 className="mt-2 text-lg font-bold text-slate-950">
                                {selectedStudent.fullName}
                              </h3>
                              <p className="mt-2 text-sm text-slate-700">
                                {selectedStudent.email || "No email"}
                                {selectedStudent.phone
                                  ? ` • ${selectedStudent.phone}`
                                  : ""}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                Client record created{" "}
                                {formatDate(selectedStudent.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Existing profile handling
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            The client profile is already in CRM. This submission
                            will create a new intake and lead under the same
                            student without duplicating the person record.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-slate-950">
                            Personal Details
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Basic student identity and passport details.
                          </p>

                          <div className="mt-5 grid gap-4">
                            <TitleSelector
                              value={normalizeString(values.title)}
                              onChange={(value) => setValue("title", value)}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                              <InputField
                                label="Surname"
                                required
                                value={
                                  normalizeString(values.surname) ||
                                  normalizeString(values.lastName)
                                }
                                onChange={(value) => {
                                  setValue("surname", value);
                                  setValue("lastName", value);
                                }}
                                placeholder="Enter surname"
                              />
                              <InputField
                                label="First Name"
                                required
                                value={normalizeString(values.firstName)}
                                onChange={(value) => setValue("firstName", value)}
                                placeholder="Enter first name(s)"
                              />
                              <InputField
                                label="Preferred Name"
                                value={normalizeString(values.preferredName)}
                                onChange={(value) =>
                                  setValue("preferredName", value)
                                }
                                placeholder="Enter preferred name"
                              />
                              <InputField
                                label="Nationality"
                                value={normalizeString(values.nationality)}
                                onChange={(value) =>
                                  setValue("nationality", value)
                                }
                                placeholder="Enter nationality"
                              />
                              <InputField
                                label="Country"
                                value={normalizeString(values.country)}
                                onChange={(value) => setValue("country", value)}
                                placeholder="Enter country"
                              />
                              <InputField
                                label="Passport No"
                                value={
                                  normalizeString(values.passportNo) ||
                                  normalizeString(values.passportNumber)
                                }
                                onChange={(value) => {
                                  setValue("passportNo", value);
                                  setValue("passportNumber", value);
                                }}
                                placeholder="Enter passport number"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-slate-950">
                            Address & Contact
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Advanced contact profile with residential and postal
                            address support.
                          </p>

                          <div className="mt-5 grid gap-4">
                            <TextAreaField
                              label="Residential Address"
                              value={
                                normalizeString(values.residentialAddress) ||
                                normalizeString(values.address)
                              }
                              onChange={(value) => {
                                setValue("residentialAddress", value);
                                setValue("address", value);
                              }}
                              placeholder="Enter residential address"
                              rows={3}
                            />

                            <TextAreaField
                              label="Postal Address"
                              value={normalizeString(values.postalAddress)}
                              onChange={(value) =>
                                setValue("postalAddress", value)
                              }
                              placeholder="Enter postal address"
                              rows={3}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                              <InputField
                                label="Mobile"
                                required
                                value={
                                  normalizeString(values.mobile) ||
                                  normalizeString(values.phone)
                                }
                                onChange={(value) => {
                                  setValue("mobile", value);
                                  setValue("phone", value);
                                }}
                                placeholder="Enter mobile number"
                              />
                              <InputField
                                label="Home"
                                value={normalizeString(values.home)}
                                onChange={(value) => setValue("home", value)}
                                placeholder="Enter home number"
                              />
                              <InputField
                                label="Work"
                                value={normalizeString(values.work)}
                                onChange={(value) => setValue("work", value)}
                                placeholder="Enter work number"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <InputField
                                label="Email"
                                type="email"
                                value={normalizeString(values.email)}
                                onChange={(value) => setValue("email", value)}
                                placeholder="Enter email"
                              />
                              <InputField
                                label="Occupation"
                                value={normalizeString(values.occupation)}
                                onChange={(value) =>
                                  setValue("occupation", value)
                                }
                                placeholder="Enter occupation"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-slate-950">
                            Current Visa
                          </h3>

                          <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <InputField
                              label="Subclass"
                              value={normalizeString(values.subclass)}
                              onChange={(value) => setValue("subclass", value)}
                              placeholder="Enter visa subclass"
                            />
                            <InputField
                              label="Expires On"
                              type="date"
                              value={normalizeString(values.expiresOn)}
                              onChange={(value) => setValue("expiresOn", value)}
                            />
                            <InputField
                              label="Conditions"
                              value={normalizeString(values.conditions)}
                              onChange={(value) => setValue("conditions", value)}
                              placeholder="Enter visa conditions"
                            />
                          </div>

                          <div className="mt-4">
                            <TextAreaField
                              label="Any person who should join / relation / visa"
                              value={normalizeString(values.applicableFamilyMembers)}
                              onChange={(value) =>
                                setValue("applicableFamilyMembers", value)
                              }
                              placeholder="Enter family / applicable details"
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-slate-950">
                            Emergency Contact Details
                          </h3>

                          <div className="mt-5 grid gap-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <InputField
                                label="First Name"
                                required
                                value={normalizeString(values.emergencyFirstName)}
                                onChange={(value) =>
                                  setValue("emergencyFirstName", value)
                                }
                                placeholder="Enter emergency contact first name"
                              />
                              <InputField
                                label="Surname"
                                required
                                value={normalizeString(values.emergencySurname)}
                                onChange={(value) =>
                                  setValue("emergencySurname", value)
                                }
                                placeholder="Enter emergency contact surname"
                              />
                            </div>

                            <TextAreaField
                              label="Address"
                              required
                              value={normalizeString(values.emergencyAddress)}
                              onChange={(value) =>
                                setValue("emergencyAddress", value)
                              }
                              placeholder="Enter emergency contact address"
                              rows={3}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                              <InputField
                                label="Mobile"
                                required
                                value={normalizeString(values.emergencyMobile)}
                                onChange={(value) =>
                                  setValue("emergencyMobile", value)
                                }
                                placeholder="Enter emergency mobile number"
                              />
                              <InputField
                                label="Home"
                                value={normalizeString(values.emergencyHome)}
                                onChange={(value) =>
                                  setValue("emergencyHome", value)
                                }
                                placeholder="Enter emergency home number"
                              />
                              <InputField
                                label="Work"
                                value={normalizeString(values.emergencyWork)}
                                onChange={(value) =>
                                  setValue("emergencyWork", value)
                                }
                                placeholder="Enter emergency work number"
                              />
                            </div>

                            <InputField
                              label="Email"
                              type="email"
                              required
                              value={normalizeString(values.emergencyEmail)}
                              onChange={(value) =>
                                setValue("emergencyEmail", value)
                              }
                              placeholder="Enter emergency email"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </SectionShell>

                  <SectionShell
                    badge="Application"
                    title="Application Details"
                    description="Capture destination, provider, course, intake, and study preferences in the same polished application style used inside CRM."
                  >
                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-slate-950">
                          Study Preferences
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Select provider and course from your live catalog, then
                          capture intake and study preferences.
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <InputField
                            label="Destination Country"
                            required
                            value={normalizeString(values.destinationCountry)}
                            onChange={(value) =>
                              setValue("destinationCountry", value)
                            }
                            placeholder="Enter destination country"
                          />

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                              Provider / University / College{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={selectedProviderId}
                              onChange={(e) =>
                                handleProviderChange(e.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                              required
                            >
                              <option value="">
                                {providersLoading
                                  ? "Loading providers..."
                                  : "Select provider"}
                              </option>
                              {providers.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name}
                                  {provider.city ? ` • ${provider.city}` : ""}
                                  {provider.country
                                    ? ` • ${provider.country}`
                                    : ""}
                                </option>
                              ))}
                            </select>
                            {providersError ? (
                              <p className="mt-2 text-sm text-rose-600">
                                {providersError}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                              Course Name <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={selectedCourseId}
                              onChange={(e) => handleCourseChange(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                              required
                              disabled={!selectedProviderId || coursesLoading}
                            >
                              <option value="">
                                {!selectedProviderId
                                  ? "Select provider first"
                                  : coursesLoading
                                  ? "Loading courses..."
                                  : "Select course"}
                              </option>
                              {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.name}
                                  {course.level ? ` • ${course.level}` : ""}
                                  {course.campus ? ` • ${course.campus}` : ""}
                                </option>
                              ))}
                            </select>
                            {coursesError ? (
                              <p className="mt-2 text-sm text-rose-600">
                                {coursesError}
                              </p>
                            ) : null}
                          </div>

                          <InputField
                            label="Intake"
                            value={normalizeString(values.intake)}
                            onChange={(value) => setValue("intake", value)}
                            placeholder="Enter intake"
                          />

                          <InputField
                            label="Study Level"
                            value={normalizeString(values.studyLevel)}
                            onChange={(value) => setValue("studyLevel", value)}
                            placeholder="Enter study level"
                          />

                          <InputField
                            label="Preferred Campus"
                            value={normalizeString(values.preferredCampus)}
                            onChange={(value) =>
                              setValue("preferredCampus", value)
                            }
                            placeholder="Enter preferred campus"
                          />
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <InputField
                            label="Subject Area"
                            value={normalizeString(values.subjectArea)}
                            onChange={(value) => setValue("subjectArea", value)}
                            placeholder="Enter subject area"
                          />

                          <InputField
                            label="Course Duration"
                            value={normalizeString(values.duration)}
                            onChange={(value) => setValue("duration", value)}
                            placeholder="Auto-filled from course"
                          />
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-slate-950">
                          Application Notes
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Add any application-specific notes, preferences, or
                          supporting context.
                        </p>

                        <div className="mt-5">
                          <TextAreaField
                            label="Notes"
                            value={normalizeString(values.notes)}
                            onChange={(value) => setValue("notes", value)}
                            placeholder="Add any application notes"
                            rows={5}
                          />
                        </div>
                      </div>
                    </div>
                  </SectionShell>

                  <SectionShell
                    badge="Subagent"
                    title="Subagent Details"
                    description="Capture the referring subagent or agency details clearly on every submission."
                  >
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <InputField
                          label="Subagent Name"
                          required
                          value={normalizeString(values.subagentName)}
                          onChange={(value) => setValue("subagentName", value)}
                          placeholder="Enter subagent name"
                        />
                        <InputField
                          label="Agency Name"
                          value={normalizeString(values.agencyName)}
                          onChange={(value) => setValue("agencyName", value)}
                          placeholder="Enter agency name"
                        />
                        <InputField
                          label="Subagent Email"
                          type="email"
                          value={normalizeString(values.subagentEmail)}
                          onChange={(value) => setValue("subagentEmail", value)}
                          placeholder="Enter subagent email"
                        />
                        <InputField
                          label="Subagent Phone"
                          value={normalizeString(values.subagentPhone)}
                          onChange={(value) => setValue("subagentPhone", value)}
                          placeholder="Enter subagent phone"
                        />
                      </div>

                      <div className="mt-4">
                        <InputField
                          label="Subagent Reference"
                          value={normalizeString(values.subagentReference)}
                          onChange={(value) =>
                            setValue("subagentReference", value)
                          }
                          placeholder="Enter reference or code"
                        />
                      </div>
                    </div>
                  </SectionShell>

                  {dynamicSections.otherSections.length > 0 && (
                    <SectionShell
                      badge="Additional"
                      title="Additional Details"
                      description="Capture any extra public-safe notes or supporting information required by this intake form."
                    >
                      <div className="space-y-5">
                        {dynamicSections.otherSections.map((section) => (
                          <div
                            key={section.key}
                            className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                          >
                            <DynamicFormRenderer
                              schema={[section] as never}
                              values={values}
                              onChange={setValue}
                            />
                          </div>
                        ))}
                      </div>
                    </SectionShell>
                  )}

                  {submitError ? (
                    <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCompleted(false);
                        setSubmitError(null);
                      }}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Back to Search
                    </button>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => {
                          resetValues();
                          setSubmitError(null);
                          setMatchedStudents([]);
                          setSelectedStudent(null);
                          setSearchCompleted(false);
                          setSearchError(null);
                          setSelectedProviderId("");
                          setSelectedCourseId("");
                          setCourses([]);
                        }}
                        disabled={submitting || schema.length === 0}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting
                          ? "Submitting..."
                          : form.submitButtonText || "Submit"}
                      </button>
                    </div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-bold text-white">
                        {selectedStudent
                          ? getInitials(selectedStudent.fullName || "S")
                          : getInitials(clientSnapshot.fullName || "N")}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Student Snapshot
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-950">
                          {selectedStudent
                            ? "Matched Existing Student"
                            : "New Student"}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <SnapshotField label="Name" value={clientSnapshot.fullName} />
                      <SnapshotField label="Email" value={clientSnapshot.email} />
                      <SnapshotField label="Phone" value={clientSnapshot.phone} />
                      <SnapshotField
                        label="Country"
                        value={clientSnapshot.country}
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Application Snapshot
                    </h2>
                    <div className="mt-4 space-y-3">
                      <SnapshotField
                        label="Destination"
                        value={applicationSnapshot.destinationCountry}
                      />
                      <SnapshotField
                        label="Provider"
                        value={applicationSnapshot.providerName}
                      />
                      <SnapshotField
                        label="Course"
                        value={applicationSnapshot.courseName}
                      />
                      <SnapshotField
                        label="Intake"
                        value={applicationSnapshot.intake}
                      />
                      <SnapshotField
                        label="Study Level"
                        value={applicationSnapshot.studyLevel}
                      />
                      <SnapshotField
                        label="Duration"
                        value={applicationSnapshot.duration}
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Referral Snapshot
                    </h2>
                    <div className="mt-4 space-y-3">
                      <SnapshotField
                        label="Subagent"
                        value={applicationSnapshot.subagentName}
                      />
                      <SnapshotField
                        label="Agency"
                        value={applicationSnapshot.agencyName}
                      />
                      <SnapshotField
                        label="Campus"
                        value={applicationSnapshot.preferredCampus}
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Provider & course pull
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      This page now uses the public provider and course catalog so
                      subagents can select real institutions and courses without
                      requiring login.
                    </p>
                  </div>
                </aside>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}