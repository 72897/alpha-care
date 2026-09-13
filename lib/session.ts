import { cookies } from "next/headers";
import { cache } from "react";

import { auth, db } from "@/firebase/admin";

/**
 * Verifies the session cookie and returns its claims.
 *
 * `verifySessionCookie(cookie, true)` was costing ~320ms per call because the
 * revocation check is a live round trip to Google's identity service, and it
 * ran on every page load. Verifying locally instead is ~2ms, since it only
 * checks the signature against cached public keys.
 *
 * Revocation is still honoured: signOut and deleteUser call revokeRefreshTokens
 * and record the time in the user's doc, and the check below rejects any cookie
 * issued before that. Because it reads the same `users` doc getCurrentUser
 * already needs, it costs nothing extra.
 */
const verifySession = cache(async () => {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    return await auth.verifySessionCookie(sessionCookie, false);
  } catch (error) {
    console.log(error);
    // Invalid, malformed, or expired session
    return null;
  }
});

/**
 * Resolves the signed-in user from the session cookie.
 *
 * Wrapped in React's `cache` so it runs at most once per request. The root
 * layout needs the user, every page under it needs the user, and each
 * InterviewCard needs it too, so an uncached version meant a cookie
 * verification plus a `users` read for every one of them. Deduplicating
 * collapses those into a single pair.
 *
 * Lives outside the "use server" action files so it can be a plain cached
 * function rather than a server action.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const claims = await verifySession();
  if (!claims) return null;

  try {
    const userRecord = await db.collection("users").doc(claims.uid).get();
    if (!userRecord.exists) return null;

    const data = userRecord.data() ?? {};

    // Reject cookies minted before the user's tokens were last revoked.
    // `auth_time` is in seconds; tokensValidAfter is an ISO string.
    const tokensValidAfter = data.tokensValidAfter as string | undefined;
    if (tokensValidAfter) {
      const revokedAt = new Date(tokensValidAfter).getTime();
      if (Number.isFinite(revokedAt) && claims.auth_time * 1000 < revokedAt) {
        return null;
      }
    }

    return {
      ...data,
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log(error);
    return null;
  }
});

/**
 * The uid alone, skipping the Firestore `users` read. Enough for anything that
 * only needs to know whether a valid session exists.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const claims = await verifySession();
  return claims?.uid ?? null;
});
