
import { useEffect, useState } from "react";

type ToastType = "success" | "info" | "error";

type ToastProps = {
  message: string;
  type?: ToastType;
  linkUrl?: string;
  linkText?: string;
  onClose: () => void;
  duration?: number;
};

function getToastStyles(type: ToastType) {
  switch (type) {
    case "info":
      return {
        container: "border-sky-500/20 bg-sky-500/10 text-sky-100",
        icon: "bg-sky-500/20 text-sky-300",
        link: "text-sky-300 hover:text-sky-200",
      };
    case "error":
      return {
        container: "border-rose-500/20 bg-rose-500/10 text-rose-100",
        icon: "bg-rose-500/20 text-rose-300",
        link: "text-rose-300 hover:text-rose-200",
      };
    default:
      return {
        container: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
        icon: "bg-emerald-500/20 text-emerald-300",
        link: "text-emerald-300 hover:text-emerald-200",
      };
  }
}

function getIcon(type: ToastType) {
  if (type === "info") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export function Toast({ message, type = "success", linkUrl, linkText, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const styles = getToastStyles(type);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all duration-300 ${styles.container} ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${styles.icon}`}>
        {getIcon(type)}
      </div>
      <div className="flex flex-col">
        <span className="font-medium">{message}</span>
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-0.5 text-xs underline ${styles.link}`}
          >
            {linkText || "View details"}
          </a>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 rounded-lg p-1 hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 opacity-60"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
