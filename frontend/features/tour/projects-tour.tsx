"use client";

import { useTranslations } from "next-intl";
import { useTour, getProjectsTourSteps, resetTourFlag } from "@/features/tour";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProjectsTour() {
  const t = useTranslations("tour.projects");

  const steps = getProjectsTourSteps(t);

  const { startTour } = useTour({
    page: "projects",
    steps,
  });

  const handleRestart = () => {
    resetTourFlag("projects");
    startTour();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={handleRestart}
          data-tour="restart-tour"
        >
          <CircleHelp className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("restartTour")}</TooltipContent>
    </Tooltip>
  );
}
