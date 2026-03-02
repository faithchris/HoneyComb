import { supabase } from "./supabaseClient";

function isMissingProfilesEmailColumnError(error) {
  const message = (error?.message || "").toLowerCase();
  return message.includes("profiles.email") && message.includes("does not exist");
}

function isMissingProfilesHoneycombColumnError(error) {
  const message = (error?.message || "").toLowerCase();
  return message.includes("profiles") && message.includes("honeycomb") && message.includes("does not exist");
}

function normalizeAuthError(error, mode) {
  if (!error) {
    return null;
  }

  const message = (error.message || "").toLowerCase();

  if (mode === "signIn" && message.includes("invalid login credentials")) {
    return new Error("Invalid email or password.");
  }

  if (
    mode === "signUp" &&
    (message.includes("already registered") ||
      message.includes("user already registered"))
  ) {
    return new Error("Invalid entry: this email is already registered.");
  }

  return error;
}

export async function ensureProfile(userId, email) {
  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!existingProfile) {
    const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        honeycomb: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      if (!isMissingProfilesHoneycombColumnError(error)) {
        throw error;
      }

      const { error: legacyError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            points: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

      if (legacyError) {
        throw legacyError;
      }
    }
  }

  if (!email) {
    return;
  }

  const { error: emailUpdateError } = await supabase
    .from("profiles")
    .update({
      email: email.trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (emailUpdateError && !isMissingProfilesEmailColumnError(emailUpdateError)) {
    throw emailUpdateError;
  }
}

export async function signUpWithEmail({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  const normalizedError = normalizeAuthError(error, "signUp");
  if (normalizedError) {
    throw normalizedError;
  }

  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Invalid entry: this email is already registered.");
  }

  if (data?.user?.id) {
    await ensureProfile(data.user.id, email);
  }

  return data;
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const normalizedError = normalizeAuthError(error, "signIn");
  if (normalizedError) {
    throw normalizedError;
  }

  if (data?.user?.id) {
    await ensureProfile(data.user.id, email);
  }

  return data;
}

export async function sendPasswordResetEmail(email) {
  const redirectTo = `${window.location.origin}/#/ResetPassword`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function isEmailAssociatedWithHoneycombAccount(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: rpcData, error: rpcError } = await supabase.rpc("honeycomb_email_exists", {
    email_input: normalizedEmail,
  });

  if (!rpcError) {
    return Boolean(rpcData);
  }

  const rpcMessage = (rpcError.message || "").toLowerCase();
  const missingRpcFunction =
    rpcMessage.includes("could not find the function") ||
    rpcMessage.includes("pgrst202") ||
    rpcMessage.includes("honeycomb_email_exists");

  if (!missingRpcFunction) {
    throw rpcError;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (error) {
    if (isMissingProfilesEmailColumnError(error)) {
      throw new Error(
        "Password reset email lookup is not ready yet. Please run the database migration to add profiles.email.",
      );
    }
    throw error;
  }

  return Array.isArray(data) && data.length > 0;
}

function parseRecoveryTokensFromHash() {
  const hash = window.location.hash || "";
  const hashSections = hash.split("#").filter(Boolean);
  const tokenSegment = hashSections[hashSections.length - 1] || "";
  const params = new URLSearchParams(tokenSegment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export async function initializeRecoverySessionFromUrl() {
  const tokens = parseRecoveryTokensFromHash();

  if (!tokens) {
    return false;
  }

  const { error } = await supabase.auth.setSession(tokens);
  if (error) {
    throw error;
  }

  return true;
}

export async function updateCurrentUserPassword(password) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
