import type { Prisma, Role, SellerApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const sellerRoles = ["hotel", "restaurant", "supplier", "service_provider"] as const;
const applicationStatuses = ["draft", "submitted", "under_review", "needs_more_information", "approved", "rejected"] as const;

const documentSchema = z.object({
  documentType: z.string().trim().min(1, "Please select a document type."),
  fileName: z.string().trim().min(1, "Please add a document file name."),
  contentType: z.string().trim().optional(),
  size: z.number().int().nonnegative().optional(),
  uploadedAt: z.string().trim().optional(),
});

const sellerApplicationSchema = z.object({
  businessName: z.string().trim().min(1, "Please enter the business name."),
  businessType: z.enum(sellerRoles, "Please select a valid business type."),
  country: z.string().trim().min(1, "Please enter the country."),
  contactPerson: z.string().trim().min(1, "Please enter a contact person."),
  businessEmail: z.email("Please enter a valid business email."),
  phoneNumber: z.string().trim().min(5, "Please enter a phone number."),
  companyDescription: z.string().trim().min(20, "Please describe the business in at least 20 characters."),
  categories: z.array(z.string().trim().min(1)).min(1, "Please select at least one category."),
  productsOrServices: z.string().trim().min(1, "Please describe the products or services offered."),
  website: z.union([z.url("Please enter a valid website URL."), z.literal("")]).optional(),
  verificationDocuments: z.array(documentSchema).min(1, "Please add at least one verification document."),
  status: z.enum(applicationStatuses).optional(),
});

const statusSchema = z.object({
  status: z.enum(applicationStatuses),
});

function parseSellerApplicationInput(input: unknown) {
  const parsed = sellerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

export async function createSellerApplication(input: unknown) {
  const parsed = parseSellerApplicationInput(input);
  const status = parsed.status ?? "submitted";
  const submittedAt = status === "draft" ? null : new Date();

  return prisma.sellerApplication.create({
    data: {
      status,
      businessName: parsed.businessName,
      businessType: parsed.businessType as Role,
      country: parsed.country,
      contactPerson: parsed.contactPerson,
      businessEmail: parsed.businessEmail.toLowerCase(),
      phoneNumber: parsed.phoneNumber,
      companyDescription: parsed.companyDescription,
      categories: parsed.categories as Prisma.InputJsonValue,
      productsOrServices: parsed.productsOrServices,
      website: parsed.website || null,
      verificationDocuments: parsed.verificationDocuments as Prisma.InputJsonValue,
      submittedAt,
    },
  });
}

export async function listSellerApplications(options: { status?: unknown; businessType?: unknown } = {}) {
  const status = typeof options.status === "string" && applicationStatuses.includes(options.status as SellerApplicationStatus)
    ? options.status as SellerApplicationStatus
    : undefined;
  const businessType = typeof options.businessType === "string" && sellerRoles.includes(options.businessType as (typeof sellerRoles)[number])
    ? options.businessType as Role
    : undefined;

  return prisma.sellerApplication.findMany({
    where: { status, businessType },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function updateSellerApplicationStatus(id: string, input: unknown) {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const existing = await prisma.sellerApplication.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("not_found", "Seller application not found.", 404);
  }

  return prisma.sellerApplication.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedAt: ["approved", "rejected", "needs_more_information"].includes(parsed.data.status) ? new Date() : undefined,
    },
  });
}
