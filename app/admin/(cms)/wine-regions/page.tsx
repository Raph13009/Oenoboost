import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegions } from "./actions";
import { WineRegionsView } from "@/components/admin/wine-regions/WineRegionsView";

export default async function WineRegionsPage() {
  let regions: Awaited<ReturnType<typeof getWineRegions>> = [];
  try {
    regions = await getWineRegions();
  } catch {
    regions = [];
  }

  return (
    <WorkspacePage
      title="Wine Regions"
      description="Manage wine regions. Select a row to edit in the panel."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WineRegionsView regions={regions} />
      </div>
    </WorkspacePage>
  );
}
