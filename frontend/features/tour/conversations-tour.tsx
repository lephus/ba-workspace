"use client";

import { useTranslations } from "next-intl";
import {
  useTour,
  getConversationTourSteps,
  resetTourFlag,
} from "@/features/tour";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConversationTour() {
  const t = useTranslations("tour.conversations");

  const steps = getConversationTourSteps(t);

  const { startTour } = useTour({
    page: "conversations",
    steps,
  });

  const handleRestart = () => {
    resetTourFlag("conversations");
    startTour();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleRestart}
        >
          <CircleHelp className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("restartTour")}</TooltipContent>
    </Tooltip>
  );
}
