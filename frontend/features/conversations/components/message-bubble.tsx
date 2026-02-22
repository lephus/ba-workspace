"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bot, User, Copy, Check, Pin, PinOff, FileText, Paperclip } from "lucide-react";
import type { Message } from "@/features/messages/types";

interface MessageBubbleProps {
  message: Message;
  isPinned?: boolean;
  onPin?: (messageId: number) => void;
  onUnpin?: (messageId: number) => void;
}

export function MessageBubble({ message, isPinned, onPin, onUnpin }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground bg-muted rounded-full px-4 py-1.5">
          {message.content}
        </p>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group/message flex gap-3 py-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="size-8 shrink-0 mt-0.5">
        {!isUser && message.bot?.avatar && (
          <AvatarImage src={message.bot.avatar} alt={message.bot.name} />
        )}
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <User className="size-4" />
          ) : message.bot?.name ? (
            message.bot.name[0]
          ) : (
            <Bot className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Bot name for assistant */}
        {!isUser && message.bot && (
          <span className="text-xs font-medium text-muted-foreground mb-0.5">
            {message.bot.name}
            {message.bot.role && (
              <span className="ml-1 text-muted-foreground/60">
                · {message.bot.role}
              </span>
            )}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm wrap-break-word relative",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md whitespace-pre-wrap leading-relaxed"
              : "bg-muted rounded-tl-md",
            isPinned && "ring-1 ring-amber-400/50"
          )}
        >
          {isPinned && (
            <Pin className="size-3 text-amber-500 absolute -top-1.5 -right-1.5" />
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs"
                >
                  {att.type === "document" ? (
                    <FileText className="size-3 shrink-0" />
                  ) : (
                    <Paperclip className="size-3 shrink-0" />
                  )}
                  <span className="max-w-36 truncate">{att.filename}</span>
                </div>
              ))}
            </div>
          )}
          {isUser ? (
            message.content
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            copied
              ? "opacity-100"
              : "opacity-0 group-hover/message:opacity-100"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3 text-green-500" />
                ) : (
                  <Copy className="size-3 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {copied ? "Đã sao chép" : "Sao chép"}
            </TooltipContent>
          </Tooltip>
          {isPinned ? (
            onUnpin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => onUnpin(message.id)}
                  >
                    <PinOff className="size-3 text-amber-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Bỏ ghim</TooltipContent>
              </Tooltip>
            )
          ) : (
            onPin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => onPin(message.id)}
                  >
                    <Pin className="size-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Ghim</TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </div>
    </div>
  );
}
