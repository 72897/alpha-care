/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/lib/session";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      // profileURL,
      // resumeURL,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: error?.message || "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { idToken } = params;

  try {
    // No getUserByEmail lookup first: the client has already authenticated to
    // get this idToken, and createSessionCookie rejects an invalid or revoked
    // one anyway. The extra call was a second round trip to Google on a path
    // the user is actively waiting on.
    await setSessionCookie(idToken);

    return { success: true };
  } catch (error: any) {
    console.log("Error", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out by clearing the session cookie and revoking the session server-side.
// Clearing the cookie alone left it valid until expiry, so a copy of it would
// still have worked.
export async function signOut() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  cookieStore.delete("session");

  if (!sessionCookie) return;

  try {
    const claims = await auth.verifySessionCookie(sessionCookie, false);
    await Promise.all([
      auth.revokeRefreshTokens(claims.uid),
      // getCurrentUser checks this to reject cookies issued before sign-out,
      // which lets it verify locally instead of paying for a revocation round
      // trip on every page load.
      db
        .collection("users")
        .doc(claims.uid)
        .set({ tokensValidAfter: new Date().toISOString() }, { merge: true }),
    ]);
  } catch (error) {
    // Already invalid, so there is nothing left to revoke.
    console.log("Sign out revocation skipped:", error);
  }
}

// Check if user is authenticated. Only needs the session cookie to be valid,
// so it skips the Firestore `users` read that getCurrentUser does.
export async function isAuthenticated() {
  const uid = await getCurrentUserId();
  return !!uid;
}


//delete user
export async function deleteUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return { success: false, message: "No session found" };

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    // The two queries are independent, so run them together.
    const [feedbackSnapshot, interviewSnapshot] = await Promise.all([
      db.collection("feedback").where("userId", "==", uid).get(),
      db.collection("interviews").where("userId", "==", uid).get(),
    ]);

    // Batched, and awaited: the previous version fired the per-doc deletes
    // without awaiting them, so the function could return (and the process move
    // on) before the data was actually gone.
    const batch = db.batch();
    feedbackSnapshot.forEach((doc) => batch.delete(doc.ref));
    interviewSnapshot.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection("users").doc(uid));
    await batch.commit();

    // Delete the Firebase Auth user
    await auth.deleteUser(uid);

    // Remove session cookie
    cookieStore.delete("session");

    return { success: true, message: "User and data deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Failed to delete user. Please try again.",
    };
  }
}

// Update User Profile
export async function updateUserProfile(params: { name: string; focusArea: string }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return { success: false, message: "No session found" };

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    await db.collection("users").doc(uid).update({
      name: params.name,
      focusArea: params.focusArea,
    });

    return { success: true, message: "Profile updated successfully." };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Failed to update profile." };
  }
}
