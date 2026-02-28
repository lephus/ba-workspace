"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  title: string;
  responsibility: string;
  description: string;
}

const AGENTS: Agent[] = [
  {
    id: "alex",
    name: "Alex",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771653526/Alex_nyfyf4.png",
    title: "Senior Business Analyst",
    responsibility: "Coordination & Synthesis",
    description:
      "Điều phối trung tâm & tổng hợp phân tích. Gom kết quả từ các agent chuyên môn, chuẩn hóa output và quản lý reasoning chain.",
  },
  {
    id: "emma",
    name: "Emma",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/Emma_pat3ft.png",
    title: "Requirements Agent",
    responsibility: "Requirements Validation",
    description:
      "Kiểm tra tính nhất quán, rõ ràng & cụ thể. Đánh giá theo SMART, phát hiện requirement mơ hồ, trùng lặp, xung đột.",
  },
  {
    id: "sarah",
    name: "Sarah",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/Sarah_fyqbgy.png",
    title: "Stakeholder Agent",
    responsibility: "Stakeholders Mapping",
    description:
      "Phân tích stakeholder & alignment. Map nhu cầu, phát hiện mâu thuẫn giữa stakeholder và alignment gap.",
  },
  {
    id: "david",
    name: "David",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/David_fy6qow.png",
    title: "Compliance Agent",
    responsibility: "Compliance & BABOK Check",
    description:
      "Kiểm tra compliance với BABOK, ISO và internal policies. Phát hiện business rule mâu thuẫn, vi phạm quy định.",
  },
  {
    id: "paul",
    name: "Paul",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649420/Paul_ppffqv.png",
    title: "Traceability Agent",
    responsibility: "Traceability & Impact Analysis",
    description:
      "Duy trì RTM tự động. Mapping stakeholder → requirement → deliverable. Phát hiện missing trace & orphan requirement.",
  },
];

interface AgentPanelProps {
  activeAgentIds?: string[];
}

export function AgentPanel({ activeAgentIds }: AgentPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('agents');

  return (
    <div className="border-b">
      {/* Compact row: avatars + expand toggle */}
      <div className="flex items-center gap-2 px-6 py-2">
        <div className="flex items-center gap-1.5">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {t('aiTeam')}
          </span>
        </div>

        {/* Avatar stack */}
        <div className="group/avatars flex -space-x-2 hover:space-x-1 transition-all duration-300">
          {AGENTS.map((agent) => {
            const isActive = activeAgentIds?.includes(agent.id);
            return (
              <Tooltip key={agent.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "relative rounded-full ring-2 ring-background transition-all duration-300",
                      isActive && "ring-primary/50"
                    )}
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="text-[10px] font-medium">
                        {agent.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-56">
                  <p className="font-semibold">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.title}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {activeAgentIds && activeAgentIds.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {activeAgentIds.length} {t('active')}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 gap-1 text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('hide') : t('details')}
          {expanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </Button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-6 pb-3 grid grid-cols-5 gap-2">
          {AGENTS.map((agent) => {
            const isActive = activeAgentIds?.includes(agent.id);
            return (
              <div
                key={agent.id}
                className={cn(
                  "flex flex-col items-center text-center rounded-lg border p-3 transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent bg-muted/40"
                )}
              >
                <div className="relative mb-2">
                  <Avatar className="size-10">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="text-sm font-medium">
                      {agent.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 ring-2 ring-background" />
                  )}
                </div>
                <p className="text-xs font-semibold leading-tight">
                  {agent.name}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {agent.responsibility}
                </p>
                <p className="text-[10px] text-muted-foreground/70 leading-snug mt-1.5 line-clamp-3">
                  {agent.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
