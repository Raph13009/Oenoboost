import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getGrapes } from "./actions";
import { GrapesView } from "@/components/admin/grapes/GrapesView";

export default async function GrapesPage() {
  let grapes: Awaited<ReturnType<typeof getGrapes>> = [];
  try {
    grapes = await getGrapes();
  } catch {
    grapes = [];
  }

  return (
    <WorkspacePage
      title="Grapes"
      description="Manage grapes. Select a row to edit in the panel."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <GrapesView grapes={grapes} />
      </div>
    </WorkspacePage>
  );
}
