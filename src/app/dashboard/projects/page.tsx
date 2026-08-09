import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .limit(1);

  if (projects && projects.length > 0) {
    redirect(`/dashboard/projects/${projects[0].id}`);
  }

  redirect("/dashboard/projects/new");
}
