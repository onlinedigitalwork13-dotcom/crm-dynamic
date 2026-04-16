"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OptionItem = {
  id: string;
  name: string;
};

type BranchItem = {
  id: string;
  name: string;
  code: string | null;
};

type WorkflowStageItem = {
  id: string;
  name: string;
  workflowId: string;
  orderIndex: number;
};

type SubmissionMeta = {
  sourceType?: string | null;
  subagent?: {
    name?: string | null;
    agencyName?: string | null;
    email?: string | null;
    phone?: string | null;
    reference?: string | null;
  } | null;
  applicationInterest?: {
    destinationCountry?: string | null;
    providerName?: string | null;
    courseName?: string | null;
    subjectArea?: string | null;
    intake?: string | null;
    studyLevel?: string | null;
    preferredCampus?: string | null;
  } | null;
  duplicateCheck?: {
    existingClientFound?: boolean;
    existingClientId?: string | null;
  } | null;
};

type DuplicateCandidate = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passport: string | null;
  branchId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  subagentId: string | null;
  reasons: string[];
  matchScore: number;
  nameMatch: boolean;
};

type Props = {
  submissionId: string;
  defaultValues: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passport: string;
    notes: string;
    branchId: string;
  };
  branches: BranchItem[];
  leadSources: OptionItem[];
  workflows: OptionItem[];
  workflowStages: WorkflowStageItem[];
  subagents: OptionItem[];
  submissionMeta?: unknown;
  duplicateCandidates?: DuplicateCandidate[];
  mode?: "intake" | "lead";
};

type SelectOption = {
  value: string;
  label: string;
};

