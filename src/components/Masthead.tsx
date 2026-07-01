import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/cuenta/actions";
import type { User } from "@supabase/supabase-js";

export async function Masthead() {
  const supabase = await createClient();

  let user: User | null = null;
  let badgeLabel = "invitado";
  let badgeClass = "plan-badge free";

  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, plan, is_owner")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_owner) {
        badgeLabel = "propietario";
        badgeClass = "plan-badge premium";
      } else if (profile?.plan === "premium") {
        badgeLabel = "premium";
        badgeClass = "plan-badge premium";
      } else {
        badgeLabel = `${profile?.name?.split(" ")[0] ?? "cuenta"} · gratis`;
        badgeClass = "plan-badge free";
      }
    }
  } catch {
    // Si Supabase no responde, se muestra la cabecera como invitado
    // en vez de tumbar toda la página.
  }

  return (
    <>
      <header className="masthead">
        <div>
          <h1>
            Libro Mayor — Estudio para Contadores
            <span className={badgeClass}>{badgeLabel}</span>
          </h1>
          <p>Aprendizaje guiado para estudiantes y profesionales de Contaduría</p>
        </div>
        <div className="seal">
          LIBRO
          <br />
          MAYOR
        </div>
      </header>
      <nav className="tabs wrap">
        <Link href="/">Panel</Link>
        <Link href="/materias">Materias</Link>
        <Link href="/practica">Práctica</Link>
        <Link href="/noticias">Noticias</Link>
        <Link href="/cuenta">Cuenta</Link>
        {user && (
          <form action={signOutAction}>
            <button className="btn ghost small" type="submit">
              Cerrar sesión
            </button>
          </form>
        )}
      </nav>
    </>
  );
}
