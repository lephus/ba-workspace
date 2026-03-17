"use client";

import React, { useState } from "react";
import {
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Link2,
  Unplug,
  Download,
  Table2,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  BotMessageSquare,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useConnections,
  useCreateConnection,
  useDeleteConnection,
  useTestConnection,
  useTestConnectionPreview,
  useCollections,
  useSyncCollection,
  useDatasets,
  useDataset,
  useDeleteDataset,
} from "../hooks";
import type { CmsConnection, CmsDataset, PayloadCollection } from "../types";

interface CmsConnectionManagerProps {
  projectId: number;
}

export function CmsConnectionManager({ projectId }: CmsConnectionManagerProps) {
  const t = useTranslations("cms");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [previewDatasetId, setPreviewDatasetId] = useState<number | null>(null);

  const { data: connections, isLoading: connectionsLoading } = useConnections(projectId);
  const { data: datasets, isLoading: datasetsLoading } = useDatasets(projectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("integration")}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="size-4" />
          {t("addConnection")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("description")}
      </p>

      {/* Add Connection Form */}
      {showAddForm && (
        <AddConnectionForm
          projectId={projectId}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Connection List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{t("connectionList")}</h4>
        {connectionsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !connections || connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            <Unplug className="size-8 mx-auto mb-2 opacity-50" />
            <p>{t("noConnections")}</p>
            <p className="text-xs mt-1">{t("noConnectionsHint")}</p>
          </div>
        ) : (
          connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              projectId={projectId}
              isSelected={selectedConnectionId === conn.id}
              onSelect={() =>
                setSelectedConnectionId(
                  selectedConnectionId === conn.id ? null : conn.id,
                )
              }
            />
          ))
        )}
      </div>

      {/* ── AI Data Context ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <h4 className="text-sm font-medium">{t("aiContext.title")}</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("aiContext.description")}
        </p>

        {datasetsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !datasets || datasets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            <BotMessageSquare className="size-8 mx-auto mb-2 opacity-40" />
            <p>{t("aiContext.empty")}</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">{t("aiContext.emptyHint")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {datasets.map((ds) => (
              <DatasetRow
                key={ds.id}
                dataset={ds}
                projectId={projectId}
                isPreview={previewDatasetId === ds.id}
                onTogglePreview={() =>
                  setPreviewDatasetId(previewDatasetId === ds.id ? null : ds.id)
                }
              />
            ))}
            {/* Tip */}
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-md px-3 py-2 mt-1">
              <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                {t("aiContext.tip")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Preview Dialog */}
      <DataPreviewDialog
        projectId={projectId}
        datasetId={previewDatasetId}
        open={previewDatasetId !== null}
        onOpenChange={(open) => { if (!open) setPreviewDatasetId(null); }}
      />
    </div>
  );
}

// ── Add Connection Form ─────────────────────────────────────────────────

