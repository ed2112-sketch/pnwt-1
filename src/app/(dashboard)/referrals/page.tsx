"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ReferralsPage() {
  const { data: referrals, isLoading } = trpc.referral.list.useQuery();

  const totalCodes = referrals?.length ?? 0;
  const totalConversions = referrals?.reduce(
    (sum, r) => sum + (r.conversions ?? 0),
    0
  ) ?? 0;
  const totalCredits = referrals?.reduce(
    (sum, r) => sum + (r.creditsEarned ?? 0),
    0
  ) ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Referrals</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Referral Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCodes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Credits Awarded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalCredits)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : referrals && referrals.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Credits Earned</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{ref.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.userEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {ref.code}
                  </TableCell>
                  <TableCell>{ref.conversions ?? 0}</TableCell>
                  <TableCell>{formatPrice(ref.creditsEarned ?? 0)}</TableCell>
                  <TableCell>
                    <Badge variant={ref.isActive ? "default" : "secondary"}>
                      {ref.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No referral codes yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
