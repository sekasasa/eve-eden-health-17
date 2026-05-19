import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";

export const Route = createFileRoute("/program/settings")({
  component: ProgramSettings,
});

function ProgramSettings() {
  return (
    <ProgramShell>
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Settings</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">Program-level configuration.</p>

      <div className="mt-6 max-w-2xl space-y-4">
        <Card title="Organisation">
          <Field label="Program name" defaultValue="Eve & Eden" />
          <Field label="Primary country" defaultValue="Morocco" />
        </Card>
        <Card title="Risk thresholds">
          <Field label="High-risk auto-flag (YES answers)" defaultValue="2" type="number" />
          <Field label="Resolve target (hours)" defaultValue="48" type="number" />
        </Card>
        <Card title="Notifications">
          <Toggle label="Email admins on new high-risk alert" defaultChecked />
          <Toggle label="Weekly impact digest" defaultChecked />
        </Card>
        <div className="flex justify-end">
          <button className="rounded-lg bg-eve-teal px-5 py-2 font-sans text-sm font-medium text-white">Save changes</button>
        </div>
      </div>
    </ProgramShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <p className="font-sans text-sm font-semibold text-gray-900">{title}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <label className="block">
      <span className="block font-sans text-xs text-gray-600">{label}</span>
      <input type={type} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm" />
    </label>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
      <span className="font-sans text-sm text-gray-900">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-eve-teal" />
    </label>
  );
}
