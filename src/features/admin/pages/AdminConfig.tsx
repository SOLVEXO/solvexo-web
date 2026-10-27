import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useAdminConfig,
  useUpdateAiConfig,
  useUpdateEmailConfig,
  useUpdateMaintenanceMode,
} from '@/hooks/admin/useAdminConfig';
import type { PlatformConfig, AiConfig, EmailConfig } from '@/api/services/config/adminConfig';
import { Toggle, Input, Select, Button, Modal, AdminPageHeader } from '@/components/comman/ui';
import { SettingsCard, SettingsRow, SettingsGroupLabel, SettingsSaveBar } from '@/components/comman/settings';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { AlertCircle, AlertTriangle, Bot, Mail } from 'lucide-react';

const AI_MODELS = ['claude-sonnet-5', 'claude-haiku-4-5', 'claude-opus-4-8'];
const EMAIL_PROVIDERS = ['SendGrid', 'Mailgun', 'AWS SES', 'Postmark'];

// ── Saved flash — transient success feedback (no toast system in this app) ────
function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return { saved, flash };
}

// ── Maintenance Mode card ─────────────────────────────────────────────────────
function MaintenanceCard({ config, onSaved }: { config: PlatformConfig; onSaved: (c: PlatformConfig) => void }) {
  const { update, submitting, error } = useUpdateMaintenanceMode();
  const [confirming, setConfirming] = useState(false);

  async function apply(next: boolean) {
    const ok = await update(next);
    if (ok) onSaved({ ...config, maintenanceMode: next });
    setConfirming(false);
  }

  return (
    <>
      <SettingsCard
        title="Maintenance Mode"
        icon={<AlertCircle size={14} />}
        tone={config.maintenanceMode ? 'danger' : 'default'}
        className={config.maintenanceMode ? 'border-error' : undefined}
        description="When enabled, the platform shows a maintenance page to all users."
      >
        {/* Switches the moment it is flipped (behind a confirm dialog), so this
            card has no save bar of its own. */}
        <div className="-mx-5 border-y border-fog px-5">
          <SettingsRow label="Maintenance mode" description="Sellers and buyers see the maintenance page instead of the app.">
            <Toggle
              checked={config.maintenanceMode}
              disabled={submitting}
              onChange={(next) => (next ? setConfirming(true) : apply(false))}
              ariaLabel="Maintenance mode"
            />
          </SettingsRow>
        </div>
        {config.maintenanceMode && (
          <p className="mt-3 text-[11.5px] font-semibold text-error flex items-center gap-1">
            <AlertTriangle size={11} /> Maintenance mode is ON — users cannot access the platform.
          </p>
        )}
        {error && <p className="mt-2 text-[12px] text-error">{error}</p>}
      </SettingsCard>

      {confirming && (
        <Modal mobileSheet
          title="Enable Maintenance Mode?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" loading={submitting} onClick={() => apply(true)}>Enable Maintenance Mode</Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            This immediately shows a maintenance page to every buyer and seller on the platform. Are you sure?
          </p>
        </Modal>
      )}
    </>
  );
}

