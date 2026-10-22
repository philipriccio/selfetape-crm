export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-stone-900">Settings</h1>
      <section className="mt-6 max-w-2xl rounded-xl border border-amber-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Email delivery is disabled</h2>
        <p className="mt-3 text-stone-600">Campaign drafts and contacts remain available. Sending, scheduling, test messages and delivery tracking are unavailable while security checks are completed.</p>
        <p className="mt-3 text-stone-600">Account access and provider settings are managed through the protected hosting control panel. Do not enter or share credentials here.</p>
      </section>
    </div>
  )
}
