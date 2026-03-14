
import React from 'react';

export interface DebugLog {
  timestamp: string;
  source: 'GitLab' | 'Terraform' | 'System';
  url?: string;
  status?: number;
  data: unknown;
}

interface DebugConsoleProps {
  logs: DebugLog[];
}

export function DebugConsole({ logs }: DebugConsoleProps) {
  // Take the last 3 logs
  const recentLogs = logs.slice(-3);

  if (recentLogs.length === 0) return null;

  return (
    <div className="glass-card mt-10 w-full max-w-6xl mx-auto border border-zinc-800 bg-zinc-900/50 backdrop-blur-md rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Debug Console
        </h3>
        <span className="text-[10px] text-zinc-500">
          Last 3 Responses
        </span>
      </div>
      <div className="p-4 space-y-4">
        {recentLogs.map((log, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-zinc-500">{log.timestamp}</span>
              <span className={`px-1.5 py-0.5 rounded ${
                log.source === 'GitLab' ? 'bg-orange-500/10 text-orange-400' :
                log.source === 'Terraform' ? 'bg-purple-500/10 text-purple-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {log.source}
              </span>
              {log.status && (
                <span className={`${
                  log.status >= 200 && log.status < 300 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {log.status}
                </span>
              )}
              {log.url && <span className="text-zinc-600 truncate max-w-md">{log.url}</span>}
            </div>
            <pre className="bg-black/50 p-3 rounded text-[10px] text-zinc-300 overflow-x-auto font-mono custom-scrollbar">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