type InputProps = {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

type SelectProps = {
  label: string;
  name: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function getSafeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getSafeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getSafeBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseSubmissionMeta(value: unknown): SubmissionMeta | null {
  const root = getSafeRecord(value);
  if (!root) return null;

  const subagentRecord = getSafeRecord(root.subagent);
  const applicationInterestRecord = getSafeRecord(root.applicationInterest);
  const duplicateCheckRecord = getSafeRecord(root.duplicateCheck);

  return {
    sourceType: getSafeString(root.sourceType),
    subagent: subagentRecord
      ? {
          name: getSafeString(subagentRecord.name),
          agencyName: getSafeString(subagentRecord.agencyName),
          email: getSafeString(subagentRecord.email),
          phone: getSafeString(subagentRecord.phone),
          reference: getSafeString(subagentRecord.reference),
        }
      : null,
    applicationInterest: applicationInterestRecord
      ? {
          destinationCountry: getSafeString(
            applicationInterestRecord.destinationCountry
          ),
          providerName: getSafeString(applicationInterestRecord.providerName),
          courseName: getSafeString(applicationInterestRecord.courseName),
          subjectArea: getSafeString(applicationInterestRecord.subjectArea),
          intake: getSafeString(applicationInterestRecord.intake),
          studyLevel: getSafeString(applicationInterestRecord.studyLevel),
          preferredCampus: getSafeString(
            applicationInterestRecord.preferredCampus
          ),
        }
      : null,
    duplicateCheck: duplicateCheckRecord
      ? {
          existingClientFound: getSafeBoolean(
            duplicateCheckRecord.existingClientFound
          ),
          existingClientId: getSafeString(duplicateCheckRecord.existingClientId),
        }
      : null,
  };
}

function getMatchScore(
  subagent: OptionItem,
  metaSubagent: NonNullable<SubmissionMeta["subagent"]>
) {
  const candidateName = normalizeText(subagent.name);
  const metaName = normalizeText(metaSubagent.name);
  const metaAgency = normalizeText(metaSubagent.agencyName);
  const metaEmail = normalizeText(metaSubagent.email);
  const metaPhone = normalizeText(metaSubagent.phone);
  const metaReference = normalizeText(metaSubagent.reference);

  let score = 0;

  if (metaName && candidateName === metaName) score += 100;
  else if (metaName && candidateName.includes(metaName)) score += 70;
  else if (metaName && metaName.includes(candidateName)) score += 55;

  if (metaAgency && candidateName.includes(metaAgency)) score += 35;
  if (metaEmail && candidateName.includes(metaEmail)) score += 20;
  if (metaPhone && candidateName.includes(metaPhone)) score += 20;
  if (metaReference && candidateName.includes(metaReference)) score += 20;

  return score;
}

function getSourceLabel(
  meta: SubmissionMeta | null,
  mode: "intake" | "lead" = "intake"
) {
  if (mode === "lead") return "Lead";

  const sourceType = normalizeText(meta?.sourceType);

  if (sourceType === "subagent" || sourceType === "agent") {
    return "Subagent Referral";
  }

  if (sourceType === "check_in" || sourceType === "walk_in") {
    return "Check-in / Walk-in";
  }

  if (sourceType === "intake_form") {
    return "Public Intake";
  }

  return "Intake Submission";
}

export default function ConvertIntakeSubmissionClient({
  submissionId,
  defaultValues,
  branches,
  leadSources,
  workflows,
  workflowStages,
  subagents,
  submissionMeta,
  duplicateCandidates = [],
  mode = "intake",
}: Props) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSubagentId, setSelectedSubagentId] = useState("");
  const [createNew, setCreateNew] = useState(false);

  const [useExistingClient, setUseExistingClient] = useState(false);
  const [selectedExistingClientId, setSelectedExistingClientId] = useState("");
  const [openApplicationAfterConvert, setOpenApplicationAfterConvert] =
    useState(false);

  const parsedSubmissionMeta = useMemo(
    () => parseSubmissionMeta(submissionMeta),
    [submissionMeta]
  );

  const metaSubagent = parsedSubmissionMeta?.subagent ?? null;
  const applicationInterest = parsedSubmissionMeta?.applicationInterest ?? null;
  const duplicateCheck = parsedSubmissionMeta?.duplicateCheck ?? null;

  const matchedSubagent = useMemo(() => {
    if (!metaSubagent || subagents.length === 0) return null;

    const ranked = subagents
      .map((subagent) => ({
        ...subagent,
        score: getMatchScore(subagent, metaSubagent),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return ranked[0] ?? null;
  }, [metaSubagent, subagents]);

  useEffect(() => {
    if (matchedSubagent && !selectedSubagentId && !createNew) {
      setSelectedSubagentId(matchedSubagent.id);
    }
  }, [matchedSubagent, selectedSubagentId, createNew]);

  useEffect(() => {
    if (duplicateCandidates.length === 0) {
      setUseExistingClient(false);
      setSelectedExistingClientId("");
      return;
    }

    const recommended =
      duplicateCandidates.find((candidate) => candidate.matchScore >= 200) ??
      duplicateCandidates[0];

    if (recommended && !selectedExistingClientId) {
      setSelectedExistingClientId(recommended.id);
    }
  }, [duplicateCandidates, selectedExistingClientId]);

  const filteredSubagents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subagents;

    return subagents.filter((subagent) =>
      subagent.name.toLowerCase().includes(query)
    );
  }, [search, subagents]);

  const filteredStages = useMemo(() => {
    if (!selectedWorkflowId) return [];

    return workflowStages
      .filter((stage) => stage.workflowId === selectedWorkflowId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [workflowStages, selectedWorkflowId]);

  const selectedExistingClient = useMemo(
    () =>
      duplicateCandidates.find(
        (candidate) => candidate.id === selectedExistingClientId
      ) ?? null,
    [duplicateCandidates, selectedExistingClientId]
  );

  const sourceLabel = getSourceLabel(parsedSubmissionMeta, mode);

  const showSubagentIntelligence =
    Boolean(metaSubagent?.name) ||
    Boolean(metaSubagent?.agencyName) ||
    Boolean(metaSubagent?.email) ||
    Boolean(metaSubagent?.phone) ||
    Boolean(metaSubagent?.reference);

  const hasDuplicateCandidates = duplicateCandidates.length > 0;

  const backHref = mode === "lead" ? "/leads" : "/intake-submissions";
  const backLabel = mode === "lead" ? "Back to Leads" : "Back to Queue";
  const cancelHref = mode === "lead" ? "/leads" : "/intake-submissions";

  return (
    <form
      action={`/api/intake-submissions/${submissionId}/convert`}
      method="post"
      onSubmit={() => setSubmitting(true)}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <input
        type="hidden"
        name="useExistingClient"
        value={useExistingClient ? "true" : "false"}
      />
      <input
        type="hidden"
        name="existingClientId"
        value={useExistingClient ? selectedExistingClientId : ""}
      />
      <input
        type="hidden"
        name="openApplicationAfterConvert"
        value={openApplicationAfterConvert ? "true" : "false"}
      />

      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
              {mode === "lead" ? "Lead Conversion" : "Conversion Workspace"}
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {mode === "lead"
                ? "Convert Lead to Client"
                : "Convert Intake Submission"}
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Review intake data, confirm source intelligence, assign workflow,
              and convert this submission into a structured client record.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                Source: {sourceLabel}
              </span>

              {hasDuplicateCandidates ? (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-100 ring-1 ring-amber-400/30">
                  Duplicate candidates found
                </span>
              ) : duplicateCheck?.existingClientFound ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30">
                  Existing client likely found
                </span>
              ) : null}

              {matchedSubagent ? (
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-100 ring-1 ring-violet-400/30">
                  Suggested subagent ready
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href={backHref}
            className="inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {backLabel}
          </Link>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {hasDuplicateCandidates ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Duplicate Client Candidates
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  The CRM found existing client records that match this intake by
                  email, phone, or passport. Review before converting.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                {duplicateCandidates.length} candidate
                {duplicateCandidates.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Conversion decision
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose whether to create a new client or attach this intake to
                    an existing one.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUseExistingClient(false)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      !useExistingClient
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Create New Client
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedExistingClientId) {
                        setUseExistingClient(true);
                      }
                    }}
                    disabled={!selectedExistingClientId}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      useExistingClient
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                  >
                    Use Existing Client
                  </button>
                </div>
              </div>

              {useExistingClient && selectedExistingClient ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    Existing client selected
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    {formatPersonName(
                      selectedExistingClient.firstName,
                      selectedExistingClient.lastName
                    )}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    This submission will be linked to the selected existing client
                    instead of creating a new one.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              {duplicateCandidates.map((candidate) => {
                const isSelected = selectedExistingClientId === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-amber-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatPersonName(
                              candidate.firstName,
                              candidate.lastName
                            )}
                          </p>

                          {isSelected ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                              Selected
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {candidate.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"
                            >
                              {reason}
                            </span>
                          ))}

                          {candidate.nameMatch ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                              Name also matches
                            </span>
                          ) : null}

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                            Score: {candidate.matchScore}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExistingClientId(candidate.id);
                            setUseExistingClient(true);
                          }}
                          className="inline-flex rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                          Select This Client
                        </button>

                        <Link
                          href={`/clients/${candidate.id}`}
                          target="_blank"
                          className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Open Client
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MiniInfo label="Email" value={candidate.email} />
                      <MiniInfo label="Phone" value={candidate.phone} />
                      <MiniInfo label="Passport" value={candidate.passport} />
                      <MiniInfo
                        label="Last Updated"
                        value={formatDateTime(candidate.updatedAt)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {(showSubagentIntelligence ||
          applicationInterest ||
          duplicateCheck?.existingClientFound) && (
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Source Intelligence
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Captured from the intake process and used to guide
                    conversion.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {sourceLabel}
                </span>
              </div>

              {showSubagentIntelligence ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Subagent Name" value={metaSubagent?.name} />
                  <InfoCard label="Agency" value={metaSubagent?.agencyName} />
                  <InfoCard label="Email" value={metaSubagent?.email} />
                  <InfoCard label="Phone" value={metaSubagent?.phone} />
                  <InfoCard label="Reference" value={metaSubagent?.reference} />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                  No subagent metadata was captured for this submission.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Match & Conversion Signals
              </p>

              <div className="mt-4 space-y-3">
                <StatusRow
                  label="Duplicate Check"
                  value={
                    hasDuplicateCandidates
                      ? `${duplicateCandidates.length} candidate(s) found`
                      : duplicateCheck?.existingClientFound
                      ? "Possible existing client found"
                      : "No existing client signal"
                  }
                  tone={
                    hasDuplicateCandidates
                      ? "warning"
                      : duplicateCheck?.existingClientFound
                      ? "success"
                      : "default"
                  }
                />

                <StatusRow
                  label="Subagent Match"
                  value={
                    matchedSubagent
                      ? `Suggested: ${matchedSubagent.name}`
                      : "No strong subagent match detected"
                  }
                  tone={matchedSubagent ? "success" : "warning"}
                />

                <StatusRow
                  label="Application Intent"
                  value={
                    applicationInterest?.providerName ||
                    applicationInterest?.courseName
                      ? "Application preference data available"
                      : "No application preference data"
                  }
                  tone={
                    applicationInterest?.providerName ||
                    applicationInterest?.courseName
                      ? "success"
                      : "default"
                  }
                />
              </div>
            </div>
          </section>
        )}

        {applicationInterest ? (
          <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Application Intent
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Useful context for downstream client and application handling.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                Captured from intake
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoCard
                label="Destination Country"
                value={applicationInterest.destinationCountry}
                accent="indigo"
              />
              <InfoCard
                label="Provider"
                value={applicationInterest.providerName}
                accent="indigo"
              />
              <InfoCard
                label="Course"
                value={applicationInterest.courseName}
                accent="indigo"
              />
              <InfoCard
                label="Subject Area"
                value={applicationInterest.subjectArea}
                accent="indigo"
              />
              <InfoCard
                label="Intake"
                value={applicationInterest.intake}
                accent="indigo"
              />
              <InfoCard
                label="Study Level"
                value={applicationInterest.studyLevel}
                accent="indigo"
              />
              <InfoCard
                label="Preferred Campus"
                value={applicationInterest.preferredCampus}
                accent="indigo"
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Identity & Conversion Details
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Confirm core identity, branch, source, workflow, and stage.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="First Name"
              name="firstName"
              defaultValue={defaultValues.firstName}
            />
            <Input
              label="Last Name"
              name="lastName"
              defaultValue={defaultValues.lastName}
            />
            <Input
              label="Email"
              name="email"
              defaultValue={defaultValues.email}
            />
            <Input
              label="Phone"
              name="phone"
              defaultValue={defaultValues.phone}
            />
            <Input
              label="Passport"
              name="passportNumber"
              defaultValue={defaultValues.passport}
            />

            <Select
              label="Branch"
              name="branchId"
              defaultValue={defaultValues.branchId}
              options={branches.map((branch) => ({
                value: branch.id,
                label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}`,
              }))}
            />

            <Select
              label="Lead Source"
              name="leadSourceId"
              options={leadSources.map((source) => ({
                value: source.id,
                label: source.name,
              }))}
            />

            <Select
              label="Workflow"
              name="workflowId"
              value={selectedWorkflowId}
              onChange={(value: string) => {
                setSelectedWorkflowId(value);
                setSelectedStageId("");
              }}
              options={workflows.map((workflow) => ({
                value: workflow.id,
                label: workflow.name,
              }))}
            />

            <Select
              label="Stage"
              name="workflowStageId"
              value={selectedStageId}
              disabled={!selectedWorkflowId}
              onChange={(value: string) => setSelectedStageId(value)}
              options={filteredStages.map((stage) => ({
                value: stage.id,
                label: stage.name,
              }))}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Subagent Resolution
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Confirm the recommended subagent, search manually, or create a
                new one.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {matchedSubagent ? (
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
                  Suggested: {matchedSubagent.name}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  No auto-match
                </span>
              )}

              <button
                type="button"
                onClick={() => setCreateNew((prev) => !prev)}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                {createNew ? "Search Existing" : "Create New"}
              </button>
            </div>
          </div>

          {!createNew ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search existing subagent
                </label>
                <input
                  placeholder="Search by subagent name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />

                <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
                  Select subagent
                </label>
                <select
                  name="subagentId"
                  value={selectedSubagentId}
                  onChange={(e) => setSelectedSubagentId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="">Select subagent</option>
                  {filteredSubagents.map((subagent) => (
                    <option key={subagent.id} value={subagent.id}>
                      {subagent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Matching Guidance
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <GuidanceRow
                    label="Detected name"
                    value={metaSubagent?.name || "—"}
                  />
                  <GuidanceRow
                    label="Detected agency"
                    value={metaSubagent?.agencyName || "—"}
                  />
                  <GuidanceRow
                    label="Detected email"
                    value={metaSubagent?.email || "—"}
                  />
                  <GuidanceRow
                    label="Detected phone"
                    value={metaSubagent?.phone || "—"}
                  />
                  <GuidanceRow
                    label="Suggested match"
                    value={matchedSubagent?.name || "No strong suggestion"}
                    highlight={Boolean(matchedSubagent)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Create new subagent
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Use this only when no suitable existing subagent is found.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="Subagent Name"
                  name="newSubagentName"
                  defaultValue={metaSubagent?.name || ""}
                  placeholder="Enter subagent name"
                />
                <Input
                  label="Email"
                  name="newSubagentEmail"
                  defaultValue={metaSubagent?.email || ""}
                  placeholder="Enter email"
                />
                <Input
                  label="Phone"
                  name="newSubagentPhone"
                  defaultValue={metaSubagent?.phone || ""}
                  placeholder="Enter phone"
                />
                <Input
                  label="Company / Agency"
                  name="newSubagentAgency"
                  defaultValue={metaSubagent?.agencyName || ""}
                  placeholder="Enter company or agency"
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Application Handoff
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Optionally open application setup immediately after conversion.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={openApplicationAfterConvert}
                onChange={(e) => setOpenApplicationAfterConvert(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Open application setup after conversion
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Use this when the lead is ready to move directly into provider,
                  course, and application processing.
                </p>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Internal Notes
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Save staff notes and any conversion-related context.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              name="notes"
              defaultValue={defaultValues.notes}
              rows={5}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              placeholder="Add internal notes for this conversion..."
            />
          </div>
        </section>

        <div className="sticky bottom-0 z-10 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {useExistingClient && selectedExistingClient
                ? `This will link the intake to existing client: ${formatPersonName(
                    selectedExistingClient.firstName,
                    selectedExistingClient.lastName
                  )}.`
                : openApplicationAfterConvert
                ? "This will convert the record and continue directly into application setup."
                : "Converting will create a new client record and preserve the intake history."}
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={cancelHref}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  submitting || (useExistingClient && !selectedExistingClientId)
                }
                className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Converting..."
                  : useExistingClient
                  ? "Link to Existing Client"
                  : openApplicationAfterConvert
                  ? "Convert & Continue"
                  : "Convert to Client"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Input({ label, name, defaultValue, placeholder }: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled,
}: SelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 disabled:bg-slate-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value?: string | null;
  accent?: "slate" | "indigo";
}) {
  const accentClass =
    accent === "indigo"
      ? "border-indigo-200 bg-white"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${accentClass}`}>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function GuidanceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-right font-medium ${
          highlight ? "text-violet-700" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}