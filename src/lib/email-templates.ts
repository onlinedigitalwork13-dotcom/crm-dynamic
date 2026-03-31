type WorkflowTemplateInput = {
  clientName?: string | null;
  workflowName?: string | null;
  stageName?: string | null;
  previousStageName?: string | null;
  applicationStatus?: string | null;
};

type EmailTemplateResult = {
  subject: string;
  html: string;
};

function wrapEmailLayout(content: {
  title: string;
  body: string;
  footer?: string;
}) {
  return `
    <div style="margin:0;padding:32px;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(15,23,42,0.08);">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;font-weight:700;">
            CRM Dynamic
          </div>
          <h1 style="margin:12px 0 0;font-size:24px;line-height:1.2;font-weight:700;">
            ${content.title}
          </h1>
        </div>

        <div style="padding:28px;">
          <div style="font-size:15px;line-height:1.75;color:#334155;">
            ${content.body}
          </div>

          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
            ${content.footer || "This is an automated communication from CRM Dynamic."}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderWorkflowAutomationTemplate(
  templateKey: string,
  data: WorkflowTemplateInput
): EmailTemplateResult {
  const clientName = data.clientName || "Student";
  const workflowName = data.workflowName || "your workflow";
  const stageName = data.stageName || "the current stage";
  const previousStageName = data.previousStageName || null;

  switch (templateKey) {
    case "workflow_stage_update":
      return {
        subject: `Your application stage is now ${stageName}`,
        html: wrapEmailLayout({
          title: "Workflow Stage Update",
          body: `
            <p style="margin:0 0 14px;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 14px;">
              Your process in <strong>${workflowName}</strong> has been updated.
            </p>
            <p style="margin:0 0 14px;">
              Your current stage is now <strong>${stageName}</strong>.
            </p>
            ${
              previousStageName
                ? `<p style="margin:0 0 14px;">Previous stage: <strong>${previousStageName}</strong></p>`
                : ""
            }
            <p style="margin:0;">
              Our team will continue guiding you through the next steps.
            </p>
          `,
        }),
      };

    case "workflow_assigned":
      return {
        subject: `Your workflow has been assigned`,
        html: wrapEmailLayout({
          title: "Workflow Assigned",
          body: `
            <p style="margin:0 0 14px;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 14px;">
              Your profile has been assigned to the workflow <strong>${workflowName}</strong>.
            </p>
            <p style="margin:0;">
              Your current stage is <strong>${stageName}</strong>.
            </p>
          `,
        }),
      };

    case "visa_stage_alert":
      return {
        subject: `Important visa process update`,
        html: wrapEmailLayout({
          title: "Visa Process Update",
          body: `
            <p style="margin:0 0 14px;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 14px;">
              There has been an important update in your workflow.
            </p>
            <p style="margin:0 0 14px;">
              Your current stage is now <strong>${stageName}</strong>.
            </p>
            <p style="margin:0;">
              Please keep an eye on your upcoming requirements and communications from our team.
            </p>
          `,
        }),
      };

    default:
      return {
        subject: `Workflow update`,
        html: wrapEmailLayout({
          title: "Workflow Update",
          body: `
            <p style="margin:0 0 14px;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 14px;">
              Your workflow has been updated to <strong>${stageName}</strong>.
            </p>
            <p style="margin:0;">
              Workflow: <strong>${workflowName}</strong>
            </p>
          `,
        }),
      };
  }
}