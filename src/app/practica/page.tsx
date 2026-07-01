import { createClient } from "@/lib/supabase/server";

type QuizQuestionPublic = {
  id: string;
  subject_id: string;
  question: string;
  options: string[];
};

export default async function PracticaPage() {
  const supabase = await createClient();

  let questions: QuizQuestionPublic[] = [];
  let errorMsg = "";

  try {
    const { data, error } = await supabase
      .from("quiz_questions_public")
      .select("id, subject_id, question, options");
    if (error) throw error;
    questions = (data ?? []) as unknown as QuizQuestionPublic[];
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "No se pudieron cargar los ejercicios.";
  }

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="section-title">
          <span>Práctica guiada</span>
          <span className="muted">{questions.length} ejercicios</span>
        </h2>
        <div className="note">
          Esta vista solo lee de la vista pública quiz_questions_public (sin la respuesta
          correcta). Calificar intentos llega en una fase posterior, con una función de
          servidor que sí tiene acceso a correct_index.
        </div>
        {errorMsg && <div className="note note-error">{errorMsg}</div>}
        {questions.map((q) => (
          <div key={q.id} style={{ marginTop: 16 }}>
            <div className="quiz-q">{q.question}</div>
            {q.options.map((opt, i) => (
              <div className="quiz-opt" key={i}>
                {opt}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
