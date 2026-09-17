"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  MailCheck,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  AdminDataTable,
  AdminTablePagination,
  AdminTableSurface,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import {
  getClubMembers,
  getClubStats,
  updateClubMember,
  revokeClubConsent,
  deleteClubMember,
  type ClubMember,
} from "@/lib/admin-api";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ClubMembersPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    consent: "",
    page: 1,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((prev) =>
          prev.search === search.trim()
            ? prev
            : { ...prev, search: search.trim(), page: 1 }
        ),
      300
    );
    return () => clearTimeout(timer);
  }, [search]);

  const membersQuery = useQuery({
    queryKey: ["admin", "club", filters],
    queryFn: async () => {
      const [data, stats] = await Promise.all([
        getClubMembers(filters),
        getClubStats().catch(() => null),
      ]);
      return { data, stats };
    },
  });
  const data = membersQuery.data?.data ?? { count: 0, results: [] };
  const stats = membersQuery.data?.stats ?? null;
  const loading = membersQuery.isPending;
  const error = membersQuery.error instanceof Error ? membersQuery.error.message : "";

  const memberMutation = useMutation({
    mutationFn: async ({ member, action }: { member: ClubMember; action: "status" | "consent" | "delete" }) => {
      if (action === "delete") await deleteClubMember(member.id);
      else if (action === "consent") await revokeClubConsent(member.id);
      else await updateClubMember(member.id, member.status === "active" ? "archived" : "active");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
  const busy = memberMutation.isPending;

  async function manage(member: ClubMember, action: "status" | "consent" | "delete") {
    if (memberMutation.isPending) return;
    const removing = action === "delete";

    try {
      if (
        !(await confirm({
          title: removing
            ? `Delete ${member.name}?`
            : action === "consent"
            ? `Opt out ${member.name}?`
            : `${member.status === "active" ? "Archive" : "Restore"} ${member.name}?`,
          description: removing
            ? "This permanently deletes this registration and its consent record. This cannot be undone."
            : action === "consent"
            ? "Record this member’s request to stop marketing emails. Consent cannot be re-enabled from the admin."
            : "This changes registration status only. It does not alter email consent.",
          destructive: removing,
          confirmLabel: removing ? "Delete registration" : "Confirm",
        }))
      )
        return;

      await memberMutation.mutateAsync({ member, action });

      setFilters((prev) => ({ ...prev, page: 1 }));
      toast({
        variant: "success",
        title: removing ? "Registration deleted" : "Member updated",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Could not save changes",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  function exportCSV() {
    if (!data.results.length) return;
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Registration Status",
      "Marketing Consent",
      "Consented Date",
      "Privacy Version",
      "Joined Date",
    ];

    const rows = data.results.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email.replace(/"/g, '""')}"`,
      `"${(m.phone || "").replace(/"/g, '""')}"`,
      m.status,
      m.marketing_consent ? "Opted in" : "No marketing",
      m.marketing_consented_at ? date(m.marketing_consented_at) : "",
      m.consent_version,
      date(m.created_at),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pancake-club-members-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const cellClassName = "px-5 py-4 align-top";
  const columns: (AdminTableColumn<ClubMember> & {
    render: (row: ClubMember) => React.ReactNode;
  })[] = [
    {
      id: "member",
      header: "Member",
      cellClassName,
      headerClassName: "px-5 py-3",
      render: (m: ClubMember) => (
        <div>
          <p className="font-semibold text-zinc-900">{m.name}</p>
          <a
            className="mt-1 block text-xs text-zinc-600 hover:underline break-all"
            href={`mailto:${m.email}`}
          >
            {m.email}
          </a>
          {m.phone ? (
            <a
              className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:underline"
              href={`tel:${m.phone}`}
            >
              <Phone size={11} className="text-zinc-400" />
              {m.phone}
            </a>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cellClassName,
      headerClassName: "px-5 py-3",
      render: (m: ClubMember) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            m.status === "active"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}
        >
          {m.status === "active" ? (
            <CheckCircle2 size={12} className="text-emerald-600" />
          ) : (
            <XCircle size={12} className="text-zinc-400" />
          )}
          {m.status === "active" ? "Active" : "Archived"}
        </span>
      ),
    },
    {
      id: "consent",
      header: "Email Preference",
      cellClassName,
      headerClassName: "px-5 py-3",
      render: (m: ClubMember) => (
        <div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              m.marketing_consent ? "text-amber-800" : "text-zinc-500"
            }`}
          >
            {m.marketing_consent ? (
              <MailCheck size={14} className="text-amber-600" />
            ) : null}
            {m.marketing_consent ? "Opted in · unverified" : "No marketing"}
          </span>
          <p className="mt-1 text-xs text-zinc-500">
            {m.marketing_consented_at
              ? `Consent recorded ${date(m.marketing_consented_at)}`
              : "No marketing consent"}
          </p>
        </div>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      cellClassName,
      headerClassName: "px-5 py-3",
      render: (m: ClubMember) => (
        <div>
          <span className="whitespace-nowrap text-sm font-medium text-zinc-800">
            {date(m.created_at)}
          </span>
          <p
            className="mt-1 flex items-center gap-1 text-xs text-zinc-500"
            title={`Privacy accepted ${new Date(
              m.privacy_accepted_at
            ).toLocaleString("en-AU")}`}
          >
            <ShieldCheck size={12} className="text-zinc-400" />
            {m.consent_version}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cellClassName,
      headerClassName: "px-5 py-3 text-right",
      render: (m: ClubMember) => (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-44">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || loading}
            onClick={() => manage(m, "status")}
          >
            {m.status === "active" ? "Archive" : "Restore"}
          </Button>
          {m.marketing_consent && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy || loading}
              onClick={() => manage(m, "consent")}
            >
              Opt out
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-700 hover:bg-red-50 hover:text-red-800"
            disabled={busy || loading}
            onClick={() => manage(m, "delete")}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const totalCount = stats?.total ?? data.count;
  const activeCount =
    stats?.active ?? data.results.filter((r) => r.status === "active").length;
  const consentedCount =
    stats?.consented ?? data.results.filter((r) => r.marketing_consent).length;
  const consentRate =
    totalCount > 0 ? Math.round((consentedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#763a12]">
            <UsersRound size={16} /> The Pancake Club
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">Club Members</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage member registrations, view consent records, and respect preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={loading || !data.results.length}
            className="flex items-center gap-2"
          >
            <Download size={14} /> Export CSV
          </Button>
          <Link
            href="/join-our-club"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            View public page <ExternalLink size={14} />
          </Link>
        </div>
      </header>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Registrations
            </span>
            <UsersRound size={18} className="text-amber-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{totalCount}</p>
          <p className="mt-1 text-xs text-zinc-500">All registered club accounts</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Members
            </span>
            <UserCheck size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{activeCount}</p>
          <p className="mt-1 text-xs text-zinc-500">In good standing · unarchived</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Marketing Opt-in
            </span>
            <MailCheck size={18} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {consentedCount}{" "}
            <span className="text-sm font-normal text-zinc-500">
              ({consentRate}%)
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">Consented to receive news/offers</p>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-3 text-sm text-amber-950 flex items-center justify-between gap-4">
        <p>
          <strong>Privacy note:</strong> Registrations are recorded on explicit consent.
          This panel logs consent preferences only; archiving a member does not delete
          audit records.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-3 h-4 w-4 text-zinc-400"
            aria-hidden="true"
          />
          <Input
            className="pl-9 bg-white"
            aria-label="Search members"
            placeholder="Search name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter registration status"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#763a12]"
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
          }
        >
          <option value="">All statuses</option>
          <option value="active">Active only</option>
          <option value="archived">Archived only</option>
        </select>

        <select
          aria-label="Filter email marketing consent"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#763a12]"
          value={filters.consent}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, consent: e.target.value, page: 1 }))
          }
        >
          <option value="">All consent preferences</option>
          <option value="true">Marketing opted-in</option>
          <option value="false">No marketing</option>
        </select>
      </div>

      {/* Table Surface */}
      <AdminTableSurface aria-busy={loading}>
        {error ? (
          <div className="p-8 text-center">
            <p role="alert" className="mb-4 text-red-700 font-medium">
              {error}
            </p>
            <Button variant="outline" onClick={() => membersQuery.refetch()} loading={membersQuery.isFetching}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <p role="status" className="p-12 text-center text-zinc-500">
            Loading members…
          </p>
        ) : !data.results.length ? (
          <div className="p-12 text-center">
            <UsersRound className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <h2 className="font-semibold text-zinc-900">
              {filters.search || filters.status || filters.consent
                ? "No matching members"
                : "Your club starts here"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {filters.search || filters.status || filters.consent
                ? "Try a different search or filter combination."
                : "Registrations from Join Our Club will appear here."}
            </p>
          </div>
        ) : (
          <AdminDataTable
            rows={data.results}
            rowKey={(m) => m.id}
            columns={columns}
            rowClassName="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
          />
        )}

        <AdminTablePagination
          page={filters.page}
          pageSize={filters.pageSize}
          totalLoaded={data.count}
          loading={loading || busy}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) =>
            setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
          }
          summary={`${data.count} registration${
            data.count === 1 ? "" : "s"
          }${
            filters.search || filters.status || filters.consent
              ? " matching filters"
              : ""
          }`}
        />
      </AdminTableSurface>
    </div>
  );
}
