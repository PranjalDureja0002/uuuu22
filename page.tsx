"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Required } from "@/components/ui/required";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MultiTaxonomyPicker,
  SingleTaxonomySelect,
} from "@/components/brand/taxonomy-select";
import type { EngagementDetail, SessionUser, Taxonomy } from "@/types";

interface SingleField { valueId: string; customText: string }
const emptySingle: SingleField = { valueId: "", customText: "" };
interface MultiField { selectedIds: string[]; customs: string[] }
const emptyMulti: MultiField = { selectedIds: [], customs: [] };

export default function EditEngagementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const engagementId = params.id;

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [eng, setEng] = useState<EngagementDetail | null>(null);
  const [taxonomies, setTaxonomies] = useState<Record<string, Taxonomy>>({});
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAnonymised, setClientAnonymised] = useState(false);
  const [industry, setIndustry] = useState<SingleField>(emptySingle);
  const [func, setFunc] = useState<SingleField>(emptySingle);
  const [useCase, setUseCase] = useState<SingleField>(emptySingle);
  const [platform, setPlatform] = useState<MultiField>(emptyMulti);
  const [techStack, setTechStack] = useState<MultiField>(emptyMulti);
  const [cloud, setCloud] = useState<MultiField>(emptyMulti);
  const [summary, setSummary] = useState("");
  const [outcomes, setOutcomes] = useState("");

  useEffect(() => {
    api
      .get<SessionUser | null>("/api/auth/me")
      .then((u) => {
        if (!u) router.replace(`/upload/login?next=/upload/engagements/${engagementId}/edit`);
        else setUser(u);
      })
      .catch(() => router.replace("/upload/login"));

    api
      .get<EngagementDetail>(`/api/engagements/${engagementId}`)
      .then(setEng)
      .catch(() => null);

    api.get<Taxonomy[]>("/api/taxonomies").then((rows) => {
      const map: Record<string, Taxonomy> = {};
      for (const t of rows) map[t.name] = t;
      setTaxonomies(map);
    });
  }, [engagementId, router]);

  // Pre-fill form once engagement + taxonomies load.
  useEffect(() => {
    if (!eng || Object.keys(taxonomies).length === 0) return;

    setName(eng.name);
    setClientName(eng.client_name || "");
    setClientAnonymised(eng.client_anonymised);
    setSummary(eng.full_summary || "");
    setOutcomes(eng.business_outcomes || "");

    function findId(taxonomyName: string, displayValue: string | null): string {
      if (!displayValue) return "";
      const t = taxonomies[taxonomyName];
      if (!t) return "";
      const match = t.values.find((v) => v.value === displayValue);
      return match?.id || "";
    }
    function findIds(taxonomyName: string, displayValues: string[]): string[] {
      const t = taxonomies[taxonomyName];
      if (!t) return [];
      return displayValues
        .map((dv) => t.values.find((v) => v.value === dv)?.id)
        .filter((id): id is string => Boolean(id));
    }

    setIndustry({ valueId: findId("industry", eng.industry), customText: "" });
    setFunc({ valueId: findId("function", eng.function), customText: "" });
    setUseCase({ valueId: findId("use_case", eng.use_case), customText: "" });
    setPlatform({ selectedIds: findIds("platform", eng.platforms), customs: [] });
    setTechStack({ selectedIds: findIds("tech_stack", eng.tech_stack), customs: [] });
    setCloud({ selectedIds: findIds("cloud_provider", eng.cloud_providers), customs: [] });
  }, [eng, taxonomies]);

  if (user === undefined || !eng) {
    return (
      <section className="container py-20">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="mt-4 h-6 w-1/2" />
      </section>
    );
  }
  if (!user) return null;

  const canEdit = user.is_admin || eng.created_by_username === user.username;
  if (!canEdit) {
    return (
      <section className="container py-20">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Not authorised</h1>
        <p className="mt-3 max-w-xl text-pwc-steel">
          Only the engagement creator or an admin can edit this engagement.
        </p>

        <div className="mt-8 max-w-xl border border-pwc-mist bg-pwc-cream p-5 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-pwc-steel">
            Why this failed
          </div>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-pwc-steel">Signed in as</dt>
              <dd className="font-mono font-medium text-pwc-ink">{user.username}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-pwc-steel">Your admin status</dt>
              <dd className="font-mono font-medium text-pwc-ink">
                {user.is_admin ? "yes" : "no"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-pwc-steel">Engagement creator</dt>
              <dd className="font-mono font-medium text-pwc-ink">
                {eng.created_by_username ?? "(not recorded)"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={`/engagements/${engagementId}`}
            className="inline-flex items-center gap-2 border border-pwc-mist bg-white px-5 py-2.5 text-sm font-medium text-pwc-ink hover:border-pwc-orange hover:text-pwc-orange"
          >
            Back to engagement
          </a>
          <a
            href="/upload/login"
            className="inline-flex items-center gap-2 bg-pwc-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-pwc-orange"
          >
            Sign in as a different user
          </a>
        </div>

        <p className="mt-6 max-w-xl text-xs text-pwc-steel">
          If the engagement&apos;s creator field is blank or shows a username you don&apos;t
          recognise, ask an admin to update it or just delete and re-create the engagement
          under your account.
        </p>
      </section>
    );
  }

  function singleToPayload(field: SingleField) {
    if (field.valueId && field.valueId !== "__other__") return { value_id: field.valueId, custom: null };
    if (field.customText.trim()) return { value_id: null, custom: field.customText.trim() };
    return { value_id: null, custom: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Engagement name is required");
      return;
    }

    const ind = singleToPayload(industry);
    const fnc = singleToPayload(func);
    const uc = singleToPayload(useCase);

    setSubmitting(true);
    try {
      await api.patch(`/api/upload/engagements/${engagementId}`, {
        name,
        client_name: clientName || null,
        client_anonymised: clientAnonymised,
        industry_value_id: ind.value_id,
        industry_custom: ind.custom,
        function_value_id: fnc.value_id,
        function_custom: fnc.custom,
        use_case_value_id: uc.value_id,
        use_case_custom: uc.custom,
        platform_value_ids: platform.selectedIds,
        platform_custom: platform.customs,
        tech_stack_value_ids: techStack.selectedIds,
        tech_stack_custom: techStack.customs,
        cloud_provider_value_ids: cloud.selectedIds,
        cloud_provider_custom: cloud.customs,
        summary: summary || null,
        business_outcomes: outcomes || null,
      });
      toast.success("Engagement updated");
      router.push(`/engagements/${engagementId}`);
      router.refresh();
    } catch (err) {
      toast.error("Could not update", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="border-b border-pwc-mist bg-white">
        <div className="container py-12">
          <div className="pwc-eyebrow">Edit engagement</div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tightest md:text-5xl">
            {eng.name}
          </h1>
          <p className="mt-3 text-pwc-steel">
            Update metadata and tags. Assets, lessons, and team members are managed separately.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <form onSubmit={handleSubmit} className="grid gap-12 md:grid-cols-12">
          <div className="space-y-12 md:col-span-8">
            <fieldset className="space-y-5">
              <legend className="font-display text-xl font-semibold tracking-tight">Identity</legend>
              <div>
                <Label>Engagement name <Required /></Label>
                <Input className="mt-2" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Client name</Label>
                  <Input className="mt-2" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <label className="mt-7 flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={clientAnonymised}
                    onChange={(e) => setClientAnonymised(e.currentTarget.checked)}
                  />
                  Show client name only as &quot;Industry client&quot; publicly
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="font-display text-xl font-semibold tracking-tight">Classification</legend>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <Label>Industry</Label>
                  <SingleTaxonomySelect
                    className="mt-2"
                    values={taxonomies.industry?.values || []}
                    valueId={industry.valueId}
                    customText={industry.customText}
                    onChange={setIndustry}
                  />
                </div>
                <div>
                  <Label>Function</Label>
                  <SingleTaxonomySelect
                    className="mt-2"
                    values={taxonomies.function?.values || []}
                    valueId={func.valueId}
                    customText={func.customText}
                    onChange={setFunc}
                  />
                </div>
                <div>
                  <Label>Use case</Label>
                  <SingleTaxonomySelect
                    className="mt-2"
                    values={taxonomies.use_case?.values || []}
                    valueId={useCase.valueId}
                    customText={useCase.customText}
                    onChange={setUseCase}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-7">
              <legend className="font-display text-xl font-semibold tracking-tight">Tech context</legend>
              <div>
                <Label>Platforms</Label>
                <MultiTaxonomyPicker
                  className="mt-3"
                  values={taxonomies.platform?.values || []}
                  selectedIds={platform.selectedIds}
                  customs={platform.customs}
                  onChange={setPlatform}
                />
              </div>
              <div>
                <Label>Tech stack</Label>
                <MultiTaxonomyPicker
                  className="mt-3"
                  values={taxonomies.tech_stack?.values || []}
                  selectedIds={techStack.selectedIds}
                  customs={techStack.customs}
                  onChange={setTechStack}
                />
              </div>
              <div>
                <Label>Cloud provider</Label>
                <MultiTaxonomyPicker
                  className="mt-3"
                  values={taxonomies.cloud_provider?.values || []}
                  selectedIds={cloud.selectedIds}
                  customs={cloud.customs}
                  onChange={setCloud}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="font-display text-xl font-semibold tracking-tight">Story</legend>
              <div>
                <Label>Summary</Label>
                <Textarea className="mt-2" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div>
                <Label>Business outcomes</Label>
                <Textarea className="mt-2" rows={3} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
              </div>
            </fieldset>
          </div>

          <aside className="md:col-span-4">
            <div className="sticky top-[120px] space-y-6">
              <Button type="submit" disabled={submitting} className="w-full" size="lg" variant="primary">
                <Save className="h-4 w-4" />
                {submitting ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                onClick={() => router.push(`/engagements/${engagementId}`)}
                disabled={submitting}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
              <p className="text-xs text-pwc-steel">
                Changes are logged in the audit trail with your username and a timestamp.
              </p>
            </div>
          </aside>
        </form>
      </section>
    </>
  );
}
