"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useApiKeys,
  useAddApiKey,
  useDeleteApiKey,
  useToggleApiKey,
  useValidateApiKey,
} from "@/features/settings/hooks";
import type { ApiKey } from "@/features/settings/types";
import { toast } from "sonner";

export function ApiKeyManager() {
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const { data: keys, isLoading } = useApiKeys();
  const addKey = useAddApiKey();
  const deleteKey = useDeleteApiKey();
  const toggleKey = useToggleApiKey();
  const validateKey = useValidateApiKey();

  const handleAddKey = async () => {
    if (!newKey.trim()) {
      toast.error("Vui lòng nhập API key");
      return;
    }
    try {
      await addKey.mutateAsync({
        key: newKey.trim(),
        label: newLabel.trim() || undefined,
        validate: true,
      });
      toast.success("Đã thêm API key thành công");
      setNewKey("");
      setNewLabel("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast.error(msg);
    }
  };

  const handleDelete = async (keyId: number) => {
    try {
      await deleteKey.mutateAsync(keyId);
      toast.success("Đã xoá API key");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast.error(msg);
    }
  };

  const handleToggle = async (keyId: number, isActive: boolean) => {
    try {
      await toggleKey.mutateAsync({ keyId, isActive: !isActive });
      toast.success(isActive ? "Đã tắt API key" : "Đã bật API key");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast.error(msg);
    }
  };

  const handleValidate = async () => {
    if (!newKey.trim()) {
      toast.error("Vui lòng nhập API key để kiểm tra");
      return;
    }
    try {
      const result = await validateKey.mutateAsync(newKey.trim());
      if (result.valid) {
        toast.success(
          result.error ? `Key hợp lệ: ${result.error}` : "API key hợp lệ!",
        );
      } else {
        toast.error(result.error || "API key không hợp lệ");
      }
    } catch {
      toast.error("Không thể kiểm tra API key");
    }
  };

  const activeCount = keys?.filter((k) => k.is_active).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="size-4" />
          <span className="hidden sm:inline">API Keys</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Quản lý API Keys
          </DialogTitle>
          <DialogDescription>
            Thêm nhiều Gemini API key. Hệ thống sẽ tự động chuyển sang key khác
            nếu key hiện tại bị lỗi hoặc hết quota.
          </DialogDescription>
        </DialogHeader>

        {/* Key list */}
        <div className="space-y-2 mt-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !keys || keys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Key className="size-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có API key nào.</p>
              <p>Thêm key Gemini bên dưới hoặc cấu hình trong file .env</p>
            </div>
          ) : (
            keys.map((apiKey, index) => (
              <ApiKeyRow
                key={apiKey.id ?? `env-${index}`}
                apiKey={apiKey}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {/* Add new key */}
        <div className="border-t pt-4 mt-2 space-y-3">
          <p className="text-sm font-medium">Thêm API key mới</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKeyInput ? "text" : "password"}
                  placeholder="Nhập Gemini API key..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddKey();
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                >
                  {showKeyInput ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Input
              type="text"
              placeholder="Nhãn (tuỳ chọn, vd: Key cá nhân, Key team...)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddKey();
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleValidate}
                variant="outline"
                size="sm"
                disabled={validateKey.isPending || !newKey.trim()}
              >
                {validateKey.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Kiểm tra
              </Button>
              <Button
                onClick={handleAddKey}
                size="sm"
                disabled={addKey.isPending || !newKey.trim()}
              >
                {addKey.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Thêm key
              </Button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1 mt-2">
          <p>
            <strong>Ưu tiên:</strong> Key từ file .env luôn được sử dụng trước.
            Nếu không có hoặc bị lỗi, hệ thống sẽ dùng key từ UI.
          </p>
          <p>
            <strong>Tự động đổi key:</strong> Khi một key bị lỗi (hết quota,
            không hợp lệ), hệ thống tự động chuyển sang key tiếp theo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyRow({
  apiKey,
  onDelete,
  onToggle,
}: {
  apiKey: ApiKey;
  onDelete: (id: number) => void;
  onToggle: (id: number, isActive: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        apiKey.is_active ? "bg-background" : "bg-muted/30 opacity-60"
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {apiKey.is_active ? (
          apiKey.last_error ? (
            <AlertCircle className="size-4 text-yellow-500" />
          ) : (
            <CheckCircle2 className="size-4 text-green-500" />
          )
        ) : (
          <XCircle className="size-4 text-muted-foreground" />
        )}
      </div>

      {/* Key info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono truncate">
            {apiKey.key_masked}
          </code>
          {apiKey.source === "env" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              .env
            </Badge>
          )}
          {apiKey.label && apiKey.source !== "env" && (
            <span className="text-xs text-muted-foreground truncate">
              {apiKey.label}
            </span>
          )}
        </div>
        {apiKey.last_error && (
          <p className="text-[11px] text-destructive mt-0.5 truncate">
            {apiKey.last_error}
          </p>
        )}
        {apiKey.last_used_at && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Dùng lần cuối:{" "}
            {new Date(apiKey.last_used_at).toLocaleString("vi-VN")}
          </p>
        )}
      </div>

      {/* Actions - only for UI keys */}
      {apiKey.source === "ui" && apiKey.id !== null && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggle(apiKey.id!, apiKey.is_active)}
            title={apiKey.is_active ? "Tắt key" : "Bật key"}
          >
            {apiKey.is_active ? (
              <ToggleRight className="size-4 text-green-500" />
            ) : (
              <ToggleLeft className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(apiKey.id!)}
            title="Xoá key"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
