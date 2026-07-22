import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountId } from "@/lib/api/account";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const accountId = await getAccountId(user.id);
  if (!accountId) return null;

  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Purchases & receipts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases && purchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="capitalize">{p.plan}</TableCell>
                    <TableCell>
                      {p.amount} {p.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="capitalize">{p.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
