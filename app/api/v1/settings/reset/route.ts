import { eq } from 'drizzle-orm';
import { requireApiSession } from '@/app/lib/auth/session';
import { db } from '@/app/lib/db/client';
import {
  comparisonPersonas,
  pathCompanies,
  pathCompanyEvents,
  personaBonusRuleMonths,
  personaBonusRules,
  personaCareerEvents,
  userFinanceSettings,
} from '@/app/lib/db/schema';
import { jsonError, jsonOk } from '@/app/lib/server/http';

export async function DELETE(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const userId = session.user.id;

    // Hard-delete all user data in dependency order
    // 1. Company events (depend on companies)
    const userCompanies = await db
      .select({ id: pathCompanies.id })
      .from(pathCompanies)
      .where(eq(pathCompanies.ownerUserId, userId));
    const companyIds = userCompanies.map((c) => c.id);

    if (companyIds.length > 0) {
      for (const companyId of companyIds) {
        await db.delete(pathCompanyEvents).where(eq(pathCompanyEvents.companyId, companyId));
      }
    }

    // 2. Companies
    await db.delete(pathCompanies).where(eq(pathCompanies.ownerUserId, userId));

    // 3. Persona bonus rule months -> bonus rules -> events -> personas
    const userPersonas = await db
      .select({ id: comparisonPersonas.id })
      .from(comparisonPersonas)
      .where(eq(comparisonPersonas.ownerUserId, userId));
    const personaIds = userPersonas.map((p) => p.id);

    if (personaIds.length > 0) {
      for (const personaId of personaIds) {
        const bonusRules = await db
          .select({ id: personaBonusRules.id })
          .from(personaBonusRules)
          .where(eq(personaBonusRules.personaId, personaId));

        for (const rule of bonusRules) {
          await db.delete(personaBonusRuleMonths).where(eq(personaBonusRuleMonths.bonusRuleId, rule.id));
        }

        await db.delete(personaBonusRules).where(eq(personaBonusRules.personaId, personaId));
        await db.delete(personaCareerEvents).where(eq(personaCareerEvents.personaId, personaId));
      }

      await db.delete(comparisonPersonas).where(eq(comparisonPersonas.ownerUserId, userId));
    }

    // 4. Finance settings
    await db.delete(userFinanceSettings).where(eq(userFinanceSettings.ownerUserId, userId));

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
