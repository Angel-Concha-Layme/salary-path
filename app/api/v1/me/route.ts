import { isOnboardingComplete, requireApiSession } from '@/app/lib/auth/session';
import { jsonError, jsonOk } from '@/app/lib/server/http';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const onboardingComplete = await isOnboardingComplete(session.user.id);

    return jsonOk({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role ?? 'user',
      },
      auth: {
        tokenExpiresAt: typeof session.token.payload.exp === 'number' ? session.token.payload.exp * 1000 : null,
        tokenIssuedAt: typeof session.token.payload.iat === 'number' ? session.token.payload.iat * 1000 : null,
      },
      onboardingComplete,
    });
  } catch (error) {
    return jsonError(error);
  }
}
