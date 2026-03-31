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
      className="rounded-xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        Conversion Settings
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Adjust the client details and select branch, source, workflow, stage,
        and subagent before conversion.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            name="firstName"
            defaultValue={defaultValues.firstName}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            name="lastName"
            defaultValue={defaultValues.lastName}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            name="email"
            defaultValue={defaultValues.email}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            name="phone"
            defaultValue={defaultValues.phone}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Passport
          </label>
          <input
            name="passportNumber"
            defaultValue={defaultValues.passport}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Branch
          </label>
          <select
            name="branchId"
            defaultValue={defaultValues.branchId}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.code ? ` (${branch.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Lead Source
          </label>
          <select
            name="leadSourceId"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select source</option>
            {leadSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Workflow
          </label>
          <select
            name="workflowId"
            value={selectedWorkflowId}
            onChange={(e) => {
              setSelectedWorkflowId(e.target.value);
              setSelectedStageId("");
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select workflow</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Stage
          </label>
          <select
            name="workflowStageId"
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            disabled={!selectedWorkflowId}
            className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">Select stage</option>
            {filteredStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subagent
          </label>
          <select
            name="subagentId"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select subagent</option>
            {subagents.map((subagent) => (
              <option key={subagent.id} value={subagent.id}>
                {subagent.name}
              </option>
            ))}
          </select>
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

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Link
          href="/intake-submissions"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Converting..." : "Convert to Client"}
        </button>
      </div>
    </form>
  );
}