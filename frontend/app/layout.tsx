import AppProvider from "@/config/app-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import './globals.css';

export const metadata = {
  title: 'BAWS - Business Analysis Workspace',
  description: 'BAWS Frontend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
