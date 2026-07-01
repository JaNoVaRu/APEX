import { createClient } from "@/lib/supabase/server";
import { AuthForms } from "@/components/AuthForms";
import { signOutAction } from "./actions";
import type { User } from "@supabase/supabase-js";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; info?: string }>;
}) {
  const { mode, error, info } = await searchParams;
  const supabase = await createClient();

  let user: User | null = null;
  let profile: { name: string; plan: string; is_owner: boolean } | null = null;
  let connectionError = "";

  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("name, plan, is_owner")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  } catch (err) {
    connectionError =
      err instanceof Error ? err.message : "No se pudo verificar la sesión.";
  }

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="section-title">Cuenta</h2>
        {connectionError && <div className="note note-error">{connectionError}</div>}
        {user ? (
          <div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                <tr>
                  <td className="muted" style={{ padding: "4px 0" }}>
                    Nombre
                  </td>
                  <td style={{ textAlign: "right" }}>{profile?.name ?? "—"}</td>
                </tr>
                <tr>
                  <td className="muted" style={{ padding: "4px 0" }}>
                    Correo
                  </td>
                  <td style={{ textAlign: "right" }}>{user.email}</td>
                </tr>
                <tr>
                  <td className="muted" style={{ padding: "4px 0" }}>
                    Plan
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {profile?.is_owner
                      ? "Propietario (acceso total sin cargo)"
                      : profile?.plan === "premium"
                        ? "Premium"
                        : "Gratis"}
                  </td>
                </tr>
              </tbody>
            </table>
            <form action={signOutAction} className="form-row" style={{ marginTop: 14 }}>
              <button className="btn ghost small" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <AuthForms
            initialMode={mode === "register" ? "register" : "login"}
            error={error}
            info={info}
          />
        )}
      </div>
    </div>
  );
}
