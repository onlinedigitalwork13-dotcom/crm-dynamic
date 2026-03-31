import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function upsertAutomationRule(data: {
  name: string;
  description?: string;
  workflowId: string;
  fromStageId?: string | null;
  toStageId?: string | null;
  eventType: string;
  targetType: "client" | "assigned_user" | "branch_admin" | "staff";
  channel: "email" | "in_app" | "both";
  provider: "resend" | "suprsend" | "system";
  templateKey: string;
  delayMinutes?: number;
  isActive?: boolean;
}) {
  const existing = await prisma.workflowAutomationRule.findFirst({
    where: {
      workflowId: data.workflowId,
      eventType: data.eventType,
      targetType: data.targetType,
      channel: data.channel,
      provider: data.provider,
      templateKey: data.templateKey,
      fromStageId: data.fromStageId ?? null,
      toStageId: data.toStageId ?? null,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.workflowAutomationRule.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        workflowId: data.workflowId,
        fromStageId: data.fromStageId ?? null,
        toStageId: data.toStageId ?? null,
        eventType: data.eventType,
        targetType: data.targetType,
        channel: data.channel,
        provider: data.provider,
        templateKey: data.templateKey,
        delayMinutes: data.delayMinutes ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  return prisma.workflowAutomationRule.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      workflowId: data.workflowId,
      fromStageId: data.fromStageId ?? null,
      toStageId: data.toStageId ?? null,
      eventType: data.eventType,
      targetType: data.targetType,
      channel: data.channel,
      provider: data.provider,
      templateKey: data.templateKey,
      delayMinutes: data.delayMinutes ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

async function upsertTaskAutomationTemplate(data: {
  name: string;
  description?: string;
  workflowId?: string | null;
  triggerEventType: string;
  triggerStatus?: string | null;
  sourceTaskTitle?: string | null;
  titleTemplate: string;
  descriptionTemplate?: string | null;
  assignToType: "self" | "assigned_user" | "branch_admin";
  offsetDays?: number;
  isActive?: boolean;
}) {
  const existing = await prisma.taskAutomationTemplate.findFirst({
    where: {
      name: data.name,
      workflowId: data.workflowId ?? null,
      triggerEventType: data.triggerEventType,
      triggerStatus: data.triggerStatus ?? null,
      sourceTaskTitle: data.sourceTaskTitle ?? null,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.taskAutomationTemplate.update({
      where: { id: existing.id },
      data: {
        description: data.description ?? null,
        workflowId: data.workflowId ?? null,
        triggerEventType: data.triggerEventType,
        triggerStatus: data.triggerStatus ?? null,
        sourceTaskTitle: data.sourceTaskTitle ?? null,
        titleTemplate: data.titleTemplate,
        descriptionTemplate: data.descriptionTemplate ?? null,
        assignToType: data.assignToType,
        offsetDays: data.offsetDays ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  return prisma.taskAutomationTemplate.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      workflowId: data.workflowId ?? null,
      triggerEventType: data.triggerEventType,
      triggerStatus: data.triggerStatus ?? null,
      sourceTaskTitle: data.sourceTaskTitle ?? null,
      titleTemplate: data.titleTemplate,
      descriptionTemplate: data.descriptionTemplate ?? null,
      assignToType: data.assignToType,
      offsetDays: data.offsetDays ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Roles
  const roles = [
    { name: "super_admin", description: "Full system access" },
    { name: "admin", description: "Administrative access" },
    { name: "branch_manager", description: "Manages branch operations" },
    { name: "staff", description: "Regular staff user" },
    { name: "reception", description: "Front desk and check-in access" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  console.log("✅ Roles seeded");

  // 2. Default branch
  const headOffice = await prisma.branch.upsert({
    where: { code: "HQ" },
    update: {
      name: "Head Office",
      address: "Main Branch",
      city: "Sydney",
      country: "Australia",
      phone: "+61 000 000 000",
      email: "hq@crm.com",
      isActive: true,
    },
    create: {
      name: "Head Office",
      code: "HQ",
      address: "Main Branch",
      city: "Sydney",
      country: "Australia",
      phone: "+61 000 000 000",
      email: "hq@crm.com",
      isActive: true,
    },
  });

  console.log("✅ Head Office branch seeded");

  // 3. Default lead sources
  const leadSources = [
    {
      name: "Walk-in",
      description: "Client visited the office directly",
    },
    {
      name: "Facebook",
      description: "Lead came from Facebook marketing",
    },
    {
      name: "Instagram",
      description: "Lead came from Instagram marketing",
    },
    {
      name: "Website",
      description: "Lead came from website inquiry form",
    },
    {
      name: "Referral",
      description: "Lead came from referral network",
    },
    {
      name: "Subagent",
      description: "Lead came from subagent partner",
    },
    {
      name: "Intake Form",
      description: "Lead came from public intake form",
    },
  ];

  for (const source of leadSources) {
    await prisma.leadSource.upsert({
      where: { name: source.name },
      update: {
        description: source.description,
        isActive: true,
      },
      create: {
        ...source,
        isActive: true,
      },
    });
  }

  console.log("✅ Lead sources seeded");

  // 4. Default workflow + stages
  const defaultWorkflow = await prisma.workflow.upsert({
    where: { name: "Default Student Workflow" },
    update: {
      description: "Default workflow for student application lifecycle",
      isActive: true,
    },
    create: {
      name: "Default Student Workflow",
      description: "Default workflow for student application lifecycle",
      isActive: true,
    },
  });

  const stageDefinitions = [
    { stageName: "Lead", orderSequence: 1, isFinal: false },
    { stageName: "Counselling", orderSequence: 2, isFinal: false },
    { stageName: "Application", orderSequence: 3, isFinal: false },
    { stageName: "Offer", orderSequence: 4, isFinal: false },
    { stageName: "COE", orderSequence: 5, isFinal: false },
    { stageName: "Visa", orderSequence: 6, isFinal: false },
    { stageName: "Enrolled", orderSequence: 7, isFinal: true },
  ];

  const workflowStages: Record<string, { id: string }> = {};

  for (const stage of stageDefinitions) {
    const existingStage = await prisma.workflowStage.findFirst({
      where: {
        workflowId: defaultWorkflow.id,
        orderSequence: stage.orderSequence,
      },
      select: { id: true },
    });

    const savedStage = existingStage
      ? await prisma.workflowStage.update({
          where: { id: existingStage.id },
          data: {
            stageName: stage.stageName,
            isFinal: stage.isFinal,
          },
          select: { id: true },
        })
      : await prisma.workflowStage.create({
          data: {
            workflowId: defaultWorkflow.id,
            stageName: stage.stageName,
            orderSequence: stage.orderSequence,
            isFinal: stage.isFinal,
          },
          select: { id: true },
        });

    workflowStages[stage.stageName] = savedStage;
  }

  console.log("✅ Default workflow and stages seeded");

  // 5. Super admin user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "super_admin" },
  });

  if (!superAdminRole) {
    throw new Error("super_admin role not found");
  }

  const hashedPassword = await bcrypt.hash("Admin@12345", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@crm.com" },
    update: {
      firstName: "Super",
      lastName: "Admin",
      phone: "0000000000",
      passwordHash: hashedPassword,
      isActive: true,
      roleId: superAdminRole.id,
      branchId: headOffice.id,
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "admin@crm.com",
      phone: "0000000000",
      passwordHash: hashedPassword,
      isActive: true,
      roleId: superAdminRole.id,
      branchId: headOffice.id,
    },
  });

  console.log("✅ Super admin user seeded");

  const existingWelcomeNotification = await prisma.notification.findFirst({
    where: {
      userId: superAdmin.id,
      type: "system",
      title: "Welcome",
    },
    select: { id: true },
  });

  if (!existingWelcomeNotification) {
    await prisma.notification.create({
      data: {
        userId: superAdmin.id,
        title: "Welcome",
        message: "Your notification system is now active.",
        type: "system",
        link: "/dashboard",
      },
    });
  }

  console.log("✅ Welcome notification seeded");

  // 6. Standard checklist templates
  const checklistTemplates = [
    {
      name: "Passport",
      code: "passport",
      description: "Valid passport copy",
      category: "identity",
      isRequired: true,
      sortOrder: 1,
      allowMulti: false,
    },
    {
      name: "Academic Transcript",
      code: "academic_transcript",
      description: "Previous academic transcript or mark sheet",
      category: "academic",
      isRequired: true,
      sortOrder: 2,
      allowMulti: true,
    },
    {
      name: "Academic Certificate",
      code: "academic_certificate",
      description: "Graduation or completion certificate",
      category: "academic",
      isRequired: true,
      sortOrder: 3,
      allowMulti: true,
    },
    {
      name: "English Test",
      code: "english_test",
      description: "IELTS, PTE, TOEFL or equivalent English test result",
      category: "language",
      isRequired: true,
      sortOrder: 4,
      allowMulti: false,
    },
    {
      name: "Statement of Purpose",
      code: "sop",
      description: "Statement of Purpose / Genuine student statement",
      category: "application",
      isRequired: true,
      sortOrder: 5,
      allowMulti: false,
    },
    {
      name: "Curriculum Vitae",
      code: "cv",
      description: "CV / Resume",
      category: "application",
      isRequired: false,
      sortOrder: 6,
      allowMulti: false,
    },
    {
      name: "Work Experience Letter",
      code: "work_experience_letter",
      description: "Employment or work experience supporting documents",
      category: "employment",
      isRequired: false,
      sortOrder: 7,
      allowMulti: true,
    },
    {
      name: "Financial Document",
      code: "financial_document",
      description: "Bank statement or financial support document",
      category: "financial",
      isRequired: false,
      sortOrder: 8,
      allowMulti: true,
    },
    {
      name: "Offer Letter",
      code: "offer_letter",
      description: "Offer letter issued by provider",
      category: "outcome",
      isRequired: false,
      sortOrder: 9,
      allowMulti: false,
    },
    {
      name: "COE",
      code: "coe",
      description: "Confirmation of Enrolment",
      category: "outcome",
      isRequired: false,
      sortOrder: 10,
      allowMulti: false,
    },
    {
      name: "Visa Application",
      code: "visa_application",
      description: "Visa application form or lodgement evidence",
      category: "visa",
      isRequired: false,
      sortOrder: 11,
      allowMulti: false,
    },
    {
      name: "Visa Grant",
      code: "visa_grant",
      description: "Visa grant letter",
      category: "visa",
      isRequired: false,
      sortOrder: 12,
      allowMulti: false,
    },
  ];

  for (const template of checklistTemplates) {
    await prisma.documentRequirementTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        isRequired: template.isRequired,
        sortOrder: template.sortOrder,
        isActive: true,
        allowMulti: template.allowMulti,
      },
      create: {
        ...template,
        isActive: true,
      },
    });
  }

  console.log("✅ Standard checklist templates seeded");

  // 7. Sample branch staff
  const staffRole = await prisma.role.findUnique({
    where: { name: "staff" },
  });

  const branchManagerRole = await prisma.role.findUnique({
    where: { name: "branch_manager" },
  });

  if (!staffRole || !branchManagerRole) {
    throw new Error("Required roles for staff seeding not found");
  }

  const hashedStaffPassword = await bcrypt.hash("Staff@12345", 10);

  await prisma.user.upsert({
    where: { email: "manager.hq@crm.com" },
    update: {
      firstName: "HQ",
      lastName: "Manager",
      phone: "0400000001",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: branchManagerRole.id,
      branchId: headOffice.id,
    },
    create: {
      firstName: "HQ",
      lastName: "Manager",
      email: "manager.hq@crm.com",
      phone: "0400000001",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: branchManagerRole.id,
      branchId: headOffice.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff1.hq@crm.com" },
    update: {
      firstName: "Staff",
      lastName: "One",
      phone: "0400000002",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: staffRole.id,
      branchId: headOffice.id,
    },
    create: {
      firstName: "Staff",
      lastName: "One",
      email: "staff1.hq@crm.com",
      phone: "0400000002",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: staffRole.id,
      branchId: headOffice.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff2.hq@crm.com" },
    update: {
      firstName: "Staff",
      lastName: "Two",
      phone: "0400000003",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: staffRole.id,
      branchId: headOffice.id,
    },
    create: {
      firstName: "Staff",
      lastName: "Two",
      email: "staff2.hq@crm.com",
      phone: "0400000003",
      passwordHash: hashedStaffPassword,
      isActive: true,
      roleId: staffRole.id,
      branchId: headOffice.id,
    },
  });

  console.log("✅ Branch test staff seeded");

  // 8. Sample intake form request
  const sampleToken = "sample-intake-form-hq";
  const publicUrl = `/forms/${sampleToken}`;

  await prisma.intakeFormRequest.upsert({
    where: { token: sampleToken },
    update: {
      branchId: headOffice.id,
      createdById: superAdmin.id,
      title: "Standard Student Intake Form",
      description: "Public intake form for new student enquiries",
      status: "active",
      isActive: true,
      publicUrl,
      qrCodeValue: publicUrl,
      sharedAt: new Date(),
      submitButtonText: "Submit Application",
      successMessage: "Thank you! We will contact you soon.",
      notes: "Default test intake form request",

      formSchema: [
        {
          key: "personal_details",
          title: "Personal Details",
          description: "Basic student information",
          fields: [
            {
              key: "firstName",
              label: "First Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter first name",
            },
            {
              key: "lastName",
              label: "Last Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter last name",
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              width: "half",
              placeholder: "Enter email",
            },
            {
              key: "phone",
              label: "Phone Number",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter phone number",
            },
            {
              key: "country",
              label: "Current Country",
              type: "text",
              width: "half",
            },
            {
              key: "nationality",
              label: "Nationality",
              type: "text",
              width: "half",
            },
            {
              key: "passportNumber",
              label: "Passport Number",
              type: "text",
              width: "half",
            },
            {
              key: "visaSubclass",
              label: "Visa Subclass",
              type: "text",
              width: "half",
            },
            {
              key: "visaExpiry",
              label: "Visa Expiry",
              type: "date",
              width: "half",
            },
            {
              key: "residentialAddress",
              label: "Residential Address",
              type: "textarea",
              width: "full",
            },
          ],
        },
        {
          key: "study_preferences",
          title: "Study Preferences",
          description: "Preferred study plan",
          fields: [
            {
              key: "preferredCountry",
              label: "Preferred Study Country",
              type: "select",
              width: "third",
              options: [
                { label: "Australia", value: "Australia" },
                { label: "Canada", value: "Canada" },
                { label: "UK", value: "UK" },
                { label: "USA", value: "USA" },
                { label: "New Zealand", value: "New Zealand" },
              ],
            },
            {
              key: "studyLevel",
              label: "Preferred Study Level",
              type: "select",
              width: "third",
              options: [
                { label: "Diploma", value: "Diploma" },
                { label: "Bachelor", value: "Bachelor" },
                { label: "Master", value: "Master" },
                { label: "PhD", value: "PhD" },
              ],
            },
            {
              key: "preferredIntake",
              label: "Preferred Intake",
              type: "select",
              width: "third",
              options: [
                { label: "February", value: "February" },
                { label: "July", value: "July" },
                { label: "November", value: "November" },
              ],
            },
            {
              key: "notes",
              label: "Additional Notes",
              type: "textarea",
              width: "full",
            },
          ],
        },
      ],

      settings: {
        showProgressBar: true,
        allowDraftSave: false,
        notifyOnSubmit: true,
      },
    },

    create: {
      token: sampleToken,
      branchId: headOffice.id,
      createdById: superAdmin.id,
      title: "Standard Student Intake Form",
      description: "Public intake form for new student enquiries",
      status: "active",
      isActive: true,
      publicUrl,
      qrCodeValue: publicUrl,
      sharedAt: new Date(),
      submitButtonText: "Submit Application",
      successMessage: "Thank you! We will contact you soon.",
      notes: "Default test intake form request",

      formSchema: [
        {
          key: "personal_details",
          title: "Personal Details",
          description: "Basic student information",
          fields: [
            {
              key: "firstName",
              label: "First Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter first name",
            },
            {
              key: "lastName",
              label: "Last Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter last name",
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              width: "half",
              placeholder: "Enter email",
            },
            {
              key: "phone",
              label: "Phone Number",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter phone number",
            },
            {
              key: "country",
              label: "Current Country",
              type: "text",
              width: "half",
            },
            {
              key: "nationality",
              label: "Nationality",
              type: "text",
              width: "half",
            },
            {
              key: "passportNumber",
              label: "Passport Number",
              type: "text",
              width: "half",
            },
            {
              key: "visaSubclass",
              label: "Visa Subclass",
              type: "text",
              width: "half",
            },
            {
              key: "visaExpiry",
              label: "Visa Expiry",
              type: "date",
              width: "half",
            },
            {
              key: "residentialAddress",
              label: "Residential Address",
              type: "textarea",
              width: "full",
            },
          ],
        },
        {
          key: "study_preferences",
          title: "Study Preferences",
          description: "Preferred study plan",
          fields: [
            {
              key: "preferredCountry",
              label: "Preferred Study Country",
              type: "select",
              width: "third",
              options: [
                { label: "Australia", value: "Australia" },
                { label: "Canada", value: "Canada" },
                { label: "UK", value: "UK" },
                { label: "USA", value: "USA" },
                { label: "New Zealand", value: "New Zealand" },
              ],
            },
            {
              key: "studyLevel",
              label: "Preferred Study Level",
              type: "select",
              width: "third",
              options: [
                { label: "Diploma", value: "Diploma" },
                { label: "Bachelor", value: "Bachelor" },
                { label: "Master", value: "Master" },
                { label: "PhD", value: "PhD" },
              ],
            },
            {
              key: "preferredIntake",
              label: "Preferred Intake",
              type: "select",
              width: "third",
              options: [
                { label: "February", value: "February" },
                { label: "July", value: "July" },
                { label: "November", value: "November" },
              ],
            },
            {
              key: "notes",
              label: "Additional Notes",
              type: "textarea",
              width: "full",
            },
          ],
        },
      ],

      settings: {
        showProgressBar: true,
        allowDraftSave: false,
        notifyOnSubmit: true,
      },
    },
  });

  console.log(`✅ Sample intake form seeded: ${publicUrl}`);
  console.log("✅ Sample intake form request seeded");

  // 9. First automation rules
  await upsertAutomationRule({
    name: "Task Created - Notify Assigned User",
    description: "Send in-app notification when a task is created",
    workflowId: defaultWorkflow.id,
    eventType: "TASK_CREATED",
    targetType: "assigned_user",
    channel: "in_app",
    provider: "suprsend",
    templateKey: "task_created_assigned_user",
    isActive: true,
  });

  await upsertAutomationRule({
    name: "Task Created - Email Client",
    description: "Send email to client when task is created",
    workflowId: defaultWorkflow.id,
    eventType: "TASK_CREATED",
    targetType: "client",
    channel: "email",
    provider: "resend",
    templateKey: "task_created_client",
    isActive: true,
  });

  await upsertAutomationRule({
    name: "Offer Stage - Auto Create Follow Up Task",
    description: "Create a follow-up task when client moves to Offer stage",
    workflowId: defaultWorkflow.id,
    fromStageId: workflowStages["Application"]?.id ?? null,
    toStageId: workflowStages["Offer"]?.id ?? null,
    eventType: "STAGE_CHANGED",
    targetType: "assigned_user",
    channel: "in_app",
    provider: "system",
    templateKey: "Follow up on offer",
    isActive: true,
  });

  await upsertAutomationRule({
    name: "Visa Stage - Email Client",
    description: "Send email to client when moved to Visa stage",
    workflowId: defaultWorkflow.id,
    fromStageId: workflowStages["COE"]?.id ?? null,
    toStageId: workflowStages["Visa"]?.id ?? null,
    eventType: "STAGE_CHANGED",
    targetType: "client",
    channel: "email",
    provider: "resend",
    templateKey: "stage_changed_visa_client",
    isActive: true,
  });

  console.log("✅ Workflow automation rules seeded");

  // 10. Task automation templates
  await upsertTaskAutomationTemplate({
    name: "After passport collection → upload passport",
    description: "Create upload task after passport is collected",
    workflowId: defaultWorkflow.id,
    triggerEventType: "TASK_STATUS_CHANGED",
    triggerStatus: "completed",
    sourceTaskTitle: "passport",
    titleTemplate: "Upload passport to application",
    descriptionTemplate: "Upload collected passport to CRM system",
    assignToType: "assigned_user",
    offsetDays: 1,
    isActive: true,
  });

  console.log("✅ Task automation templates seeded");

  console.log("\n🎉 Seed completed successfully.");
  console.log("Super admin login: admin@crm.com / Admin@12345");
  console.log("Test manager login: manager.hq@crm.com / Staff@12345");
  console.log("Test staff login: staff1.hq@crm.com / Staff@12345");
  console.log("Test staff login: staff2.hq@crm.com / Staff@12345");
  console.log("Sample intake public path: /forms/sample-intake-form-hq");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });