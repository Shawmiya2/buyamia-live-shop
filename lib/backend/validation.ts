import { z } from "zod";
import { ValidationApiError } from "./errors";
import type { ProfileType } from "./types";

export const signupFieldMessages = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  passwordRequired: "Please enter a password.",
  passwordLength: "Password must contain at least 8 characters.",
  passwordConfirmation: "Please confirm your password.",
  passwordMismatch: "Passwords do not match.",
  role: "Please select an account type.",
} as const;

export const signupSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    passwordConfirmation: z.string(),
    role: z.unknown(),
  })
  .superRefine((value, context) => {
    if (!value.name.trim()) {
      context.addIssue({ code: "custom", path: ["name"], message: signupFieldMessages.name });
    }
    if (!z.email().safeParse(value.email).success) {
      context.addIssue({ code: "custom", path: ["email"], message: signupFieldMessages.email });
    }
    if (!value.password) {
      context.addIssue({ code: "custom", path: ["password"], message: signupFieldMessages.passwordRequired });
    } else if (value.password.length < 8) {
      context.addIssue({ code: "custom", path: ["password"], message: signupFieldMessages.passwordLength });
    }
    if (value.passwordConfirmation.length < 8) {
      context.addIssue({ code: "custom", path: ["passwordConfirmation"], message: signupFieldMessages.passwordConfirmation });
    } else if (value.password !== value.passwordConfirmation) {
      context.addIssue({ code: "custom", path: ["passwordConfirmation"], message: signupFieldMessages.passwordMismatch });
    }
    if (!["hotel", "restaurant", "supplier", "service_provider", "viewer"].includes(String(value.role))) {
      context.addIssue({ code: "custom", path: ["role"], message: signupFieldMessages.role });
    }
  });

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export function parseLoginInput(input: unknown) {
  const result = loginSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationApiError({
      email: "Please enter a valid email address.",
      password: "Please enter your password.",
    });
  }

  return result.data;
}

export function fieldErrorsFromZod(error: z.ZodError) {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fields[key]) {
      fields[key] = issue.message;
    }
  }

  return fields;
}

export function parseSignupInput(input: unknown) {
  const result = signupSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationApiError(fieldErrorsFromZod(result.error));
  }

  return {
    ...result.data,
    role: result.data.role as Exclude<ProfileType, "main_admin">,
  };
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
