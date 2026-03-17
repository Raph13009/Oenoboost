import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegions } from "@/app/admin/(cms)/wine-regions/actions";
import { getWineSubregions } from "./actions";
import { WineSubregionsView } from "@/components/admin/wine-subregions/WineSubregionsView";

export default async function WineSubregionsPage() {
  let subregions: Awaited<ReturnType<typeof getWineSubregions>> = [];
  let regions: Awaited<ReturnType<typeof getWineRegions>> = [];
  try {
    [subregions, regions] = await Promise.all([
      getWineSubregions(),
      getWineRegions(),
    ]);
  } catch {
    subregions = [];
    regions = [];
  }

  return (
    <WorkspacePage
      title="Wine Subregions"
      description="Manage wine subregions. Select a row to edit in the panel."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WineSubregionsView subregions={subregions} regions={regions} />
      </div>
    </WorkspacePage>
  );
}
