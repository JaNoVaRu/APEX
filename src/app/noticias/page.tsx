import { createClient } from "@/lib/supabase/server";

type NewsItem = { id: string; tag: string; title: string; published_on: string };

export default async function NoticiasPage() {
  const supabase = await createClient();

  let news: NewsItem[] = [];
  let errorMsg = "";

  try {
    const { data, error } = await supabase
      .from("news")
      .select("id, tag, title, published_on")
      .order("published_on", { ascending: false });
    if (error) throw error;
    news = data ?? [];
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "No se pudieron cargar las noticias.";
  }

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="section-title">Noticias de la profesión</h2>
        {errorMsg && <div className="note note-error">{errorMsg}</div>}
        {news.map((n) => (
          <div className="news-item" key={n.id}>
            <span className="news-tag">{n.tag}</span>
            <div className="news-title">{n.title}</div>
            <div className="news-date">{new Date(n.published_on).getFullYear()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
