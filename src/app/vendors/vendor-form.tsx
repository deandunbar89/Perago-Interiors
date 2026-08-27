"use client";

import { useRef, useState, useTransition } from "react";
import { Download } from "lucide-react";
import type { Vendor, VendorDocument } from "@prisma/client";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import { TRADES, TRADE_LABELS, VENDOR_TYPES, VENDOR_TYPE_LABELS } from "@/lib/constants";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

export type VendorWithDocs = Vendor & {
  tradeLicenseDoc: VendorDocument | null;
  trnCertDoc: VendorDocument | null;
};

function DocSlot({ name, label, current }: { name: string; label: string; current: VendorDocument | null }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {current && (
        <a
          href={`/api/vendor-files/${current.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex w-fit items-center gap-1 text-xs text-slate-500 underline hover:text-slate-800"
        >
          <Download size={11} />
          {current.originalName}
        </a>
      )}
      <input
        name={name}
        type="file"
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
      />
      {current && <p className="mt-0.5 text-[11px] text-slate-400">Choose a file to replace it.</p>}
    </div>
  );
}

export default function VendorForm({
  vendor,
  onDone,
}: {
  vendor?: VendorWithDocs;
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

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <DocSlot name="tradeLicense" label="Trade license" current={vendor?.tradeLicenseDoc ?? null} />
        <DocSlot name="trnCert" label="TRN certificate" current={vendor?.trnCertDoc ?? null} />
      </div>

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
