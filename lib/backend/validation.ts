import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    passwordConfirmation: z.string().min(8),
    role: z.enum(["hotel", "restaurant", "supplier", "service_provider", "viewer"]),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    error: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
