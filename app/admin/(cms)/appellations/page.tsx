import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegions } from "@/app/admin/(cms)/wine-regions/actions";
import { getWineSubregions } from "@/app/admin/(cms)/wine-subregions/actions";
import { getAppellations } from "./actions";
import { AppellationsView } from "@/components/admin/appellations/AppellationsView";
import { getSoilTypes } from "@/app/admin/(cms)/soil-types/actions";

export default async function AppellationsPage() {
  let appellations: Awaited<ReturnType<typeof getAppellations>> = [];
  let regions: Awaited<ReturnType<typeof getWineRegions>> = [];
  let subregions: Awaited<ReturnType<typeof getWineSubregions>> = [];
  let soilTypes: Awaited<ReturnType<typeof getSoilTypes>> = [];
  try {
    [appellations, regions, subregions, soilTypes] = await Promise.all([
      getAppellations(),
      getWineRegions(),
      getWineSubregions(),
      getSoilTypes(),
    ]);
  } catch {
    appellations = [];
    regions = [];
    subregions = [];
    soilTypes = [];
  }

  return (
    <WorkspacePage
      title="Appellations"
      description="Manage appellations. Select a row to edit in the panel."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppellationsView
          appellations={appellations}
          regions={regions}
          subregions={subregions}
          soilTypes={soilTypes}
        />
      </div>
    </WorkspacePage>
  );
}
