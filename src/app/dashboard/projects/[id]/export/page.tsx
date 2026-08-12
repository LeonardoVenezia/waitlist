import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ExportPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ search?: string; verified?: string; date_from?: string; date_until?: string; email_status?: string }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, plan")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const params = new URLSearchParams();
  if (sp?.search) params.set("search", sp.search);
  if (sp?.verified) params.set("verified", sp.verified);
  if (sp?.date_from) params.set("date_from", sp.date_from);
  if (sp?.date_until) params.set("date_until", sp.date_until);
  if (sp?.email_status) params.set("email_status", sp.email_status);
  const filterQs = params.toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Export</h1>
        <a href={`/dashboard/projects/${id}/subscribers${filterQs ? "?" + filterQs : ""}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to subscribers
        </a>
      </div>

      {/* Active filters */}
      {filterQs && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Exporting with current filters.{" "}
          <a href={`/dashboard/projects/${id}/export`} className="text-primary hover:underline">
            Clear filters → export all
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSV</CardTitle>
            <CardDescription>Export your subscribers as a CSV file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href={`/api/projects/${id}/export?format=csv${filterQs ? "&" + filterQs : ""}`}>
                <Button className="w-full">All subscribers</Button>
              </a>
              <a href={`/api/projects/${id}/export?format=csv&verified=verified${filterQs ? "&" + filterQs : ""}`}>
                <Button variant="outline" className="w-full">Verified only</Button>
              </a>
              <a href={`/api/projects/${id}/export?format=csv&verified=unverified${filterQs ? "&" + filterQs : ""}`}>
                <Button variant="outline" className="w-full">Unverified only</Button>
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>XLSX</CardTitle>
            <CardDescription>Export your subscribers as an Excel file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href={`/api/projects/${id}/export?format=xlsx${filterQs ? "&" + filterQs : ""}`}>
                <Button className="w-full">All subscribers</Button>
              </a>
              <a href={`/api/projects/${id}/export?format=xlsx&verified=verified${filterQs ? "&" + filterQs : ""}`}>
                <Button variant="outline" className="w-full">Verified only</Button>
              </a>
              <a href={`/api/projects/${id}/export?format=xlsx&verified=unverified${filterQs ? "&" + filterQs : ""}`}>
                <Button variant="outline" className="w-full">Unverified only</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
