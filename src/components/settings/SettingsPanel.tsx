import { useState } from 'react'
import { Key, Save, Upload, Trash2, Type, Info } from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'
import { studioApi } from '@/lib/studioApi'
import { FREE_MODELS } from '@/lib/constants'

export default function SettingsPanel() {
  const { settings, setSetting, customFonts, importFont, fetchFonts } = useStudioStore()
  const [apiKey, setApiKey] = useState(settings.openrouter_api_key ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveApiKey() {
    setIsSaving(true)
    await setSetting('openrouter_api_key', apiKey.trim())
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFontImport = async () => {
    const file = await studioApi.fonts.openDialog()
    if (file) {
      await importFont(file)
    }
  }

  async function handleFontDelete(id: number) {
    await studioApi.fonts.delete(id)
    await fetchFonts()
  }

  return (
    <div className="h-full bg-[#f8f7f4] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-[#1a1f2e]">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your writing studio preferences</p>
        </div>

        {/* OpenRouter API Key */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Key size={18} className="text-brand" />
            <h2 className="text-base font-bold text-[#1a1f2e]">OpenRouter API Key</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Required for the AI Assistant. Get a free key at{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-brand hover:underline">
              openrouter.ai
            </a>. Your key is stored locally and never sent anywhere except OpenRouter.
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-or-v1-…"
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] font-mono transition-all"
            />
            <button
              onClick={saveApiKey}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saved ? 'Saved!' : isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </section>

        {/* Default AI Model */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Info size={18} className="text-brand" />
            <h2 className="text-base font-bold text-[#1a1f2e]">Default AI Model</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            All models are free-tier via OpenRouter. You can also change this per-conversation in the chat.
          </p>
          <select
            value={settings.openrouter_model ?? FREE_MODELS[0].id}
            onChange={e => setSetting('openrouter_model', e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-[#1a1f2e] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          >
            {FREE_MODELS.map((m: { id: string; label: string }) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </section>

        {/* Custom Fonts */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Type size={18} className="text-brand" />
              <h2 className="text-base font-bold text-[#1a1f2e]">Custom Fonts</h2>
            </div>
            <button
              onClick={handleFontImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors"
            >
              <Upload size={13} /> Import Font
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Import .ttf, .otf, or .woff2 font files for use in the editor. Note: exported PDFs/EPUBs always use Georgia (serif) or Inter (sans-serif) for maximum compatibility.
          </p>

          {customFonts.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">No custom fonts imported yet</p>
              <button onClick={handleFontImport} className="mt-2 text-xs text-brand hover:text-brand-dark transition-colors">
                + Import your first font
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {customFonts.map(font => (
                <div key={font.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-[#1a1f2e]" style={{ fontFamily: `"${font.family_name}"` }}>
                      {font.family_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {font.file_name} · weight {font.weight} · {font.style}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFontDelete(font.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove font"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Autosave */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-[#1a1f2e] mb-1">Autosave Interval</h2>
          <p className="text-xs text-gray-500 mb-4">How often to automatically save your work (in seconds).</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={Math.round(Number(settings.autosave_interval_ms ?? 30000) / 1000)}
              onChange={e => setSetting('autosave_interval_ms', String(Number(e.target.value) * 1000))}
              className="flex-1 accent-brand"
            />
            <span className="text-sm font-bold text-[#1a1f2e] w-16 text-right">
              {Math.round(Number(settings.autosave_interval_ms ?? 30000) / 1000)}s
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
