import { ProjectList } from "@/features/projects/components";
import { ApiKeyManager } from "@/features/settings/components";

export default function ProjectsPage() {
  return (
    <>
      <div className="container mx-auto max-w-5xl py-8 px-4 pb-16">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dự án</h1>
            <p className="text-muted-foreground mt-1">
              Tạo và quản lý các dự án phân tích nghiệp vụ.
            </p>
          </div>
          <ApiKeyManager />
        </div>
        <ProjectList />
      </div>
      <footer className="fixed bottom-0 left-0 right-0 py-4 border-t border-border bg-background text-center">
        <a
          href="https://businessanalysis.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Made with ❤ by BAWS Team
        </a>
      </footer>
    </>
  );
}
