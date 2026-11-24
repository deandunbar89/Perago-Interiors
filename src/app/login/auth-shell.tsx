import Image from "next/image";

/** The dark branded frame shared by the login, forgot-password and reset-password screens. */
export default function AuthShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/brand/logo-full-champagne.png"
            alt="Perago Interiors"
            width={1600}
            height={760}
            className="h-28 w-auto"
            priority
          />
        </div>
        <div className="mb-6 border-t-2 border-champagne" />
        <p className="mb-6 text-center text-sm text-cream/60">{subtitle}</p>
        <div className="rounded-xl border border-cream/10 bg-cream/[0.03] p-6">{children}</div>
      </div>
    </div>
  );
}
