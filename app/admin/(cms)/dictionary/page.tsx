import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getDictionaryTerms } from "./actions";
import { DictionaryView } from "@/components/admin/dictionary/DictionaryView";

export default async function DictionaryPage() {
  let terms: Awaited<ReturnType<typeof getDictionaryTerms>> = [];
  try {
    terms = await getDictionaryTerms();
  } catch {
    terms = [];
  }

  return (
    <WorkspacePage
      title="Dictionary Terms"
      description="Manage glossary terms. Select a row to edit in the panel."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DictionaryView terms={terms} />
      </div>
    </WorkspacePage>
  );
}
