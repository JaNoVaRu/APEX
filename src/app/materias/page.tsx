import { createClient } from "@/lib/supabase/server";

type Topic = { id: string; title: string; sort_order: number };
type Resource = { id: string; label: string };
type Subject = {
  id: string;
  code: string;
  division: string;
  sort_order: number;
  topics: Topic[];
  resources: Resource[];
};

export default async function MateriasPage() {
  const supabase = await createClient();

  let subjects: Subject[] = [];
  let errorMsg = "";

  try {
    const { data, error } = await supabase
      .from("subjects")
      .select(
        "id, code, division, sort_order, topics(id, title, sort_order), resources(id, label)",
      )
      .order("sort_order", { ascending: true });
    if (error) throw error;
    subjects = (data ?? []) as unknown as Subject[];
    subjects.forEach((s) => s.topics.sort((a, b) => a.sort_order - b.sort_order));
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "No se pudo cargar el catálogo.";
  }

  const divisionSeen = new Set<string>();
  const rows = subjects.map((s) => {
    const showDivision = !divisionSeen.has(s.division);
    divisionSeen.add(s.division);
    return { subject: s, showDivision };
  });

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="section-title">
          <span>Materias</span>
          <span className="muted">{subjects.length} en el plan de estudios</span>
        </h2>
        {errorMsg && <div className="note note-error">{errorMsg}</div>}
        {rows.map(({ subject: s, showDivision }) => {
          return (
            <div key={s.id}>
              {showDivision && <h4 className="division-head">{s.division}</h4>}
              <div className="taccount">
                <div className="taccount-head">
                  <h3>{s.code}</h3>
                  <span className="pct">{s.topics.length} temas</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {s.topics.map((t) => (
                      <li key={t.id}>{t.title}</li>
                    ))}
                  </ul>
                </div>
                {s.resources.length > 0 && (
                  <div className="resources">
                    <div className="rlabel">Material de apoyo</div>
                    {s.resources.map((r) => (
                      <span className="rchip" key={r.id}>
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
