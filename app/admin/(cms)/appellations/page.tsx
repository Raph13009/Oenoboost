import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegionsLite } from "@/app/admin/(cms)/wine-regions/actions";
import { getWineSubregionsLite } from "@/app/admin/(cms)/wine-subregions/actions";
import { getAppellations } from "./actions";
import { AppellationsView } from "@/components/admin/appellations/AppellationsView";
import { getSoilTypesLite } from "@/app/admin/(cms)/soil-types/actions";

export default async function AppellationsPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string };
}) {
  const pageSize = 14;
  const pageNumRaw = searchParams?.page ?? "1";
  const searchQuery = (searchParams?.q ?? "").trim();
  const pageNum = Number.parseInt(pageNumRaw, 10);
  const currentPage = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
  const offset = (currentPage - 1) * pageSize;

  let appellations: Awaited<ReturnType<typeof getAppellations>>["appellations"] = [];
  let hasPrev = false;
  let hasNext = false;
  let regions: Awaited<ReturnType<typeof getWineRegionsLite>> = [];
  let subregions: Awaited<ReturnType<typeof getWineSubregionsLite>> = [];
  let soilTypes: Awaited<ReturnType<typeof getSoilTypesLite>> = [];
  try {
    const res = await getAppellations({ limit: pageSize, offset, query: searchQuery });
    ({ appellations, hasPrev, hasNext } = res);
  } catch {
    appellations = [];
    hasPrev = false;
    hasNext = false;
  }

  const [regionsRes, subregionsRes, soilTypesRes] = await Promise.allSettled([
    getWineRegionsLite(),
    getWineSubregionsLite(),
    getSoilTypesLite(),
  ]);

  regions = regionsRes.status === "fulfilled" ? regionsRes.value : [];
  subregions = subregionsRes.status === "fulfilled" ? subregionsRes.value : [];
  soilTypes = soilTypesRes.status === "fulfilled" ? soilTypesRes.value : [];

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
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
          initialSearch={searchQuery}
        />
      </div>
    </WorkspacePage>
  );
}
