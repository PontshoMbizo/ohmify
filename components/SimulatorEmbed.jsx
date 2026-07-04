"use client";

import { useEffect, useRef, useState } from "react";
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
 * Optionally accepts a `bridge` to drive the embedded sim from outside the
 * iframe despite it being cross-origin (so direct `contentWindow` access, the
 * CircuitJS pattern, isn't available): on load, scope.io posts a
 * `scopeio:init` message telling the sim what to load and what mode it's in;
 * the sim runs the usual way and posts a `scopeio:result` message back when
 * its embedded-mode action button is used. With no `bridge`, this is the
 * plain `/tools` free-exploration embed — unchanged.
 *
 * @param {string|undefined} src   deployed simulator URL (from NEXT_PUBLIC_*)
 * @param {string} title           human label shown in the header strip
 * @param {string} [envVar]        name of the env var to set, shown in the empty state
 * @param {string} [accent]        tailwind text colour class for the title accent
 * @param {object} [bridge]        { mode: "export"|"capture"|"solve", starterCode, testbench?, engine?, signal?, duration?, onResult }
 */
export default function SimulatorEmbed({ src, title, envVar, accent = "text-cyan-600", bridge, hideHeader }) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);

  // Latest bridge fields, readable from the stable message listener below
  // without rebinding it on every parent render.
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;

  // Origin the bridge is allowed to talk to — derived once per `src`. Used to
  // target the outbound postMessage and to validate inbound messages, so a
  // third-party frame (or a stale iframe after `src` changes) can't inject a
  // fake result.
  let simOrigin = null;
  if (src) {
    try {
      simOrigin = new URL(src).origin;
    } catch {
      simOrigin = null;
    }
  }

  function postInit() {
    const b = bridgeRef.current;
    if (b && simOrigin && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "scopeio:init",
          mode: b.mode,
          starterCode: b.starterCode,
          testbench: b.testbench,
          engine: b.engine,
          signal: b.signal,
          duration: b.duration,
        },
        simOrigin
      );
    }
  }

  useEffect(() => {
    if (!bridge || !simOrigin) return;
    function handleMessage(event) {
      if (event.origin !== simOrigin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      // The sim announces scopeio:ready once its listener is registered —
      // (re)send init then. The onLoad send alone races the sim app's
      // hydration and can be dropped (sim then shows its built-in template
      // and no embed Submit button).
      if (event.data?.type === "scopeio:ready") {
        postInit();
        return;
      }
      if (event.data?.type !== "scopeio:result") return;
      bridgeRef.current?.onResult?.(event.data.payload);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simOrigin, !!bridge]);

  function handleLoad() {
    setLoaded(true);
    // Fallback for sim builds that don't send scopeio:ready; the sim seeds
    // from init only once, so a duplicate init is harmless.
    postInit();
  }

  return (
    <div className={`flex flex-col bg-white ${bridge ? "h-full" : "h-[calc(100vh-3rem)]"}`}>
      {/* Header strip — only shown for the standalone /tools embed; inside the
          create/solve wizard (bridge present) it's redundant chrome. */}
      {!bridge && !hideHeader && (
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
      )}

      {/* Body */}
      {src ? (
        <div className="flex-1 relative">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <span className="loading loading-spinner loading-lg text-cyan-500" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            onLoad={handleLoad}
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
