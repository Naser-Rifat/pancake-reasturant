import { Bell, Check, ChefHat, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AdminOrder } from "@/lib/admin-api";
import { ORDER_STATUSES } from "../../status";

// One order row in the kitchen orders table.
export function OrderRow({
  o,
  highlighted,
  onSetStatus,
}: {
  o: AdminOrder;
  highlighted: boolean;
  onSetStatus: (o: AdminOrder, status: AdminOrder["status"]) => void;
}) {
  const placedDate = new Date(o.created_at);
  const orderRef = o.public_id ? o.public_id.slice(0, 8).toUpperCase() : "";

  return (
    <tr
      id={`row-${o.public_id}`}
      className={`transition-colors ${highlighted ? "bg-amber-100" : "hover:bg-zinc-50"}`}
    >
      {/* Customer Info & Order Reference */}
      <td className="py-3.5 px-4 min-w-[220px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {orderRef && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                #{orderRef}
              </span>
            )}
            <span className="font-semibold text-sm text-[#211a14]">{o.customer_name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            {o.phone ? (
              <a
                href={`tel:${o.phone}`}
                className="flex items-center gap-1 text-[#763a12] font-bold hover:underline"
              >
                <Phone className="h-3 w-3 text-emerald-600" />
                {o.phone}
              </a>
            ) : o.email ? (
              <span className="flex items-center gap-1 text-zinc-600">
                <Mail className="h-3 w-3 text-blue-500" />
                {o.email}
              </span>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </div>
        </div>
      </td>

      {/* Items Ordered & Notes */}
      <td className="py-3.5 px-4 min-w-[280px] max-w-md">
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {o.items.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-[#763a12] shadow-2xs"
              >
                <span className="text-amber-800 font-extrabold">{item.quantity}×</span>
                <span>{item.name}</span>
              </span>
            ))}
          </div>
          {/* Customer Kitchen Notes */}
          {o.notes && (
            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] font-bold flex items-start gap-1.5">
              <span className="line-clamp-2">
                <strong>Guest Note:</strong> &ldquo;{o.notes}&rdquo;
              </span>
            </div>
          )}
          {/* Cancellation Reason */}
          {o.status === "cancelled" && o.cancel_reason && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-bold flex items-start gap-1.5">
              <span>
                <strong>Cancellation Reason:</strong> &ldquo;{o.cancel_reason}&rdquo;
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Total Amount */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        <span className="text-sm font-semibold text-[#763a12] px-2.5 py-1 rounded-xl bg-white border border-zinc-200">
          ${o.total}
        </span>
      </td>

      {/* Placed At */}
      <td className="py-3.5 px-3 whitespace-nowrap text-zinc-600">
        <div className="space-y-0.5">
          <div className="font-bold text-xs text-[#211a14]">
            {placedDate.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
          </div>
          <div className="text-[10px] text-zinc-400">
            {placedDate.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
          </div>
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
            o.status === "received"
              ? "bg-amber-100 text-amber-950 border border-amber-300"
              : o.status === "preparing"
              ? "bg-orange-100 text-orange-950 border border-orange-300"
              : o.status === "ready"
              ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
              : o.status === "completed"
              ? "bg-zinc-100 text-zinc-700 border border-zinc-300"
              : "bg-rose-100 text-rose-950 border border-rose-300"
          }`}
        >
          {o.status === "received"
            ? "Received"
            : o.status === "preparing"
            ? "Preparing"
            : o.status === "ready"
            ? "Ready"
            : o.status === "completed"
            ? "Completed"
            : "Cancelled"}
        </span>
      </td>

      {/* One-Tap Kitchen Flow Action */}
      <td className="py-3.5 px-3 text-center whitespace-nowrap">
        {o.status === "received" ? (
          <Button
            size="sm"
            className="h-8 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs"
            onClick={() => onSetStatus(o, "preparing")}
          >
            <ChefHat className="h-3.5 w-3.5 mr-1" /> Start Prep
          </Button>
        ) : o.status === "preparing" ? (
          <Button
            size="sm"
            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            onClick={() => onSetStatus(o, "ready")}
          >
            <Bell className="h-3.5 w-3.5 mr-1" /> Mark Ready
          </Button>
        ) : o.status === "ready" ? (
          <Button
            size="sm"
            className="h-8 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl shadow-xs"
            onClick={() => onSetStatus(o, "completed")}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Complete
          </Button>
        ) : (
          <span className="text-zinc-300 font-bold">—</span>
        )}
      </td>

      {/* Manual Status Override */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <Select
          aria-label={`Status of ${o.customer_name}'s order`}
          className="h-8 text-xs border-zinc-300 font-bold rounded-xl w-28 bg-white"
          value={o.status}
          onChange={(e) => onSetStatus(o, e.target.value as AdminOrder["status"])}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </td>
    </tr>
  );
}
