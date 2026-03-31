import { ApplicationChecklistStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type GenerateChecklistOptions = {
  replaceExisting?: boolean;
};

type UpdateChecklistItemInput = {
  title?: string;
  description?: string | null;
  category?: string | null;
  isRequired?: boolean;
  status?: ApplicationChecklistStatus;
  remarks?: string | null;
  dueDate?: Date | string | null;
  sortOrder?: number;
  verifiedById?: string | null;
};

type CreateChecklistDocumentInput = {
  checklistItemId: string;
  uploadedById?: string | null;
  title: string;
  fileName: string;
  filePath: string;
  fileType?: string | null;
  fileSize?: number | null;
};

function toDateOrNull(value?: Date | string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value provided.");
  }

  return date;
}

function normalizeNullableString(
  value?: string | null
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function generateChecklistForApplication(
  applicationId: string,
  options: GenerateChecklistOptions = {}
) {
  const { replaceExisting = false } = options;

  const application = await prisma.clientApplication.findUnique({
    where: { id: applicationId },
    include: {
      checklistItems: {
        include: {
          documents: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  const templates = await prisma.documentRequirementTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (!templates.length) {
    throw new Error("No active document requirement templates found.");
  }

  return await prisma.$transaction(async (tx) => {
    const existingItems = await tx.applicationChecklistItem.findMany({
      where: { applicationId },
      include: {
        documents: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (replaceExisting && existingItems.length > 0) {
      await tx.applicationChecklistDocument.deleteMany({
        where: {
          checklistItem: {
            applicationId,
          },
        },
      });

      await tx.applicationChecklistItem.deleteMany({
        where: { applicationId },
      });
    }

    const remainingItems = replaceExisting ? [] : existingItems;

    const existingTemplateIds = new Set(
      remainingItems
        .filter((item) => item.templateId)
        .map((item) => item.templateId as string)
    );

    const templatesToCreate = templates.filter(
      (template) => !existingTemplateIds.has(template.id)
    );

    if (templatesToCreate.length > 0) {
      await tx.applicationChecklistItem.createMany({
        data: templatesToCreate.map((template) => ({
          applicationId,
          templateId: template.id,
          title: template.name,
          description: template.description,
          category: template.category,
          isRequired: template.isRequired,
          status: ApplicationChecklistStatus.pending,
          remarks: null,
          dueDate: null,
          sortOrder: template.sortOrder,
          verifiedAt: null,
          verifiedById: null,
        })),
      });
    }

    const checklist = await tx.applicationChecklistItem.findMany({
      where: { applicationId },
      include: {
        template: true,
        verifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return checklist;
  });
}

export async function getChecklistByApplication(applicationId: string) {
  const application = await prisma.clientApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      clientId: true,
      providerId: true,
      courseId: true,
      intake: true,
      intakeYear: true,
      status: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  const items = await prisma.applicationChecklistItem.findMany({
    where: { applicationId },
    include: {
      template: true,
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const totalItems = items.length;
  const requiredItems = items.filter((item) => item.isRequired).length;

  const receivedItems = items.filter(
    (item) =>
      item.status === ApplicationChecklistStatus.received ||
      item.status === ApplicationChecklistStatus.verified
  ).length;

  const verifiedItems = items.filter(
    (item) => item.status === ApplicationChecklistStatus.verified
  ).length;

  const pendingItems = items.filter(
    (item) =>
      item.status === ApplicationChecklistStatus.pending ||
      item.status === ApplicationChecklistStatus.requested
  ).length;

  const rejectedItems = items.filter(
    (item) => item.status === ApplicationChecklistStatus.rejected
  ).length;

  const waivedItems = items.filter(
    (item) => item.status === ApplicationChecklistStatus.waived
  ).length;

  const completionPercentage =
    totalItems === 0 ? 0 : Math.round((verifiedItems / totalItems) * 100);

  const requiredCompletionPercentage =
    requiredItems === 0
      ? 0
      : Math.round(
          (items.filter(
            (item) =>
              item.isRequired &&
              (item.status === ApplicationChecklistStatus.received ||
                item.status === ApplicationChecklistStatus.verified)
          ).length /
            requiredItems) *
            100
        );

  return {
    application,
    items,
    summary: {
      totalItems,
      requiredItems,
      receivedItems,
      verifiedItems,
      pendingItems,
      rejectedItems,
      waivedItems,
      completionPercentage,
      requiredCompletionPercentage,
    },
  };
}

export async function getChecklistItemById(id: string) {
  const item = await prisma.applicationChecklistItem.findUnique({
    where: { id },
    include: {
      application: {
        select: {
          id: true,
          clientId: true,
          status: true,
        },
      },
      template: true,
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    throw new Error("Checklist item not found.");
  }

  return item;
}

export async function updateChecklistItem(
  id: string,
  data: UpdateChecklistItemInput
) {
  const existingItem = await prisma.applicationChecklistItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new Error("Checklist item not found.");
  }

  const nextStatus = data.status ?? existingItem.status;

  let verifiedAt: Date | null | undefined = undefined;
  let verifiedById: string | null | undefined = undefined;

  if (nextStatus === ApplicationChecklistStatus.verified) {
    verifiedAt = new Date();
    verifiedById = data.verifiedById ?? existingItem.verifiedById ?? null;
  } else if (
    data.status &&
    data.status !== ApplicationChecklistStatus.verified
  ) {
    verifiedAt = null;
    verifiedById = null;
  }

  const updatedItem = await prisma.applicationChecklistItem.update({
    where: { id },
    data: {
      title: data.title?.trim() || undefined,
      description: normalizeNullableString(data.description),
      category: normalizeNullableString(data.category),
      isRequired: data.isRequired,
      status: data.status,
      remarks: normalizeNullableString(data.remarks),
      dueDate: toDateOrNull(data.dueDate),
      sortOrder: data.sortOrder,
      verifiedAt,
      verifiedById,
    },
    include: {
      template: true,
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return updatedItem;
}

export async function verifyChecklistItem(
  id: string,
  verifiedById?: string | null
) {
  return updateChecklistItem(id, {
    status: ApplicationChecklistStatus.verified,
    verifiedById: verifiedById ?? null,
  });
}

export async function requestChecklistItem(id: string, remarks?: string | null) {
  return updateChecklistItem(id, {
    status: ApplicationChecklistStatus.requested,
    remarks: remarks ?? null,
  });
}

export async function markChecklistItemReceived(
  id: string,
  remarks?: string | null
) {
  return updateChecklistItem(id, {
    status: ApplicationChecklistStatus.received,
    remarks: remarks ?? null,
  });
}

export async function rejectChecklistItem(
  id: string,
  remarks?: string | null
) {
  return updateChecklistItem(id, {
    status: ApplicationChecklistStatus.rejected,
    remarks: remarks ?? null,
  });
}

export async function waiveChecklistItem(
  id: string,
  remarks?: string | null
) {
  return updateChecklistItem(id, {
    status: ApplicationChecklistStatus.waived,
    remarks: remarks ?? null,
  });
}

export async function addChecklistDocument(input: CreateChecklistDocumentInput) {
  const checklistItem = await prisma.applicationChecklistItem.findUnique({
    where: { id: input.checklistItemId },
    include: {
      template: true,
      documents: true,
    },
  });

  if (!checklistItem) {
    throw new Error("Checklist item not found.");
  }

  if (
    checklistItem.template &&
    checklistItem.template.allowMulti === false &&
    checklistItem.documents.length > 0
  ) {
    throw new Error(
      "This checklist item only allows one document. Delete the existing file first or enable multi-upload."
    );
  }

  const title = input.title.trim();
  const fileName = input.fileName.trim();
  const filePath = input.filePath.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  if (!fileName) {
    throw new Error("File name is required.");
  }

  if (!filePath) {
    throw new Error("File path is required.");
  }

  const createdDocument = await prisma.$transaction(async (tx) => {
    const document = await tx.applicationChecklistDocument.create({
      data: {
        checklistItemId: input.checklistItemId,
        uploadedById: input.uploadedById ?? null,
        title,
        fileName,
        filePath,
        fileType: normalizeNullableString(input.fileType),
        fileSize: input.fileSize ?? null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await tx.applicationChecklistItem.update({
      where: { id: input.checklistItemId },
      data: {
        status:
          checklistItem.status === ApplicationChecklistStatus.verified
            ? ApplicationChecklistStatus.verified
            : ApplicationChecklistStatus.received,
      },
    });

    return document;
  });

  return createdDocument;
}

export async function getChecklistDocumentById(documentId: string) {
  const document = await prisma.applicationChecklistDocument.findUnique({
    where: { id: documentId },
    include: {
      checklistItem: {
        select: {
          id: true,
          applicationId: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Checklist document not found.");
  }

  return document;
}

export async function deleteChecklistDocument(documentId: string) {
  const document = await prisma.applicationChecklistDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      checklistItemId: true,
      filePath: true,
    },
  });

  if (!document) {
    throw new Error("Checklist document not found.");
  }

  const checklistItemId = document.checklistItemId;

  await prisma.$transaction(async (tx) => {
    await tx.applicationChecklistDocument.delete({
      where: { id: documentId },
    });

    const remainingDocuments = await tx.applicationChecklistDocument.count({
      where: { checklistItemId },
    });

    if (remainingDocuments === 0) {
      await tx.applicationChecklistItem.update({
        where: { id: checklistItemId },
        data: {
          status: ApplicationChecklistStatus.pending,
          verifiedAt: null,
          verifiedById: null,
        },
      });
    }
  });

  return {
    success: true,
    message: "Checklist document deleted successfully.",
    filePath: document.filePath,
  };
}

export async function createManualChecklistItem(
  applicationId: string,
  data: {
    title: string;
    description?: string | null;
    category?: string | null;
    isRequired?: boolean;
    dueDate?: Date | string | null;
    sortOrder?: number;
  }
) {
  const application = await prisma.clientApplication.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  const title = data.title.trim();

  if (!title) {
    throw new Error("Checklist item title is required.");
  }

  const item = await prisma.applicationChecklistItem.create({
    data: {
      applicationId,
      templateId: null,
      title,
      description: normalizeNullableString(data.description),
      category: normalizeNullableString(data.category),
      isRequired: data.isRequired ?? true,
      status: ApplicationChecklistStatus.pending,
      remarks: null,
      dueDate: toDateOrNull(data.dueDate) ?? null,
      sortOrder: data.sortOrder ?? 999,
    },
    include: {
      template: true,
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      documents: true,
    },
  });

  return item;
}

export async function deleteChecklistItem(id: string) {
  const item = await prisma.applicationChecklistItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Checklist item not found.");
  }

  await prisma.applicationChecklistItem.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Checklist item deleted successfully.",
  };
}

export async function reorderChecklistItems(
  applicationId: string,
  items: Array<{ id: string; sortOrder: number }>
) {
  const application = await prisma.clientApplication.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.applicationChecklistItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return getChecklistByApplication(applicationId);
}

export async function getChecklistTemplateCatalog() {
  return prisma.documentRequirementTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}