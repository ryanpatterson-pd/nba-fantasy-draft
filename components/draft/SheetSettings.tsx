'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getSheetUrl, setSheetUrl, SHEET_WEBHOOK_SETUP } from '@/lib/draft/sheet-sync';

/**
 * Settings for the optional Google Sheet backup.
 *
 * The person running the night pastes the /exec URL of their Apps Script web
 * app here; it's stored on the device. The copy-paste script that receives the
 * data is shown inline so the whole thing can be set up without leaving the
 * page.
 */
export function SheetSettings({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState(() => getSheetUrl());
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  function save() {
    setSheetUrl(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(SHEET_WEBHOOK_SETUP);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the user can still select the text manually */
    }
  }

  return (
    <Card>
      <CardHeader
        label="Google Sheet backup"
        action={
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet settings"
            className="text-white/60 transition-colors hover:text-white"
          >
            <Icon name="x" size={16} />
          </button>
        }
      />
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[0.8125rem] leading-relaxed text-ink-dim">
          Scores always save on this device. Add a Google Apps Script web-app URL below to also push
          a full snapshot to a spreadsheet when you hit <strong>Save to sheet</strong>. Optional —
          leave it blank to keep everything local.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="label-xs">Web app URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            inputMode="url"
            className="h-10 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-[0.85rem] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" icon={saved ? 'check' : 'download'} onClick={save}>
            {saved ? 'Saved' : 'Save URL'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="book"
            onClick={() => setShowScript((s) => !s)}
            aria-expanded={showScript}
          >
            {showScript ? 'Hide setup script' : 'Show setup script'}
          </Button>
        </div>

        {showScript && (
          <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-2 p-3">
            <ol className="list-decimal space-y-1 pl-5 text-[0.78rem] leading-relaxed text-ink-dim">
              <li>Open your Google Sheet, then Extensions → Apps Script.</li>
              <li>Delete anything there and paste the script below.</li>
              <li>Deploy → New deployment → Web app. Execute as <strong>Me</strong>, access <strong>Anyone</strong>.</li>
              <li>Copy the <code className="font-mono">/exec</code> URL into the field above.</li>
            </ol>
            <div className="relative">
              <pre className="max-h-56 overflow-auto rounded-[8px] bg-dark p-3 text-[0.72rem] leading-relaxed text-white/90">
                <code>{SHEET_WEBHOOK_SETUP}</code>
              </pre>
              <Button
                variant="subtle"
                size="sm"
                icon={copied ? 'check' : 'download'}
                onClick={copyScript}
                className="absolute right-2 top-2"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
