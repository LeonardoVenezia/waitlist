"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { importTestimonials, type ImportTestimonialRow } from "@/lib/testimonials/actions";

const COLUMN_ALIASES: Record<keyof ImportTestimonialRow, string[]> = {
  name: ["name", "nombre", "author", "customer", "full_name", "fullname"],
  message: ["message", "quote", "testimonial", "text", "review", "content"],
  email: ["email", "correo", "e-mail"],
  company: ["company", "empresa", "organization", "organisation"],
  role: ["role", "title", "cargo", "position", "job_title", "jobtitle"],
  rating: ["rating", "stars", "score", "estrellas"],
  avatar_url: ["avatar_url", "avatar", "photo", "photo_url", "picture", "image"],
  website: ["website", "url", "site", "company_url", "web"],
  tags: ["tags", "etiquetas"],
};

function pick(row: Record<string, unknown>, keys: string[]): string {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) lower[k.trim().toLowerCase()] = v;
  for (const key of keys) {
    const v = lower[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

function mapRow(raw: Record<string, unknown>): ImportTestimonialRow {
  return {
    name: pick(raw, COLUMN_ALIASES.name),
    message: pick(raw, COLUMN_ALIASES.message),
    email: pick(raw, COLUMN_ALIASES.email),
    company: pick(raw, COLUMN_ALIASES.company),
    role: pick(raw, COLUMN_ALIASES.role),
    rating: pick(raw, COLUMN_ALIASES.rating),
    avatar_url: pick(raw, COLUMN_ALIASES.avatar_url),
    website: pick(raw, COLUMN_ALIASES.website),
    tags: pick(raw, COLUMN_ALIASES.tags),
  };
}

function isComplete(row: ImportTestimonialRow): boolean {
  return Boolean(row.name?.trim() && row.message?.trim());
}

export function ImportForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportTestimonialRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (raw.length === 0) {
        setError("No rows found in that file.");
        setRows([]);
        return;
      }
      const mapped = raw.map(mapRow);
      const valid = mapped.filter(isComplete);
      if (valid.length === 0) {
        setError("No valid rows. Each row needs at least a name and a message.");
      }
      setRows(mapped);
    } catch {
      setError("Could not read that file. Use a CSV or Excel (.xlsx) file.");
      setRows([]);
    } finally {
      e.target.value = "";
    }
  }

  async function handleImport() {
    const valid = rows.filter(isComplete);
    if (valid.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importTestimonials(projectId, valid);
      setResult(res);
      setRows([]);
      setFileName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter(isComplete).length;
  const preview = rows.slice(0, 8);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Upload a file</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV or Excel. The first row must be the header. Recognized columns:{" "}
          <span className="font-medium text-foreground">name</span>,{" "}
          <span className="font-medium text-foreground">message</span> (or quote),{" "}
          <span className="font-medium text-foreground">email</span>,{" "}
          <span className="font-medium text-foreground">company</span>,{" "}
          <span className="font-medium text-foreground">role</span>,{" "}
          <span className="font-medium text-foreground">rating</span>,{" "}
          <span className="font-medium text-foreground">avatar_url</span>,{" "}
          <span className="font-medium text-foreground">website</span>,{" "}
          <span className="font-medium text-foreground">tags</span>.
        </p>
        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-10 hover:border-primary/50 transition-colors">
          <div className="text-center">
            <p className="text-sm font-medium">{fileName || "Choose a CSV or XLSX file"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Click to browse</p>
          </div>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          Imported testimonials are marked approved and public, and recorded as confirmed by you.
        </p>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Preview</h2>
            <span className="text-sm text-muted-foreground">
              {validCount} of {rows.length} rows ready
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Message</th>
                  <th className="py-2 pr-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => {
                  const complete = isComplete(r);
                  return (
                    <tr key={i} className={`border-t ${complete ? "" : "bg-red-50/50"}`}>
                      <td className="py-2 pr-4 align-top">
                        {r.name || <span className="text-red-600">missing</span>}
                      </td>
                      <td className="py-2 pr-4 align-top text-muted-foreground">
                        {r.message ? (
                          <span className="line-clamp-2">{r.message}</span>
                        ) : (
                          <span className="text-red-600">missing</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 align-top">{r.rating || 5}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > preview.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                +{rows.length - preview.length} more rows not shown.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? "Importing..." : `Import ${validCount} testimonials`}
            </Button>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setFileName("");
              }}
              disabled={importing}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Imported {result.inserted} testimonials
          {result.skipped > 0 ? ` · ${result.skipped} skipped (missing name/message).` : "."}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/projects/${projectId}/testimonials`)}
              className="font-medium underline"
            >
              View testimonials →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
