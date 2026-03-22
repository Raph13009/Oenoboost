import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getNewsArticles } from "./actions";
import { NewsView } from "@/components/admin/news/NewsView";

export default async function NewsPage() {
  let articles: Awaited<ReturnType<typeof getNewsArticles>> = [];
  try {
    articles = await getNewsArticles();
  } catch {
    articles = [];
  }

  return (
    <WorkspacePage
      title="News Articles"
      description="Manage news, guides, and editorial content. Select a row to edit."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <NewsView articles={articles} />
      </div>
    </WorkspacePage>
  );
}
