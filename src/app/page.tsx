import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let status: "ok" | "error" = "ok";
  let detail = "";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    detail = "El cliente de Supabase respondió correctamente.";
  } catch (err) {
    status = "error";
    detail = err instanceof Error ? err.message : "Error desconocido.";
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <h1>Libro Mayor — Estudio para Contadores</h1>
          <p>Aprendizaje guiado para estudiantes y profesionales de Contaduría</p>
        </div>
        <div className="seal">
          LIBRO
          <br />
          MAYOR
        </div>
      </header>
      <div className="wrap">
        <div className="card">
          <h2 className="section-title">Estado de la conexión</h2>
          <div className={`status-line ${status === "ok" ? "status-ok" : "status-err"}`}>
            {status === "ok" ? "✓ Conectado a Supabase" : "✗ No se pudo conectar a Supabase"}
          </div>
          <div className="status-line">{detail}</div>
        </div>
      </div>
    </div>
  );
}
