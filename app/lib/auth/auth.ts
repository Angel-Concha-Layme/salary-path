import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins/admin';
import { jwt } from 'better-auth/plugins/jwt';
import { db } from '../db/client';
import * as schema from '../db/schema';

function resolveTrustedOrigins(): string[] {
  const values = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length > 0) {
    return values;
  }

  if (process.env.BETTER_AUTH_URL) {
    return [process.env.BETTER_AUTH_URL];
  }

  return ['http://localhost:3001'];
}

const defaultBaseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001';

export const auth = betterAuth({
  appName: 'Salary Path',
  baseURL: defaultBaseUrl,
  basePath: '/api/auth',
  secret:
    process.env.BETTER_AUTH_SECRET ?? 'dev-only-better-auth-secret-change-me-before-production-0001',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },
  trustedOrigins: resolveTrustedOrigins(),
  plugins: [
    admin(),
    nextCookies(),
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_JWT_ISSUER ?? defaultBaseUrl,
        audience: process.env.BETTER_AUTH_JWT_AUDIENCE ?? defaultBaseUrl,
        expirationTime: process.env.BETTER_AUTH_JWT_EXPIRATION ?? '15m',
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
