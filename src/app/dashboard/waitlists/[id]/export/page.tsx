import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ExportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, plan")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Export</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSV</CardTitle>
            <CardDescription>
              Export your subscribers as a CSV file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/api/waitlists/${id}/export?format=csv`}>
              <Button>Export CSV</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>XLSX</CardTitle>
            <CardDescription>
              Export your subscribers as an Excel file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/api/waitlists/${id}/export?format=xlsx`}>
              <Button variant="outline">Export XLSX</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
