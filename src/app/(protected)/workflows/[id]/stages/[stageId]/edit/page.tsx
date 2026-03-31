import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditWorkflowStageForm from "@/components/workflows/edit-workflow-stage-form";

type PageProps = {
  params: Promise<{
    id: string;
    stageId: string;
  }>;
};

export default async function EditWorkflowStagePage({ params }: PageProps) {
  const { id, stageId } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
    },
  });

  if (!workflow) {
    notFound();
  }

  const stage = await prisma.workflowStage.findUnique({
    where: { id: stageId },
    select: {
      id: true,
      workflowId: true,
      stageName: true,
      orderSequence: true,
      isFinal: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!stage || stage.workflowId !== workflow.id) {
    notFound();
  }

  const siblingStages = await prisma.workflowStage.findMany({
    where: {
      workflowId: workflow.id,
      id: { not: stage.id },
    },
    orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      stageName: true,
      orderSequence: true,
      isFinal: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Settings / Workflows / Details / Edit Stage
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Edit Stage</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update the stage details for <span className="font-medium">{workflow.name}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workflows/${workflow.id}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Workflow
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <EditWorkflowStageForm
            workflowId={workflow.id}
            stageId={stage.id}
            initialStageName={stage.stageName}
            initialOrderSequence={stage.orderSequence}
            initialIsFinal={stage.isFinal}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Current Stage Info</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Stage Name</p>
                <p className="mt-1 font-medium text-gray-900">{stage.stageName}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Current Order</p>
                <p className="mt-1 font-medium text-gray-900">{stage.orderSequence}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                <p className="mt-1 font-medium text-gray-900">
                  {stage.isFinal ? "Final Stage" : "Normal Stage"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Other Stages</h2>
            {siblingStages.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No other stages in this workflow.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {siblingStages.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">{item.stageName}</p>
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                        order {item.orderSequence}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {item.isFinal ? "Marked as final stage" : "Normal stage"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-blue-50 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-blue-900">Important</h2>
            <ul className="mt-3 space-y-2 text-sm text-blue-800">
              <li>Stage names should remain clear and unique within the workflow.</li>
              <li>Order values should reflect the actual pipeline progression.</li>
              <li>If this stage is marked as final, other final stages will be unset automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}