// ── AI Configuration card ─────────────────────────────────────────────────────
function AiConfigCard({ config, onSaved }: { config: PlatformConfig; onSaved: (c: PlatformConfig) => void }) {
  const { update, submitting, error } = useUpdateAiConfig();
  const { saved, flash } = useSavedFlash();
  const [creditLimit, setCreditLimit] = useState(String(config.aiConfig.monthlyCreditLimit));
  const [aiModel, setAiModel] = useState(config.aiConfig.aiModel);
  const [validationError, setValidationError] = useState('');

  // Re-seed local form state when the server value changes underneath us
  // (e.g. after a successful save) — adjusted during render rather than in
  // an effect, per React's guidance for "state that mirrors a prop".
  const [syncedAiConfig, setSyncedAiConfig] = useState(config.aiConfig);
  if (config.aiConfig !== syncedAiConfig) {
    setSyncedAiConfig(config.aiConfig);
    setCreditLimit(String(config.aiConfig.monthlyCreditLimit));
    setAiModel(config.aiConfig.aiModel);
  }

  async function save() {
    const limit = parseInt(creditLimit, 10);
    if (Number.isNaN(limit) || limit < 0) {
      setValidationError('Monthly credit limit must be a positive number.');
      return;
    }
    setValidationError('');
    const payload: Partial<AiConfig> = { monthlyCreditLimit: limit, aiModel };
    const ok = await update(payload);
    if (ok) { onSaved({ ...config, aiConfig: { ...config.aiConfig, ...payload } }); flash(); }
  }

  const isDirty =
    creditLimit !== String(config.aiConfig.monthlyCreditLimit) ||
    aiModel !== config.aiConfig.aiModel;

  return (
    <SettingsCard
      title="AI Configuration"
      icon={<Bot size={14} />}
      description="What each seller may spend on AI each month, and the model behind it."
    >
      <div className="flex flex-col gap-[14px]">
        <SettingsGroupLabel>Usage &amp; model</SettingsGroupLabel>
        <Input
          label="Monthly Credit Limit (per seller)"
          type="number"
          min={0}
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          error={validationError || undefined}
          className="max-w-[220px]"
        />
        <Select label="AI Model" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
          {AI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <div className="rounded-[10px] bg-mist px-3.5 py-[10px] text-[11.5px] leading-relaxed text-graphite">
          <span className="font-semibold text-brand-deep-orange">{creditLimit || 0} credits/seller</span>
          {' '}× active sellers. Actual usage tracks against each seller's own AI wallet, so this is a ceiling, not a bill.
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>

      <SettingsSaveBar
        isDirty={isDirty}
        saving={submitting}
        onSave={save}
        saveMsg={saved ? { ok: true, text: 'Saved' } : null}
      />
    </SettingsCard>
  );
}

// ── Email Configuration card ──────────────────────────────────────────────────
function EmailConfigCard({ config, onSaved }: { config: PlatformConfig; onSaved: (c: PlatformConfig) => void }) {
  const { update, submitting, error } = useUpdateEmailConfig();
  const { saved, flash } = useSavedFlash();
  const [fromName, setFromName] = useState(config.emailConfig.fromName);
  const [fromEmail, setFromEmail] = useState(config.emailConfig.fromEmail ?? '');
  const [replyToEmail, setReplyToEmail] = useState(config.emailConfig.replyToEmail ?? '');
  const [provider, setProvider] = useState(config.emailConfig.provider);
  const [validationError, setValidationError] = useState('');

  // See AiConfigCard above — re-seeded during render, not via effect.
  const [syncedEmailConfig, setSyncedEmailConfig] = useState(config.emailConfig);
  if (config.emailConfig !== syncedEmailConfig) {
    setSyncedEmailConfig(config.emailConfig);
    setFromName(config.emailConfig.fromName);
    setFromEmail(config.emailConfig.fromEmail ?? '');
    setReplyToEmail(config.emailConfig.replyToEmail ?? '');
    setProvider(config.emailConfig.provider);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function save() {
    if (fromEmail && !emailPattern.test(fromEmail)) { setValidationError('From Email must be a valid email address.'); return; }
    if (replyToEmail && !emailPattern.test(replyToEmail)) { setValidationError('Reply-To Email must be a valid email address.'); return; }
    setValidationError('');
    const payload: Partial<EmailConfig> = { fromName, fromEmail, replyToEmail, provider };
    const ok = await update(payload);
    if (ok) { onSaved({ ...config, emailConfig: { ...config.emailConfig, ...payload } }); flash(); }
  }

  const isDirty =
    fromName !== config.emailConfig.fromName ||
    fromEmail !== (config.emailConfig.fromEmail ?? '') ||
    replyToEmail !== (config.emailConfig.replyToEmail ?? '') ||
    provider !== config.emailConfig.provider;

  return (
    <SettingsCard
      title="Email Configuration"
      icon={<Mail size={14} />}
      description="The sender identity on platform email and the provider that delivers it."
    >
      <div className="flex flex-col gap-[14px]">
        <SettingsGroupLabel>Sender identity</SettingsGroupLabel>
        <Input label="From Name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
        <Input label="From Email" type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} error={validationError.includes('From Email') ? validationError : undefined} />
        <Input label="Reply-To Email" type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} error={validationError.includes('Reply-To') ? validationError : undefined} />

        <SettingsGroupLabel className="mt-1">Delivery provider</SettingsGroupLabel>
        <Select label="Email Provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
          {EMAIL_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>

      <SettingsSaveBar
        isDirty={isDirty}
        saving={submitting}
        onSave={save}
        saveMsg={saved ? { ok: true, text: 'Saved' } : null}
      />
    </SettingsCard>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminConfig({ embedded = false }: { embedded?: boolean } = {}) {
  usePageTitle('Config');
  const { data, loading, error, refetch } = useAdminConfig();
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  // Seed local editable state from the fetched config — adjusted during
  // render (not an effect) per React's guidance for state mirroring a prop.
  const [syncedData, setSyncedData] = useState<PlatformConfig | null>(null);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setConfig(data);
  }

  return (
    <>
      {!embedded && (
        <AdminPageHeader title="Platform Config" subtitle="AI settings, email config and system controls." />
      )}
      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      {loading && !config ? null : error && !config ? (
        <AnalyticsErrorState message={error} onRetry={refetch} />
      ) : config ? (
        <>
          <MaintenanceCard config={config} onSaved={setConfig} />
          <AiConfigCard config={config} onSaved={setConfig} />
          <EmailConfigCard config={config} onSaved={setConfig} />
        </>
      ) : null}
      </div>
    </>
  );
}
