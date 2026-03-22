import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getQuizQuestions } from "./actions";
import { QuizView } from "@/components/admin/quiz/QuizView";

export default async function QuizPage() {
  let questions: Awaited<ReturnType<typeof getQuizQuestions>> = [];
  try {
    questions = await getQuizQuestions();
  } catch {
    questions = [];
  }

  return (
    <WorkspacePage
      title="Quiz Questions"
      description="Create and manage quiz questions. Select a row to edit."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuizView questions={questions} />
      </div>
    </WorkspacePage>
  );
}
