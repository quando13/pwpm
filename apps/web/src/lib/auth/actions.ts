"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(6, { error: "Password must be at least 6 characters." }),
});

async function siteUrl() {
  const h = await headers();
  return h.get("origin") ?? "http://localhost:3000";
}

export type AuthFormState = { error?: string } | undefined;

export async function signIn(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export type SignUpFormState = { error?: string; checkEmail?: boolean } | undefined;

export async function signUp(_state: SignUpFormState, formData: FormData): Promise<SignUpFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  // Email confirmations disabled -> signUp already returns an active session.
  if (data.session) {
    redirect("/");
  }

  return { checkEmail: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function signInWithOAuth(provider: "google" | "facebook") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error || !data.url) {
    redirect("/login?error=oauth-failed");
  }
  redirect(data.url);
}

export async function signInWithGoogle() {
  await signInWithOAuth("google");
}

export async function signInWithFacebook() {
  await signInWithOAuth("facebook");
}

export type RequestResetState = { error?: string; sent?: boolean } | undefined;

export async function requestPasswordReset(
  _state: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const parsed = z.email({ error: "Enter a valid email address." }).safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}

export type UpdatePasswordState = { error?: string } | undefined;

export async function updatePassword(
  _state: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = z
    .string()
    .min(6, { error: "Password must be at least 6 characters." })
    .safeParse(formData.get("password"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
