"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Purchase = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  created_at: string;
  status: string;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!account) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("purchases")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false });

      setPurchases(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Purchases & receipts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : purchases && purchases.length > 0 ? (
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
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-base mb-3">
                🧾
              </div>
              <p className="text-sm text-muted-foreground">No purchases yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
