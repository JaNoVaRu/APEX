import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let status: "ok" | "error" = "ok";
  let detail = "";

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("subjects")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    detail = `Lectura de "subjects" vía RLS pública funcionando (${count ?? 0} materias en el catálogo).`;
  } catch (err) {
    status = "error";
    detail = err instanceof Error ? err.message : "Error desconocido.";
  }

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="section-title">Estado de la conexión</h2>
        <div className={`status-line ${status === "ok" ? "status-ok" : "status-err"}`}>
          {status === "ok" ? "✓ Conectado a Supabase" : "✗ No se pudo conectar a Supabase"}
        </div>
        <div className="status-line">{detail}</div>
      </div>
    </div>
  );
}
