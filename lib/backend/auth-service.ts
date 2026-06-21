import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import {
  getDashboardForRole,
  isProviderRole,
  isValidProfileType,
} from "./role-guard";
import type { AccountCreationResponse, ProfileType, SafeUser } from "./types";

export const sessionCookieName = "buyamia_session";
const sessionDays = 7;

const publicSignupRoles: ProfileType[] = [
  "hotel",
  "restaurant",
  "supplier",
  "service_provider",
  "viewer",
];

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDays);
  return expiresAt;
}

export function safeUser(user: User & { providerProfile?: { id: string } | null }): SafeUser {
  const role = user.role as ProfileType;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    verificationStatus: user.verificationStatus,
    onboardingStatus: user.onboardingStatus,
    dashboardUrl: getDashboardForRole(role),
    providerId: user.providerProfile?.id,
  };
}

export function toAccountResponse(user: User & { providerProfile?: { id: string } | null }): AccountCreationResponse {
  const dto = safeUser(user);

  return {
    userId: dto.id,
    user: dto,
    name: dto.name,
    email: dto.email,
    profileType: dto.role,
    role: dto.role,
    dashboardUrl: dto.dashboardUrl,
    verificationStatus: dto.verificationStatus,
    onboardingStatus: dto.onboardingStatus,
  };
}

export async function signupUser(input: {
  name: string;
  email: string;
  password: string;
  role: ProfileType;
}) {
  if (!publicSignupRoles.includes(input.role)) {
    throw new ApiError(
      "invalid_signup_role",
      "This role cannot be registered publicly.",
      400,
    );
  }

  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationApiError({
      email: "An account already exists with this email address.",
    });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role as Role,
      verificationStatus: input.role === "viewer" ? "not_started" : "not_started",
      onboardingStatus: "in_progress",
      providerProfile: isProviderRole(input.role)
        ? {
            create: {
              displayName: input.name.trim(),
              category: input.role as Role,
              description: "",
              location: "",
            },
          }
        : undefined,
    },
    include: { providerProfile: { select: { id: true } } },
  });

  await prisma.analyticsEvent.create({
    data: {
      userId: user.id,
      providerId: user.providerProfile?.id,
      eventType: "account_created",
      metadata: { role: input.role },
    },
  });

  return user;
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = sessionExpiresAt();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { providerProfile: { select: { id: true } } },
  });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    throw new ApiError("invalid_credentials", "Invalid email or password.", 401);
  }

  return user;
}

export async function getUserBySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { providerProfile: { select: { id: true } } } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    }
    return null;
  }

  return session.user;
}

export async function logoutSession(token?: string | null) {
  if (!token) {
    return;
  }

  await prisma.session
    .delete({ where: { tokenHash: hashSessionToken(token) } })
    .catch(() => null);
}

export function assertKnownRole(value: unknown): ProfileType {
  if (!isValidProfileType(value)) {
    throw new ApiError("invalid_role", "Invalid role.", 400);
  }
  return value;
}
