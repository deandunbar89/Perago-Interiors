import ClientForm from "../client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">New Client</h1>
      <p className="mb-6 text-sm text-slate-500">Add a company you tender for</p>
      <ClientForm />
    </div>
  );
}
