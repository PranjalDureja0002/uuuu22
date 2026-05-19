"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

interface Props {
  engagementId: string;
  engagementName: string;
  createdByUsername: string | null;
  assetCount: number;
}

/**
 * Toolbar on the engagement detail page:
 *  - "Add asset"  -> visible to any logged-in uploader (contribution is open)
 *  - "Edit" + "Delete"  -> only for the engagement creator or an admin
 *
 * Returns null entirely when not signed in.
 */
export function EngagementActions({
  engagementId,
  engagementName,
  createdByUsername,
  assetCount,
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<SessionUser | null>("/api/auth/me")
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined || user === null) return null;

  const canEdit = user.is_admin || createdByUsername === user.username;

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/upload/engagements/${engagementId}`);
      toast.success("Engagement deleted");
      router.push("/search");
    } catch (e) {
      toast.error("Could not delete", { description: (e as Error).message });
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Add asset — open to any logged-in uploader, this is the contribution path. */}
      <Link
        href={`/upload/engagements/${engagementId}/assets`}
        className="inline-flex items-center gap-2 bg-pwc-ink px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-pwc-orange"
      >
        <Plus className="h-3.5 w-3.5" />
        Add asset
      </Link>

      {/* Edit + Delete — creator or admin only. */}
      {canEdit && (
        <>
          <Link
            href={`/upload/engagements/${engagementId}/edit`}
            className="inline-flex items-center gap-2 border border-pwc-mist bg-white px-4 py-2 text-xs font-medium text-pwc-ink transition-colors hover:border-pwc-orange hover:text-pwc-orange"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 border border-pwc-mist bg-white px-4 py-2 text-xs font-medium text-pwc-rose transition-colors hover:border-pwc-rose hover:bg-pwc-rose hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 border-2 border-pwc-rose bg-pwc-rose/5 px-3 py-1.5 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-pwc-rose" />
              <span className="text-pwc-ink">
                Delete <strong>{engagementName}</strong>
                {assetCount > 0
                  ? ` and its ${assetCount} asset${assetCount === 1 ? "" : "s"}`
                  : ""}
                ?
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={handleDelete}
                className="h-7 px-3 text-xs"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="inline-flex h-7 w-7 items-center justify-center text-pwc-steel hover:text-pwc-ink"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
