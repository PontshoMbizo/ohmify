"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

/**
 * Full-height wrapper that embeds an externally-hosted simulator app as an
 * iframe (same pattern as the CircuitJS embed, but cross-origin to a deployed
 * service). The actual simulation runs server-side in the simulator app's own
 * sandboxed container — scope.io only frames the UI.
 *
 * When `src` is missing (env var not configured) it renders a friendly
 * "not configured" state instead of a broken iframe.
 *
 * @param {string|undefined} src   deployed simulator URL (from NEXT_PUBLIC_*)
 * @param {string} title           human label shown in the header strip
 * @param {string} [envVar]        name of the env var to set, shown in the empty state
 * @param {string} [accent]        tailwind text colour class for the title accent
 */
export default function SimulatorEmbed({ src, title, envVar, accent = "text-cyan-600" }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-white">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/tools"
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={14} /> Tools
          </a>
          <span className="text-gray-200">/</span>
          <span className={`text-sm font-black uppercase tracking-tight truncate ${accent}`}>
            {title}
          </span>
        </div>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Open in new tab <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Body */}
      {src ? (
        <div className="flex-1 relative">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <span className="loading loading-spinner loading-lg text-cyan-500" />
            </div>
          )}
          <iframe
            src={src}
            title={title}
            onLoad={() => setLoaded(true)}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4 p-8 rounded-2xl border border-amber-200 bg-amber-50">
            <AlertTriangle className="mx-auto text-amber-500" size={32} />
            <p className="text-sm font-black uppercase tracking-tight text-amber-800">
              Simulator not configured
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              This tool embeds an externally-hosted simulator app. Set{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
                {envVar}
              </code>{" "}
              to the deployed simulator URL (or its local dev URL) in your environment, then reload.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
