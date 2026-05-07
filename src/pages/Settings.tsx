import { useState } from 'react';
import { Eye, EyeOff, Check, AlertTriangle, Trash2, Download, Upload, MapPin, MessageSquare, Database } from 'lucide-react';
import { useSettingsStore, OutreachTone } from '../lib/stores/useSettingsStore';
import { useLeadsStore } from '../lib/stores/useLeadsStore';
import { clsx } from 'clsx';

const LOCATIONS = ['Asaba', 'Lagos', 'Port Harcourt', 'Abuja', 'Enugu'];

const TONES: { value: OutreachTone; label: string; description: string }[] = [
  { value: 'casual', label: 'Casual', description: 'Warm, conversational Nigerian English' },
  { value: 'formal', label: 'Formal', description: 'Professional but approachable' },
  { value: 'pidgin', label: 'Pidgin', description: 'Natural Nigerian Pidgin English' },
];

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-brand-400" />
      <h2 className="font-display font-semibold text-base-100">{title}</h2>
    </div>
  );
}

export default function Settings() {
  const {
    defaultLocation, outreachTone,
    setDefaultLocation, setOutreachTone,
  } = useSettingsStore();

  const { leads, activity } = useLeadsStore();

  const [clearConfirm, setClearConfirm] = useState<'leads' | 'activity' | null>(null);
  const [importError, setImportError] = useState('');
  const [imported, setImported] = useState(false);

  // Export full JSON backup
  const handleExport = () => {
    const backup = { leads, activity, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sproute-backup-${new Date().toLocaleDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.leads || !Array.isArray(data.leads)) {
          setImportError('Invalid backup file. Make sure it was exported from Sproute.');
          return;
        }
        useLeadsStore.setState({ leads: data.leads, activity: data.activity ?? [] });
        setImported(true);
        setTimeout(() => setImported(false), 2000);
      } catch {
        setImportError('Could not read file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearLeads = () => {
    useLeadsStore.setState({ leads: [] });
    setClearConfirm(null);
  };

  const handleClearActivity = () => {
    useLeadsStore.setState({ activity: [] });
    setClearConfirm(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-xl pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-base-50">Settings</h1>
        <p className="text-sm text-base-400 mt-1">Manage your preferences and data</p>
      </div>

      {/* Search Preferences */}
      <div className="bg-base-900 border border-base-800 rounded-xl p-5">
        <SectionHeader icon={MapPin} title="Search Preferences" />
        <div className="space-y-2">
          <p className="text-sm text-base-100">Default Location</p>
          <p className="text-xs text-base-500">Pre-selected every time you open the Search page.</p>
          <select
            value={defaultLocation}
            onChange={(e) => setDefaultLocation(e.target.value)}
            className="w-full bg-base-800 border border-base-700 rounded-lg px-4 py-2.5 text-sm text-base-100 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">No default</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Outreach Tone */}
      <div className="bg-base-900 border border-base-800 rounded-xl p-5">
        <SectionHeader icon={MessageSquare} title="Outreach Tone" />
        <p className="text-xs text-base-500 mb-4">Controls how the message generator writes your WhatsApp outreach.</p>
        <div className="flex flex-col gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setOutreachTone(tone.value)}
              className={clsx(
                'flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left',
                outreachTone === tone.value
                  ? 'border-brand-500/50 bg-brand-500/5'
                  : 'border-base-800 hover:border-base-700'
              )}
            >
              <div>
                <p className={clsx('text-sm font-medium', outreachTone === tone.value ? 'text-brand-400' : 'text-base-200')}>
                  {tone.label}
                </p>
                <p className="text-xs text-base-500 mt-0.5">{tone.description}</p>
              </div>
              {outreachTone === tone.value && (
                <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-base-900 border border-base-800 rounded-xl p-5">
        <SectionHeader icon={Database} title="Data Management" />

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 py-3 border-b border-base-800">
            <div className="text-center">
              <p className="font-display font-bold text-xl text-base-50">{leads.length}</p>
              <p className="text-xs text-base-500">Leads</p>
            </div>
            <div className="w-px h-8 bg-base-800" />
            <div className="text-center">
              <p className="font-display font-bold text-xl text-base-50">{activity.length}</p>
              <p className="text-xs text-base-500">Activities</p>
            </div>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-base-800 hover:bg-base-700 transition-colors"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-base-100">Export Backup</p>
              <p className="text-xs text-base-500">Download all leads and activity as JSON</p>
            </div>
          </button>

          {/* Import */}
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-base-800 hover:bg-base-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-brand-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-base-100">
                {imported ? '✓ Imported successfully' : 'Import Backup'}
              </p>
              <p className="text-xs text-base-500">Restore leads from a JSON backup file</p>
            </div>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {importError && <p className="text-xs text-red-400">{importError}</p>}

          {/* Clear Leads */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-base-800">
            <div>
              <p className="text-sm font-medium text-base-100">Clear All Leads</p>
              <p className="text-xs text-base-500">Permanently delete all saved leads</p>
            </div>
            {clearConfirm === 'leads' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Sure?</span>
                <button
                  onClick={handleClearLeads}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setClearConfirm(null)}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearConfirm('leads')}
                className="p-2 rounded-lg text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clear Activity */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-base-800">
            <div>
              <p className="text-sm font-medium text-base-100">Clear Activity Log</p>
              <p className="text-xs text-base-500">Remove all activity history</p>
            </div>
            {clearConfirm === 'activity' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Sure?</span>
                <button
                  onClick={handleClearActivity}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setClearConfirm(null)}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-base-800 text-base-400 hover:text-base-100 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearConfirm('activity')}
                className="p-2 rounded-lg text-base-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Warning */}
      <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-400">Data stored locally</p>
          <p className="text-xs text-base-500 mt-0.5">
            Your leads and activity are saved in this browser only. Use Export Backup regularly to avoid losing your data.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-3">
        <h2 className="font-display font-semibold text-base-100">About Sproute</h2>
        <p className="text-sm text-base-500">
          A personal lead prospecting tool for finding local businesses, tracking outreach and generating WhatsApp messages with AI.
        </p>
        <div className="border-t border-base-800 pt-3 space-y-1">
          {[
            'Google Maps search via SerpAPI',
            'AI-powered WhatsApp message generator',
            'Lead pipeline tracking',
            'CSV export and JSON backup',
            'Custom location search',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-base-500">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              {feature}
            </div>
          ))}
        </div>
        <p className="text-xs text-base-600">v0.0.1 — Built with React, SerpAPI & Gemini</p>
      </div>
    </div>
  );
}