import AuthShell from "../auth-shell";
import ForgotForm from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell subtitle="Reset your password">
      <ForgotForm />
    </AuthShell>
  );
}
