import AuthShell from "./auth-shell";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const { callbackUrl, reset } = await searchParams;

  return (
    <AuthShell subtitle="Tender & project management">
      <LoginForm callbackUrl={callbackUrl || "/"} passwordReset={reset === "1"} />
    </AuthShell>
  );
}
