"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  Sparkles,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Required } from "@/components/ui/required";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MultiTaxonomyPicker } from "@/components/brand/taxonomy-select";
import { cn } from "@/lib/utils";
import type { AssetSummary, EngagementDetail, SessionUser, Taxonomy } from "@/types";

interface MultiField {
  selectedIds: string[];
  customs: string[];
}
const emptyMulti: MultiField = { selectedIds: [], customs: [] };

export default function AddAssetsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const engagementId = params.id;

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [engagement, setEngagement] = useState<EngagementDetail | null>(null);
  const [taxonomies, setTaxonomies] = useState<Record<string, Taxonomy>>({});

  const [contribName, setContribName] = useState("");
  const [contribEmail, setContribEmail] = useState("");
  const [contribOrg, setContribOrg] = useState("PwC India");

  const [mode, setMode] = useState<string>("single");

  useEffect(() => {
    api
      .get<SessionUser | null>("/api/auth/me")
      .then((u) => {
        if (!u) router.replace(`/upload/login?next=/upload/engagements/${engagementId}/assets`);
        else {
          setUser(u);
          setContribName(u.full_name);
          setContribEmail(u.email);
        }
      });
    api.get<EngagementDetail>(`/api/engagements/${engagementId}`).then(setEngagement).catch(() => null);
    api.get<Taxonomy[]>("/api/taxonomies").then((rows) => {
      const map: Record<string, Taxonomy> = {};
      for (const t of rows) map[t.name] = t;
      setTaxonomies(map);
    });
  }, [engagementId, router]);

  if (user === undefined || !engagement) {
    return (
      <section className="container py-20">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="mt-4 h-6 w-1/2" />
      </section>
    );
  }
  if (!user) return null;

  function refreshEngagement() {
    api.get<EngagementDetail>(`/api/engagements/${engagementId}`).then(setEngagement).catch(() => null);
  }

  return (
    <>
      <section className="border-b border-pwc-mist bg-white">
        <div className="container py-12">
          <Link
            href={`/engagements/${engagementId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-pwc-steel transition-colors hover:text-pwc-orange"
          >
            <ExternalLink className="h-3 w-3" />
            View engagement page
          </Link>
          <div className="pwc-eyebrow mt-4">Add asset</div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tightest md:text-5xl">
            {engagement.name}
          </h1>
          <p className="mt-2 text-pwc-steel">{engagement.client_display}</p>
        </div>
      </section>

      <section className="container grid gap-12 py-10 md:grid-cols-12">
        <div className="md:col-span-8">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="single">
                <FileText className="mr-2 inline h-4 w-4" />
                Single asset
              </TabsTrigger>
              <TabsTrigger value="bulk">
                <Layers className="mr-2 inline h-4 w-4" />
                Bulk upload
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 className="mr-2 inline h-4 w-4" />
                Add link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <SingleAssetForm
                engagementId={engagementId}
                taxonomies={taxonomies}
                contribName={contribName}
                contribEmail={contribEmail}
                contribOrg={contribOrg}
                onUploaded={refreshEngagement}
              />
            </TabsContent>

            <TabsContent value="bulk">
              <BulkAssetForm
                engagementId={engagementId}
                taxonomies={taxonomies}
                contribName={contribName}
                contribEmail={contribEmail}
                contribOrg={contribOrg}
                onUploaded={refreshEngagement}
              />
            </TabsContent>

            <TabsContent value="link">
              <LinkAssetForm
                engagementId={engagementId}
                taxonomies={taxonomies}
                contribName={contribName}
                contribEmail={contribEmail}
                contribOrg={contribOrg}
                onUploaded={refreshEngagement}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail */}
        <aside className="md:col-span-4">
          <div className="sticky top-[120px] space-y-8">
            <div className="border border-pwc-mist bg-white p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-pwc-orange">
                Your attribution
              </div>
              <p className="mt-3 text-sm text-pwc-steel">
                This name and email are recorded permanently with each asset you upload.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="cn">Full name <Required /></Label>
                  <Input id="cn" required value={contribName} onChange={(e) => setContribName(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="ce">Email <Required /></Label>
                  <Input id="ce" type="email" required value={contribEmail} onChange={(e) => setContribEmail(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="co">Organisation</Label>
                  <Input id="co" value={contribOrg} onChange={(e) => setContribOrg(e.target.value)} className="mt-2" />
                </div>
              </div>
            </div>

            {engagement.assets.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-pwc-steel">
                  Already in this engagement ({engagement.assets.length})
                </div>
                <ul className="mt-3 space-y-2">
                  {engagement.assets.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      {a.storage_kind === "external_link" ? (
                        <Link2 className="h-3.5 w-3.5 text-pwc-orange" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-pwc-orange" />
                      )}
                      <span className="truncate">{a.title}</span>
                    </li>
                  ))}
                  {engagement.assets.length > 8 && (
                    <li className="text-xs text-pwc-smoke">+ {engagement.assets.length - 8} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="border-t border-pwc-mist pt-4">
              <Link href={`/engagements/${engagementId}`} className="inline-flex items-center gap-1 text-sm text-pwc-orange hover:underline">
                Done — view engagement page
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

// ---------- Single asset form ----------

function SingleAssetForm({
  engagementId,
  taxonomies,
  contribName,
  contribEmail,
  contribOrg,
  onUploaded,
}: {
  engagementId: string;
  taxonomies: Record<string, Taxonomy>;
  contribName: string;
  contribEmail: string;
  contribOrg: string;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [tags, setTags] = useState<MultiField>(emptyMulti);
  const [aiBusy, setAiBusy] = useState<{ title?: boolean; tags?: boolean }>({});
  const [aiTitle, setAiTitle] = useState<{ title?: string; description?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function callAI(kind: "title" | "tags") {
    if (!file) {
      toast.error("Pick a file first");
      return;
    }
    setAiBusy((s) => ({ ...s, [kind]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (kind === "tags") {
        fd.append("title", title);
        fd.append("description", description);
      }
      const endpoint = kind === "title" ? "/api/upload/ai/title-draft" : "/api/upload/ai/tag-suggest";
      const result = await api.postForm<{ feature: string; suggestions: Record<string, unknown> }>(endpoint, fd);
      const s = result.suggestions || {};
      if (kind === "title") {
        setAiTitle(s as { title?: string; description?: string });
      } else {
        const allSuggested: string[] = [];
        for (const cat of Object.values(s) as unknown[]) {
          if (Array.isArray(cat)) cat.forEach((id) => allSuggested.push(String(id)));
        }
        setTags((t) => ({
          ...t,
          selectedIds: Array.from(new Set([...t.selectedIds, ...allSuggested])),
        }));
        const ats = (s as Record<string, string[]>).asset_type;
        if (ats && ats[0]) setAssetTypeId(ats[0]);
        toast.success("Tags suggested", {
          description: `${allSuggested.length} tag${allSuggested.length === 1 ? "" : "s"} added — review below.`,
        });
      }
    } catch (e) {
      toast.error("AI suggestion failed", { description: (e as Error).message });
    } finally {
      setAiBusy((s) => ({ ...s, [kind]: false }));
    }
  }

  function applyAITitle() {
    if (aiTitle?.title) setTitle(aiTitle.title);
    if (aiTitle?.description) setDescription(aiTitle.description);
    setAiTitle(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pick a file first");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      if (description) fd.append("description", description);
      if (assetTypeId) fd.append("asset_type_value_id", assetTypeId);
      fd.append("sensitivity_tier", "public_to_practice");
      fd.append("tag_value_ids", tags.selectedIds.join(","));
      fd.append("custom_tags", tags.customs.join(","));
      fd.append("contributor_full_name", contribName);
      fd.append("contributor_email", contribEmail);
      if (contribOrg) fd.append("contributor_organisation", contribOrg);

      const asset = await api.postForm<AssetSummary>(
        `/api/upload/engagements/${engagementId}/assets`,
        fd
      );
      toast.success("Asset uploaded", { description: asset.title });
      setFile(null);
      setTitle("");
      setDescription("");
      setAssetTypeId("");
      setTags(emptyMulti);
      setAiTitle(null);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const tagPickerValues = [
    ...(taxonomies.industry?.values || []),
    ...(taxonomies.function?.values || []),
    ...(taxonomies.use_case?.values || []),
    ...(taxonomies.platform?.values || []),
    ...(taxonomies.tech_stack?.values || []),
    ...(taxonomies.cloud_provider?.values || []),
    ...(taxonomies.keyword?.values || []),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <FilePicker file={file} onChange={setFile} fileRef={fileRef} multiple={false} />

      {file && (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={aiBusy.title} onClick={() => callAI("title")}>
            <Sparkles className="h-4 w-4 text-pwc-orange" />
            {aiBusy.title ? "Drafting…" : "AI: draft title & description"}
          </Button>
          <Button type="button" variant="outline" disabled={aiBusy.tags} onClick={() => callAI("tags")}>
            <Sparkles className="h-4 w-4 text-pwc-orange" />
            {aiBusy.tags ? "Suggesting…" : "AI: suggest tags"}
          </Button>
        </div>
      )}

      {aiTitle && (
        <div className="border-l-4 border-pwc-orange bg-pwc-orange-soft p-5 animate-fade-up">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-pwc-burgundy">AI suggestion</div>
          <div className="mt-3">
            <div className="font-display text-lg font-semibold tracking-tight">{aiTitle.title}</div>
            <p className="mt-1 text-sm text-pwc-steel">{aiTitle.description}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" size="sm" variant="primary" onClick={applyAITitle}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Apply
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAiTitle(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-semibold tracking-tight">Metadata</legend>

        <div>
          <Label>Title <Required /></Label>
          <Input className="mt-2" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Asset type</Label>
          <Select className="mt-2" value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)}>
            <option value="">Select…</option>
            {(taxonomies.asset_type?.values || []).map((v) => (
              <option key={v.id} value={v.id}>{v.value}</option>
            ))}
          </Select>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-semibold tracking-tight">Tags</legend>
        <p className="mt-1 text-sm text-pwc-steel">
          Tags help others find this asset. Use AI to draft, then refine. Type your own at the bottom.
        </p>
        <MultiTaxonomyPicker
          className="mt-4"
          values={tagPickerValues}
          selectedIds={tags.selectedIds}
          customs={tags.customs}
          onChange={setTags}
        />
      </fieldset>

      <Button type="submit" disabled={submitting || !file} size="lg" className="w-full md:w-auto">
        {submitting ? "Uploading…" : (
          <>
            Upload asset
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ---------- Bulk asset form ----------

interface BulkRow {
  file: File;
  title: string;
  state: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function BulkAssetForm({
  engagementId,
  taxonomies,
  contribName,
  contribEmail,
  contribOrg,
  onUploaded,
}: {
  engagementId: string;
  taxonomies: Record<string, Taxonomy>;
  contribName: string;
  contribEmail: string;
  contribOrg: string;
  onUploaded: () => void;
}) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [sharedDescription, setSharedDescription] = useState("");
  const [sharedAssetTypeId, setSharedAssetTypeId] = useState("");
  const [sharedTags, setSharedTags] = useState<MultiField>(emptyMulti);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: BulkRow[] = Array.from(files).map((f) => ({
      file: f,
      title: stripExtension(f.name),
      state: "pending" as const,
    }));
    setRows((prev) => [...prev, ...next]);
  }

  function updateTitle(idx: number, title: string) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, title } : r)));
  }

  function removeRow(idx: number) {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pending = rows.filter((r) => r.state === "pending" || r.state === "error");
    if (pending.length === 0) {
      toast.error("Add at least one file");
      return;
    }
    setSubmitting(true);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.state === "done") continue;
      setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, state: "uploading" as const } : row)));
      try {
        const fd = new FormData();
        fd.append("file", r.file);
        fd.append("title", r.title || stripExtension(r.file.name));
        if (sharedDescription) fd.append("description", sharedDescription);
        if (sharedAssetTypeId) fd.append("asset_type_value_id", sharedAssetTypeId);
        fd.append("sensitivity_tier", "public_to_practice");
        fd.append("tag_value_ids", sharedTags.selectedIds.join(","));
        fd.append("custom_tags", sharedTags.customs.join(","));
        fd.append("contributor_full_name", contribName);
        fd.append("contributor_email", contribEmail);
        if (contribOrg) fd.append("contributor_organisation", contribOrg);

        await api.postForm<AssetSummary>(`/api/upload/engagements/${engagementId}/assets`, fd);
        setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, state: "done" as const } : row)));
        successCount++;
      } catch (err) {
        setRows((rs) =>
          rs.map((row, idx) =>
            idx === i ? { ...row, state: "error" as const, error: (err as Error).message } : row
          )
        );
        errorCount++;
      }
    }

    setSubmitting(false);
    onUploaded();
    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} asset${successCount === 1 ? "" : "s"} uploaded`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} succeeded · ${errorCount} failed`);
    } else {
      toast.error("All uploads failed", { description: "Check the row errors below." });
    }
  }

  const tagPickerValues = [
    ...(taxonomies.industry?.values || []),
    ...(taxonomies.function?.values || []),
    ...(taxonomies.use_case?.values || []),
    ...(taxonomies.platform?.values || []),
    ...(taxonomies.tech_stack?.values || []),
    ...(taxonomies.cloud_provider?.values || []),
    ...(taxonomies.keyword?.values || []),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <FilePicker
        file={null}
        onChange={() => null}
        fileRef={fileRef}
        multiple
        onMultipleChange={addFiles}
      />

      {rows.length > 0 && (
        <div className="border border-pwc-mist bg-white">
          <div className="flex items-center justify-between border-b border-pwc-mist px-5 py-3">
            <div className="text-sm font-semibold text-pwc-ink">
              {rows.length} file{rows.length === 1 ? "" : "s"} queued
            </div>
            <button type="button" onClick={() => setRows([])} className="text-xs text-pwc-steel hover:text-pwc-rose">
              Clear all
            </button>
          </div>
          <ul>
            {rows.map((r, i) => (
              <li key={`${r.file.name}-${i}`} className="grid grid-cols-12 items-center gap-3 border-b border-pwc-mist px-5 py-3 last:border-0">
                <div className="col-span-1">
                  <StatusBadge state={r.state} />
                </div>
                <div className="col-span-7">
                  <Input
                    value={r.title}
                    onChange={(e) => updateTitle(i, e.target.value)}
                    placeholder="Title"
                    className="h-9"
                    disabled={r.state === "uploading" || r.state === "done"}
                  />
                  <div className="mt-1 truncate text-[11px] text-pwc-smoke">
                    {r.file.name} · {(r.file.size / 1024).toFixed(0)} KB
                    {r.error ? <span className="ml-2 text-pwc-rose">{r.error}</span> : null}
                  </div>
                </div>
                <div className="col-span-3 text-right text-xs text-pwc-steel">
                  {r.file.type || "—"}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={r.state === "uploading"}
                    className="inline-flex items-center text-pwc-smoke hover:text-pwc-rose"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-semibold tracking-tight">Shared metadata</legend>
        <p className="text-sm text-pwc-steel">
          Applied to every file in the queue. Per-file titles can be edited above.
        </p>

        <div>
          <Label>Description (applied to all)</Label>
          <Textarea
            className="mt-2"
            rows={3}
            value={sharedDescription}
            onChange={(e) => setSharedDescription(e.target.value)}
            placeholder="One short description that fits all the files in this batch."
          />
        </div>

        <div>
          <Label>Asset type (applied to all)</Label>
          <Select className="mt-2" value={sharedAssetTypeId} onChange={(e) => setSharedAssetTypeId(e.target.value)}>
            <option value="">Select…</option>
            {(taxonomies.asset_type?.values || []).map((v) => (
              <option key={v.id} value={v.id}>{v.value}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Tags (applied to all)</Label>
          <MultiTaxonomyPicker
            className="mt-3"
            values={tagPickerValues}
            selectedIds={sharedTags.selectedIds}
            customs={sharedTags.customs}
            onChange={setSharedTags}
          />
        </div>
      </fieldset>

      <Button type="submit" disabled={submitting || rows.length === 0} size="lg" className="w-full md:w-auto">
        {submitting ? "Uploading…" : (
          <>
            Upload {rows.length} file{rows.length === 1 ? "" : "s"}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ---------- Link asset form ----------

function LinkAssetForm({
  engagementId,
  taxonomies,
  contribName,
  contribEmail,
  contribOrg,
  onUploaded,
}: {
  engagementId: string;
  taxonomies: Record<string, Taxonomy>;
  contribName: string;
  contribEmail: string;
  contribOrg: string;
  onUploaded: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [tags, setTags] = useState<MultiField>(emptyMulti);
  const [submitting, setSubmitting] = useState(false);

  function detectSource(u: string): string {
    const lower = u.toLowerCase();
    if (lower.includes("sharepoint.com")) return "SharePoint";
    if (lower.includes("onedrive") || lower.includes("1drv.ms")) return "OneDrive";
    if (lower.includes("github.com")) return "GitHub";
    if (lower.includes("drive.google.com")) return "Google Drive";
    if (lower.includes("dropbox.com")) return "Dropbox";
    return "External link";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }
    if (!url.toLowerCase().startsWith("http")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const asset = await api.post<AssetSummary>(
        `/api/upload/engagements/${engagementId}/assets/link`,
        {
          title,
          description: description || null,
          asset_type_value_id: assetTypeId || null,
          sensitivity_tier: "public_to_practice",
          tag_value_ids: tags.selectedIds,
          custom_tags: tags.customs,
          external_url: url,
          external_source: "link",
          contributor: {
            full_name: contribName,
            email: contribEmail,
            organisation: contribOrg || null,
          },
        }
      );
      toast.success("Link added", { description: asset.title });
      setUrl("");
      setTitle("");
      setDescription("");
      setAssetTypeId("");
      setTags(emptyMulti);
      onUploaded();
    } catch (err) {
      toast.error("Could not add link", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const tagPickerValues = [
    ...(taxonomies.industry?.values || []),
    ...(taxonomies.function?.values || []),
    ...(taxonomies.use_case?.values || []),
    ...(taxonomies.platform?.values || []),
    ...(taxonomies.tech_stack?.values || []),
    ...(taxonomies.cloud_provider?.values || []),
    ...(taxonomies.keyword?.values || []),
  ];

  const source = url ? detectSource(url) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="border-2 border-dashed border-pwc-mist bg-white p-8 transition-colors hover:border-pwc-orange">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link2 className="h-10 w-10 text-pwc-orange" />
          <div className="font-display text-xl font-semibold tracking-tight">Paste a link</div>
          <div className="text-sm text-pwc-steel">
            SharePoint, OneDrive, GitHub, Google Drive, Dropbox — anything reachable by URL.
          </div>
          <Input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourorg.sharepoint.com/sites/…"
            className="mt-4 h-11 max-w-2xl"
          />
          {source && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pwc-orange-soft px-3 py-1 text-xs font-medium text-pwc-burgundy">
              <Sparkles className="h-3 w-3" />
              Detected: {source}
            </div>
          )}
        </div>
      </div>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-semibold tracking-tight">Metadata</legend>
        <div>
          <Label>Title <Required /></Label>
          <Input className="mt-2" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Architecture diagram (SharePoint)" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Asset type</Label>
          <Select className="mt-2" value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)}>
            <option value="">Select…</option>
            {(taxonomies.asset_type?.values || []).map((v) => (
              <option key={v.id} value={v.id}>{v.value}</option>
            ))}
          </Select>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-semibold tracking-tight">Tags</legend>
        <p className="mt-1 text-sm text-pwc-steel">
          Same as files — pick from the list or type your own.
        </p>
        <MultiTaxonomyPicker
          className="mt-4"
          values={tagPickerValues}
          selectedIds={tags.selectedIds}
          customs={tags.customs}
          onChange={setTags}
        />
      </fieldset>

      <Button type="submit" disabled={submitting} size="lg" className="w-full md:w-auto">
        {submitting ? "Adding…" : (
          <>
            Add link asset
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ---------- Shared bits ----------

function StatusBadge({ state }: { state: BulkRow["state"] }) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4 text-pwc-orange" />;
  if (state === "uploading") return <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-pwc-orange" />;
  if (state === "error") return <X className="h-4 w-4 text-pwc-rose" />;
  return <span className="inline-block h-3 w-3 rounded-full border border-pwc-mist" />;
}

function FilePicker({
  file,
  onChange,
  fileRef,
  multiple = false,
  onMultipleChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  multiple?: boolean;
  onMultipleChange?: (files: FileList | null) => void;
}) {
  return (
    <div className="border-2 border-dashed border-pwc-mist bg-white p-8 transition-colors hover:border-pwc-orange">
      {!multiple && file ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-pwc-cream text-pwc-orange">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-pwc-steel">
                {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="inline-flex items-center gap-1 text-xs text-pwc-steel hover:text-pwc-rose"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-3 text-center">
          <UploadIcon className="h-10 w-10 text-pwc-orange" />
          <div className="font-display text-xl font-semibold tracking-tight">
            {multiple ? "Drop multiple files or click to browse" : "Drop a file or click to browse"}
          </div>
          <div className="text-sm text-pwc-steel">
            Any file type — PDF, DOCX, PPTX, XLSX, VSDX, MD, MP4, PNG, JPG, ZIP, code, and more.
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              if (multiple) {
                onMultipleChange?.(e.target.files);
                if (fileRef.current) fileRef.current.value = "";
              } else {
                onChange(e.target.files?.[0] ?? null);
              }
            }}
          />
        </label>
      )}
    </div>
  );
}

function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}
