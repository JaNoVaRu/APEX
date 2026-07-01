"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/cuenta?mode=login&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/cuenta");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect(
      `/cuenta?mode=register&error=${encodeURIComponent("Completa nombre, correo y contraseña.")}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    redirect(`/cuenta?mode=register&error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      `/cuenta?mode=login&info=${encodeURIComponent("Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.")}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/cuenta");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
