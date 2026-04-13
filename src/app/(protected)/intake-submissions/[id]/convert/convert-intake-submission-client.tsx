"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
};

type SelectOption = {
  value: string;
  label: string;
};

type InputProps = {
  label: string;
  name: string;
  defaultValue?: string;
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

export default function ConvertIntakeSubmissionClient({
  submissionId,
  defaultValues,
  branches,
  leadSources,
  workflows,
  workflowStages,
  subagents,
}: Props) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSubagentId, setSelectedSubagentId] = useState("");
  const [createNew, setCreateNew] = useState(false);

  const filteredSubagents = useMemo(() => {
    if (!search.trim()) return subagents;

    const query = search.trim().toLowerCase();
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

  return (
    <form
      action={`/api/intake-submissions/${submissionId}/convert`}
      method="post"
      onSubmit={() => setSubmitting(true)}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        Conversion Settings
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Review details, assign workflow, and intelligently link or create a
        subagent before conversion.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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

        <div className="md:col-span-2 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Subagent Assignment
            </p>

            <button
              type="button"
              onClick={() => setCreateNew((prev) => !prev)}
              className="text-xs text-blue-600 underline"
            >
              {createNew ? "Search Existing" : "Create New"}
            </button>
          </div>

          {!createNew ? (
            <>
              <input
                placeholder="Search subagent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              />

              <select
                name="subagentId"
                value={selectedSubagentId}
                onChange={(e) => setSelectedSubagentId(e.target.value)}
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select subagent</option>
                {filteredSubagents.map((subagent) => (
                  <option key={subagent.id} value={subagent.id}>
                    {subagent.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input label="Subagent Name" name="newSubagentName" />
              <Input label="Email" name="newSubagentEmail" />
              <Input label="Phone" name="newSubagentPhone" />
              <Input label="Company / Agency" name="newSubagentAgency" />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            defaultValue={defaultValues.notes}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/intake-submissions"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Converting..." : "Convert to Client"}
        </button>
      </div>
    </form>
  );
}

function Input({ label, name, defaultValue }: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border px-3 py-2 text-sm"
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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100"
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