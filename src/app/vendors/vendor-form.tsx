"use client";

import { useRef, useState, useTransition } from "react";
import type { Vendor } from "@prisma/client";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import { TRADES, TRADE_LABELS, VENDOR_TYPES, VENDOR_TYPE_LABELS } from "@/lib/constants";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

export default function VendorForm({
  vendor,
  onDone,
}: {
  vendor?: Vendor;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = vendor
        ? await updateVendor(vendor.id, undefined, formData)
        : await createVendor(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          required
          defaultValue={vendor?.name}
          placeholder="Company name"
          className={fieldClass}
        />
        <select name="type" required defaultValue={vendor?.type ?? ""} className={fieldClass}>
          <option value="" disabled>
            Supplier or contractor?
          </option>
          {VENDOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {VENDOR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <select name="trade" defaultValue={vendor?.trade ?? ""} className={fieldClass}>
        <option value="">No trade set</option>
        {TRADES.map((t) => (
          <option key={t} value={t}>
            {TRADE_LABELS[t]}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="contactName"
          defaultValue={vendor?.contactName ?? ""}
          placeholder="Contact person"
          className={fieldClass}
        />
        <input name="phone" defaultValue={vendor?.phone ?? ""} placeholder="Phone" className={fieldClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="email"
          type="email"
          defaultValue={vendor?.email ?? ""}
          placeholder="Email"
          className={fieldClass}
        />
        <input
          name="website"
          defaultValue={vendor?.website ?? ""}
          placeholder="Website"
          className={fieldClass}
        />
      </div>

      <input
        name="address"
        defaultValue={vendor?.address ?? ""}
        placeholder="Address"
        className={fieldClass}
      />

      <input
        name="trnNumber"
        defaultValue={vendor?.trnNumber ?? ""}
        placeholder="TRN / VAT number"
        className={fieldClass}
      />

      <textarea
        name="notes"
        rows={2}
        defaultValue={vendor?.notes ?? ""}
        placeholder="Notes"
        className={fieldClass}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : vendor ? "Save changes" : "Add vendor"}
      </button>
    </form>
  );
}
