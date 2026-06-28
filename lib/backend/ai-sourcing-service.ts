import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ValidationApiError } from "./errors";
import { rankSuppliers } from "./procurement-service";
import { fieldErrorsFromZod } from "./validation";

const sourcingSchema = z
  .object({
    productDescription: z.string().trim().min(10, "Please describe what you are sourcing."),
    productCategory: z.string().trim().min(1, "Please select a product category."),
    quantity: z.coerce.number().int().positive("Please enter a positive quantity."),
    targetCountry: z.string().trim().min(1, "Please enter the target country."),
    preferredSupplierLocation: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
    budget: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
    moqPreference: z.string().trim().min(1, "Please enter an MOQ preference."),
    deliveryDeadline: z.string().trim().min(1, "Please select a delivery deadline."),
    additionalRequirements: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((value, context) => {
    const deadline = new Date(value.deliveryDeadline);
    if (Number.isNaN(deadline.getTime())) {
      context.addIssue({ code: "custom", path: ["deliveryDeadline"], message: "Please select a valid delivery deadline." });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const candidate = new Date(deadline);
    candidate.setHours(0, 0, 0, 0);
    if (candidate < today) {
      context.addIssue({ code: "custom", path: ["deliveryDeadline"], message: "Delivery deadline cannot be in the past." });
    }
  });

export type AiSourcingRecommendation = {
  supplierId: string;
  supplierName: string;
  supplierType: string;
  trustScore: number;
  country: string;
  productCategory: string;
  estimatedResponseTime: string;
  moq: string;
  rfqAvailable: boolean;
  suggestedNextAction: string;
  supplierHref: string;
  rfqHref: string;
};

export async function createAiSourcingRequest(input: unknown) {
  const parsed = sourcingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const data = parsed.data;
  const recommendations = await generateAiSourcingRecommendations(data);
  const request = await prisma.aiSourcingRequest.create({
    data: {
      productDescription: data.productDescription,
      productCategory: data.productCategory,
      quantity: data.quantity,
      targetCountry: data.targetCountry,
      preferredSupplierLocation: data.preferredSupplierLocation,
      budget: data.budget,
      moqPreference: data.moqPreference,
      deliveryDeadline: new Date(data.deliveryDeadline),
      additionalRequirements: data.additionalRequirements,
      recommendations: recommendations as Prisma.InputJsonValue,
    },
  });

  return {
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    recommendations,
  };
}

async function generateAiSourcingRecommendations(input: z.infer<typeof sourcingSchema>): Promise<AiSourcingRecommendation[]> {
  const suppliers = await rankSuppliers({
    search: `${input.productDescription} ${input.productCategory}`,
    category: undefined,
    location: input.preferredSupplierLocation,
    sort: "trustScore",
  });
  const fallback = suppliers.length ? suppliers : await rankSuppliers({ sort: "trustScore" });
  const categoryLower = input.productCategory.toLowerCase();

  return fallback.slice(0, 4).map((supplier, index) => ({
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierType: supplier.category,
    trustScore: supplier.trustScore.score,
    country: supplier.location || input.preferredSupplierLocation || input.targetCountry,
    productCategory: input.productCategory,
    estimatedResponseTime: supplier.trustScore.score >= 80 ? "Under 1 business day" : index === 0 ? "1-2 business days" : "2-3 business days",
    moq: input.moqPreference || (input.quantity > 100 ? "Bulk MOQ recommended" : "Flexible MOQ check required"),
    rfqAvailable: true,
    suggestedNextAction: categoryLower.includes("service")
      ? "Request availability and service proof"
      : input.budget
        ? "Generate RFQ with budget guardrails"
        : "Generate RFQ and request landed-cost estimate",
    supplierHref: `/dashboard/main/suppliers/${supplier.id}`,
    rfqHref: `/dashboard/main/rfqs/new?category=${encodeURIComponent(input.productCategory)}`,
  }));
}
