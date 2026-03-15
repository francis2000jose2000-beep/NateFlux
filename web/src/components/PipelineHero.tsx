type Props = {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  isLoading: boolean;
  isSuccess?: boolean;
  onRun: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  isCanceling?: boolean;
};

function sanitizeRepoUrlInput(value: string) {
  return value.replace(/[)\],.\s]+$/g, "");
}

export function PipelineHero({ repoUrl, setRepoUrl, isLoading, isSuccess, onRun, onCancel, showCancel, isCanceling }: Props) {
  return (
    <section className="pt-12">
      <div className="mx-auto max-w-3xl text-center">


        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          NateFlux
        </h1>
        <p className="mt-4 text-pretty text-sm leading-6 text-zinc-300 sm:text-base">
          Orchestrating secure Infrastructure-as-Code deployments via GitLab CI/CD and HCP Terraform.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 !bg-[#060010]/55 backdrop-blur-2xl p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <label className="block text-left text-xs font-medium text-zinc-300">Repository URL</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(sanitizeRepoUrlInput(e.target.value))}
              placeholder="Paste a public GitHub link (e.g., https://github.com/user/oci-infra)"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 transition focus:border-indigo-500/60 focus:bg-black/40"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={onRun}
              disabled={isLoading || repoUrl.trim().length === 0}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 
                ${isSuccess 
                  ? 'bg-emerald-500 hover:bg-emerald-400 animate-[bounce_1s_ease-in-out_1]' 
                  : 'bg-indigo-600 hover:bg-indigo-500'} 
                ${isLoading ? 'animate-pulse' : ''}`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Running
                </span>
              ) : isSuccess ? (
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Success!
                </span>
              ) : (
                "Run CI/CD Scan"
              )}
            </button>
            {showCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isCanceling}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 bg-red-900/50 hover:bg-red-600/70 text-red-200 border border-red-500/30 backdrop-blur-md`}
              >
                {isCanceling ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200/30 border-t-red-200" />
                    Canceling...
                  </span>
                ) : (
                  "Cancel Run"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
