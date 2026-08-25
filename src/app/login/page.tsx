import Image from "next/image";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/logo-icon-perago-champagne.png"
            alt="Perago"
            width={1400}
            height={736}
            className="mb-2 h-24 w-auto"
            priority
          />
          <p className="text-sm text-white/50">Tender &amp; project management</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
          <LoginForm callbackUrl={callbackUrl || "/"} />
        </div>
      </div>
    </div>
  );
}
