"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { getErrorMessageKey } from "@/lib/errors";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { language, t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={language}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <style>{`
          .calo-error-button {
            min-height: 44px;
            margin-top: 24px;
            border: 0;
            border-radius: 8px;
            background: #2563eb;
            color: #ffffff;
            padding: 0 20px;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
          }
          .calo-error-button:hover {
            background: #1d4ed8;
          }
          .calo-error-button:active {
            background: #1e40af;
          }
          .calo-error-button:focus-visible {
            outline: 2px solid #1d4ed8;
            outline-offset: 2px;
          }
        `}</style>
        <title>{`CALO - ${t("globalError.title")}`}</title>
        <main style={{ width: "100%", maxWidth: "32rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#2563eb",
            }}
          >
            CALO
          </p>
          <h1 style={{ margin: "8px 0 0", fontSize: "1.5rem" }}>
            {t("globalError.title")}
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "GrayText",
            }}
          >
            {t(getErrorMessageKey(error))}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="calo-error-button"
          >
            {t("error.retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