function AddConnectionForm({
  projectId,
  onClose,
}: {
  projectId: number;
  onClose: () => void;
}) {
  const t = useTranslations("cms");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const createConnection = useCreateConnection(projectId);
  const testPreview = useTestConnectionPreview(projectId);

  const handleSubmit = async () => {
    if (!name.trim() || !baseUrl.trim()) return;
    try {
      await createConnection.mutateAsync({
        name: name.trim(),
        base_url: baseUrl.trim(),
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
      });
      setName("");
      setBaseUrl("");
      setApiKey("");
      onClose();
    } catch {
      // Toast handled by hook
    }
  };

  const handleTest = () => {
    if (!baseUrl.trim()) return;
    testPreview.mutate({
      base_url: baseUrl.trim(),
      ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("addForm.title")}</h4>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <Input
        placeholder={t("addForm.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder={t("addForm.urlPlaceholder")}
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
      />
      <div className="relative">
        <Input
          type={showKey ? "text" : "password"}
          placeholder={t("addForm.apiKeyPlaceholder")}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("addForm.cancel")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testPreview.isPending || !baseUrl.trim()}
          className="gap-2"
        >
          {testPreview.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Link2 className="size-4" />
          )}
          {t("addForm.testConnection")}
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={createConnection.isPending || !name.trim() || !baseUrl.trim()}
          className="gap-2"
        >
          {createConnection.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {t("addForm.createConnection")}
        </Button>
      </div>
    </div>
  );
}

// ── Connection Card ─────────────────────────────────────────────────────

function ConnectionCard({
  connection,
  projectId,
  isSelected,
  onSelect,
}: {
  connection: CmsConnection;
  projectId: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("cms");
  const deleteConnection = useDeleteConnection(projectId);
  const testConnection = useTestConnection(projectId);

  return (
    <div className="border rounded-lg overflow-hidden transition-colors">
      {/* Connection header */}
      <div
        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? "bg-primary/5 border-b" : ""
        }`}
        onClick={onSelect}
      >
        <div className="shrink-0">
          {connection.is_active ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            <XCircle className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{connection.name}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Payload CMS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {connection.base_url}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              testConnection.mutate(connection.id);
            }}
            disabled={testConnection.isPending}
          >
            {testConnection.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Link2 className="size-3" />
            )}
            {t("connectionCard.test")}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              deleteConnection.mutate(connection.id);
            }}
            title={t("connectionCard.deleteConnection")}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
          {isSelected ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded: Collection browser */}
      {isSelected && (
        <CollectionBrowser
          projectId={projectId}
          connectionId={connection.id}
        />
      )}
    </div>
  );
}

// ── Collection Browser ──────────────────────────────────────────────────

function CollectionBrowser({
  projectId,
  connectionId,
}: {
  projectId: number;
  connectionId: number;
}) {
  const t = useTranslations("cms");
  const { data: collections, isLoading, isError, error } = useCollections(projectId, connectionId);
  const syncCollection = useSyncCollection(projectId);
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null);

  const handleSync = (slug: string) => {
    setSyncingSlug(slug);
    syncCollection.mutate(
      { connectionId, data: { collection_slug: slug } },
      { onSettled: () => setSyncingSlug(null) },
    );
  };

  return (
    <div className="p-3 bg-muted/20 space-y-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {t("collections.title")}
      </h5>
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("collections.loading")}
        </div>
      ) : isError ? (
        <div className="text-sm text-destructive py-2">
          {error instanceof Error ? error.message : t("collections.errorLoading")}
        </div>
      ) : !collections || collections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {t("collections.noCollections")}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {collections.map((col: PayloadCollection) => {
            const isSyncing = syncingSlug === col.slug;
            return (
              <div
                key={col.slug}
                className="flex items-center justify-between border rounded-lg p-3 bg-background gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{col.label}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                      {col.slug}
                    </Badge>
                    {col.totalDocs !== undefined && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {col.totalDocs} docs
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1.5 shrink-0"
                  onClick={() => handleSync(col.slug)}
                  disabled={syncCollection.isPending}
                >
                  {isSyncing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Download className="size-3" />
                  )}
                  {t("collections.sync")}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dataset Row ─────────────────────────────────────────────────────────

function DatasetRow({
  dataset,
  projectId,
  isPreview,
  onTogglePreview,
}: {
  dataset: CmsDataset;
  projectId: number;
  isPreview: boolean;
  onTogglePreview: () => void;
}) {
  const t = useTranslations("cms");
  const deleteDataset = useDeleteDataset(projectId);
  const syncCollection = useSyncCollection(projectId);

  const handleResync = () => {
    syncCollection.mutate({
      connectionId: dataset.connection_id,
      data: { collection_slug: dataset.collection_slug },
    });
  };

  return (
    <div className="flex items-center gap-3 border rounded-lg p-3 bg-background">
      <div className="relative shrink-0">
        <Table2 className="size-4 text-primary" />
        <Sparkles className="size-2.5 text-amber-500 absolute -top-1 -right-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{dataset.collection_slug}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {dataset.record_count} {t("dataset.records")}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
            {t("aiContext.active")}
          </Badge>
        </div>
        {dataset.synced_at && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {t("dataset.syncedAt")}: {new Date(dataset.synced_at).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onTogglePreview}
          title={t("dataset.previewData")}
          className={isPreview ? "text-primary" : ""}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleResync}
          title={t("dataset.resync")}
          disabled={syncCollection.isPending}
        >
          {syncCollection.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => deleteDataset.mutate(dataset.id)}
          title={t("dataset.deleteDataset")}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Data Preview Dialog ─────────────────────────────────────────────────

function DataPreviewDialog({
  projectId,
  datasetId,
  open,
  onOpenChange,
}: {
  projectId: number;
  datasetId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("cms");
  const { data: dataset, isLoading } = useDataset(projectId, datasetId ?? 0);

  const hasData = dataset?.data && dataset.data.length > 0;
  const columns = hasData
    ? Object.keys(dataset.data![0]).filter(
        (k) => typeof dataset.data![0][k] !== "object",
      )
    : [];
  const displayColumns = columns.slice(0, 8);
  const previewRows = hasData ? dataset.data!.slice(0, 30) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="size-5 text-primary" />
            {dataset?.collection_slug ?? t("preview.preview")}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {hasData && (
              <>
                {t("preview.preview")} — 
                <Badge variant="secondary" className="text-[10px]">
                  {previewRows.length}/{dataset!.record_count} {t("dataset.records")}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasData ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {t("preview.noData")}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      {displayColumns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap border-b"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t hover:bg-muted/20 transition-colors"
                      >
                        {displayColumns.map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2 whitespace-nowrap max-w-[250px] truncate"
                          >
                            {String(row[col] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
