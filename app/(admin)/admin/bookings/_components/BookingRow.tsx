import { Ban, Check, Mail, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminBooking } from "@/lib/admin-api";
import { formatTime12h } from "../_lib";

// One reservation row in the bookings table.
export function BookingRow({
  b,
  highlighted,
  onSetStatus,
}: {
  b: AdminBooking;
  highlighted: boolean;
  onSetStatus: (b: AdminBooking, status: AdminBooking["status"]) => void;
}) {
  return (
    <tr
      id={`row-${b.public_id}`}
      className={`transition-colors ${highlighted ? "bg-amber-100" : "hover:bg-zinc-50"}`}
    >
      {/* Guest Name & Contact */}
      <td className="py-3.5 px-4 min-w-[200px]">
        <div className="space-y-0.5">
          <div className="font-semibold text-sm text-[#211a14] whitespace-nowrap">{b.name}</div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            {b.email && (
              <span className="flex items-center gap-1 text-zinc-600">
                <Mail className="h-3 w-3 text-blue-500" />
                {b.email}
              </span>
            )}
            {b.phone && (
              <a
                href={`tel:${b.phone}`}
                className="flex items-center gap-1 text-[#763a12] font-bold hover:underline"
              >
                <Phone className="h-3 w-3 text-emerald-600" />
                {b.phone}
              </a>
            )}
          </div>
        </div>
      </td>

      {/* Date & Time */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-[#211a14]">
            {new Date(`${b.date}T00:00:00`).toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="text-[11px] font-bold text-[#763a12] bg-white border border-zinc-200 px-2 py-0.5 rounded-md inline-block">
            {formatTime12h(b.time)}
          </div>
        </div>
      </td>

      {/* Party Size */}
      <td className="py-3.5 px-3 text-center whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#763a12] border border-amber-200">
          <Users className="h-3 w-3" />
          {b.party_size} {b.party_size === 1 ? "Guest" : "Guests"}
        </span>
      </td>

      {/* Favourites & Notes */}
      <td className="py-3.5 px-4 max-w-xs">
        <div className="space-y-1">
          {b.preselected_dish && (
            <div className="flex flex-wrap gap-1">
              {b.preselected_dish.split(", ").map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-zinc-200 text-[#763a12]"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          {b.notes ? (
            <p className="text-[11px] text-zinc-600 line-clamp-2 italic">
              &ldquo;{b.notes}&rdquo;
            </p>
          ) : !b.preselected_dish ? (
            <span className="text-zinc-400 text-[11px]">—</span>
          ) : null}
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
            b.status === "confirmed"
              ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
              : b.status === "pending"
              ? "bg-amber-100 text-amber-950 border border-amber-300"
              : "bg-rose-100 text-rose-950 border border-rose-300"
          }`}
        >
          {b.status === "confirmed" ? "Confirmed" : b.status === "pending" ? "Pending" : "Cancelled"}
        </span>
      </td>

      {/* Action Buttons */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {b.status !== "confirmed" && (
            <Button
              size="sm"
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              onClick={() => onSetStatus(b, "confirmed")}
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Confirm
            </Button>
          )}
          {b.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => onSetStatus(b, "cancelled")}
            >
              <Ban className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
