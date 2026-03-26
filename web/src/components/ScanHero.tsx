import type { ScanApiRequest } from "@/shared/scanTypes";

type Props = {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  scanner: NonNullable<ScanApiRequest["scanner"]>;
  setScanner: (v: NonNullable<ScanApiRequest["scanner"]>) => void;
  isLoading: boolean;
  onScan: () => void;
};

export function ScanHero({
  repoUrl,
  setRepoUrl,
  scanner,
  setScanner,
  isLoading,
  onScan,
}: Props) {
  return (
    <section className="pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Static Terraform scan for public GitHub repositories
        </div>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          NateFlux
        </h1>
        <p className="mt-4 text-pretty text-sm leading-6 text-zinc-300 sm:text-base">
          Paste a public GitHub repo link, run a scan (Checkov or mock), and get a typed
          compliance report. Temporary clone directories are always cleaned up.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <label className="block text-left text-xs font-medium text-zinc-300">
            Repository URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste a public GitHub repository link (e.g., https://github.com/user/oci-infra)"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 transition focus:border-indigo-500/60 focus:bg-black/40"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={onScan}
              disabled={isLoading || repoUrl.trim().length === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Scanning
                </span>
              ) : (
                "Scan Repository"
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">Scanner</span>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scanner"
                  checked={scanner === "mock"}
                  onChange={() => setScanner("mock")}
                />
                Mock
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scanner"
                  checked={scanner === "checkov"}
                  onChange={() => setScanner("checkov")}
                />
                Checkov
              </label>
            </div>

            <div className="text-xs text-zinc-500">
              Tip: if Checkov isn’t available on the host, it falls back to mock.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

