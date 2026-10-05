import Image from "next/image";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/brand/logo-stacked-champagne.png"
            alt="Perago Interiors"
            width={1196}
            height={725}
            className="h-32 w-auto"
            priority
          />
        </div>
        <div className="mb-6 border-t-2 border-champagne" />
        <p className="mb-6 text-center text-sm text-cream/60">Tender &amp; project management</p>
        <div className="rounded-xl border border-cream/10 bg-cream/[0.03] p-6">
          <LoginForm callbackUrl={callbackUrl || "/"} />
        </div>
      </div>
    </div>
  );
}
