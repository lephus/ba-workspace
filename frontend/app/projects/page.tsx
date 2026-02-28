import { ProjectList } from "@/features/projects/components";
import { getTranslations } from "next-intl/server";

export default async function ProjectsPage() {
  const t = await getTranslations("projects");

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>
      <ProjectList />
    </div>
  );
}
