"use client";

import {
  Sparkles,
  User,
  Tag,
  ListChecks,
  AlignLeft,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/features/documents/types";

// Agent display map
const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  emma: { label: "Emma – Yêu cầu", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  sarah: { label: "Sarah – Stakeholder", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  jack: { label: "Jack – Quy trình", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  david: { label: "David – Tuân thủ", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  paul: { label: "Paul – Traceability", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  alex: { label: "Alex – Điều phối", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
};

interface DocumentRagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

export function DocumentRagDialog({
  open,
  onOpenChange,
  document: doc,
}: DocumentRagDialogProps) {
  if (!doc) return null;

  const isProcessed = !!doc.rag_processed_at;
  const agentInfo = doc.assigned_agent ? AGENT_LABELS[doc.assigned_agent] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 leading-snug break-all">
            <Sparkles className="size-4 shrink-0 text-primary" />
            {doc.filename}
          </DialogTitle>
          <DialogDescription>
            {isProcessed
              ? "Thông tin phân tích AI đã được xử lý thành công."
              : "Tài liệu chưa được AI phân tích."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="space-y-4 py-1">
            {/* Status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant={isProcessed ? "default" : "outline"}
                className={isProcessed ? "gap-1" : "gap-1 text-muted-foreground"}
              >
                <Sparkles className="size-3" />
                {isProcessed ? "Đã phân tích AI" : "Chưa phân tích"}
              </Badge>

              {agentInfo && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${agentInfo.color}`}
                >
                  <User className="size-3" />
                  {agentInfo.label}
                </span>
              )}

              {doc.rag_processed_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDate(doc.rag_processed_at)}
                </span>
              )}
            </div>

            {!isProcessed && (
              <p className="text-sm text-muted-foreground italic">
                Tài liệu này chưa có dữ liệu phân tích từ AI.
              </p>
            )}

            {/* Summary */}
            {doc.summary && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <AlignLeft className="size-3.5 text-muted-foreground" />
                    Tóm tắt
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.summary}
                  </p>
                </div>
              </>
            )}

            {/* Keywords */}
            {doc.keywords && doc.keywords.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag className="size-3.5 text-muted-foreground" />
                    Từ khóa
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs font-normal">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Important points */}
            {doc.important_points && doc.important_points.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <ListChecks className="size-3.5 text-muted-foreground" />
                    Điểm quan trọng
                  </p>
                  <ul className="space-y-1.5">
                    {doc.important_points.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Notes */}
            {doc.notes && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">Ghi chú</p>
                  <p className="text-sm text-muted-foreground">{doc.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
