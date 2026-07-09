import React, { useState } from "react";
import { Terminal, RotateCcw, Play, Activity } from "lucide-react";

export const DeveloperPortalView = ({ onAddNotification }) => {
  const [apiKey, setApiKey] = useState(
    "gflow_live_8a920dfbc7a3f01b920405ecb121e782",
  );
  const [webhookUrl, setWebhookUrl] = useState(
    "https://api.myboutique.com/webhooks/garments",
  );
  const [webhookStatus, setWebhookStatus] = useState("Active");
  const [apiLogs, setApiLogs] = useState([
    {
      timestamp: "2026-06-28 14:22:01",
      method: "GET",
      endpoint: "/v1/garments",
      status: 200,
      latency: "42ms",
      ip: "34.120.90.41",
    },
    {
      timestamp: "2026-06-28 14:18:15",
      method: "POST",
      endpoint: "/v1/billing/invoice",
      status: 201,
      latency: "124ms",
      ip: "34.120.90.41",
    },
    {
      timestamp: "2026-06-28 13:55:40",
      method: "GET",
      endpoint: "/v1/inventory/low-stock",
      status: 200,
      latency: "18ms",
      ip: "104.244.42.1",
    },
    {
      timestamp: "2026-06-28 13:42:10",
      method: "GET",
      endpoint: "/v1/garments/RAY-TRS-M-1024",
      status: 200,
      latency: "15ms",
      ip: "34.120.90.41",
    },
  ]);

  const handleRegenerateKey = () => {
    const chars = "0123456789abcdef";
    let newKey = "gflow_live_";
    for (let i = 0; i < 32; i++) {
      newKey += chars[Math.floor(Math.random() * chars.length)];
    }
    setApiKey(newKey);
    onAddNotification(
      "Developer Credentials",
      "API token regenerated successfully. Old token has been blacklisted.",
      "success",
    );
  };

  const handleTestWebhook = () => {
    onAddNotification(
      "Webhook Gateway",
      `Sending POST test ping payload to ${webhookUrl}`,
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "Webhook Success",
        "Webhook target responded with STATUS 200 OK.",
        "success",
      );
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="developer-portal-root">
      {/* Overview header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>Active Developer Portal</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Access the GarmentFlow SaaS engine directly via custom HTTP
          integrations. Create webhooks, sync product inventory real-time,
          generate custom invoices on third-party channels, and track API
          traffic metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Key and webhook managers */}
        <div className="lg:col-span-5 space-y-6 text-xs">
          {/* Key management card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Developer API Token
            </h4>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-20 py-2.5 font-mono font-bold text-slate-700 focus:outline-none"
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    onAddNotification(
                      "Clipboard",
                      "API token copied to clipboard.",
                      "success",
                    );
                  }}
                  className="absolute right-2.5 top-2 bg-slate-900 text-white px-2.5 py-1 rounded font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <button
                onClick={handleRegenerateKey}
                className="w-full py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regenerate API Key</span>
              </button>
            </div>
          </div>

          {/* Webhook Configuration card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Dynamic Stock Webhooks
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-700"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Test Ping Payload</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: API logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-7">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Developer Access Request Logs
            </h4>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE FEED</span>
            </span>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Path</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {apiLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 text-[10px] text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5 font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${log.method === "GET" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-800 font-bold">
                      {log.endpoint}
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      <span className="text-emerald-600">{log.status}</span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-500">
                      {log.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
