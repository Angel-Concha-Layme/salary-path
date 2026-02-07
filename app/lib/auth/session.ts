import { and, eq, isNull, sql } from 'drizzle-orm';
import { auth } from './auth';
import { db } from '../db/client';
import {
  pathCompanies,
  pathCompanyEvents,
  user,
  userFinanceSettings,
  type UserRole,
} from '../db/schema';

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  name?: string;
  image?: string | null;
  exp?: number;
  iat?: number;
  aud?: string | string[];
  [key: string]: unknown;
}

interface ApiUserSession {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: UserRole;
  };
  token: {
    raw: string;
    payload: JwtPayload;
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  const emails = raw
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return new Set(emails);
}

function getBearerToken(requestHeaders: Headers): string | null {
  const authorization = requestHeaders.get('authorization');
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim();
}

async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  try {
    const result = await auth.api.verifyJWT({
      body: {
        token,
      },
    });

    return (result?.payload as JwtPayload | null | undefined) ?? null;
  } catch {
    return null;
  }
}

async function syncAdminRoleFromEmail(currentUser: ApiUserSession['user']): Promise<ApiUserSession['user']> {
  const email = normalizeEmail(currentUser.email ?? '');
  if (!email) {
    return currentUser;
  }

  const adminEmails = getAdminEmails();
  const shouldBeAdmin = adminEmails.has(email);
  const nextRole: UserRole = shouldBeAdmin ? 'admin' : 'user';

  if (currentUser.role === nextRole) {
    return currentUser;
  }

  await db
    .update(user)
    .set({ role: nextRole, updatedAt: new Date() })
    .where(eq(user.id, currentUser.id));

  return {
    ...currentUser,
    role: nextRole,
  };
}

// Stateless JWT session - NO database query, just verify signature and extract payload
async function buildApiSessionFromToken(
  token: string,
  options?: { syncAdminRole?: boolean }
): Promise<ApiUserSession | null> {
  const payload = await verifyJwtToken(token);
  if (!payload?.sub || typeof payload.sub !== 'string') {
    return null;
  }

  // Extract user data directly from JWT payload - no DB query needed
  const baseUser: ApiUserSession['user'] = {
    id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    name: typeof payload.name === 'string' ? payload.name : '',
    image: typeof payload.image === 'string' ? payload.image : null,
    role: (payload.role as UserRole) ?? 'user',
  };

  // Only sync admin role for admin routes (this is the only case that needs DB)
  const syncedUser = options?.syncAdminRole ? await syncAdminRoleFromEmail(baseUser) : baseUser;

  return {
    user: syncedUser,
    token: {
      raw: token,
      payload,
    },
  };
}

export async function getApiSession(requestHeaders: Headers): Promise<ApiUserSession | null> {
  const token = getBearerToken(requestHeaders);
  if (!token) {
    return null;
  }

  return buildApiSessionFromToken(token);
}

export async function getApiSessionWithAdminSync(requestHeaders: Headers): Promise<ApiUserSession | null> {
  const token = getBearerToken(requestHeaders);
  if (!token) {
    return null;
  }

  return buildApiSessionFromToken(token, { syncAdminRole: true });
}

export async function requireApiSession(requestHeaders: Headers): Promise<ApiUserSession> {
  const session = await getApiSession(requestHeaders);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function requireApiAdminSession(requestHeaders: Headers): Promise<ApiUserSession> {
  const session = await getApiSessionWithAdminSync(requestHeaders);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function isOnboardingComplete(ownerUserId: string): Promise<boolean> {
  const [settingsResult, companyStatsResult] = await Promise.all([
    db
      .select({ id: userFinanceSettings.id })
      .from(userFinanceSettings)
      .where(and(eq(userFinanceSettings.ownerUserId, ownerUserId), isNull(userFinanceSettings.deletedAt)))
      .limit(1),
    db
      .select({
        companies: sql<number>`count(distinct ${pathCompanies.id})`,
        events: sql<number>`count(distinct ${pathCompanyEvents.id})`,
      })
      .from(pathCompanies)
      .leftJoin(pathCompanyEvents, and(eq(pathCompanyEvents.companyId, pathCompanies.id), isNull(pathCompanyEvents.deletedAt)))
      .where(and(eq(pathCompanies.ownerUserId, ownerUserId), isNull(pathCompanies.deletedAt))),
  ]);

  const [settingsRow] = settingsResult;
  const [companyStats] = companyStatsResult;

  if (!settingsRow) {
    return false;
  }

  return Boolean(companyStats && companyStats.companies > 0 && companyStats.events > 0);
}
