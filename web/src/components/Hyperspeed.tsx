"use client";

import React, { useMemo } from "react";
import HyperspeedImpl from "./Hyperspeed.jsx";

type Props = {
  effectOptions?: unknown;
};

export default function Hyperspeed({ effectOptions }: Props) {
  const normalizedOptions = useMemo(() => {
    if (!effectOptions || typeof effectOptions !== "object") return effectOptions;
    const base = effectOptions as Record<string, unknown>;
    const colors = (base.colors && typeof base.colors === "object" ? (base.colors as Record<string, unknown>) : {}) as Record<
      string,
      unknown
    >;
    return {
      ...base,
      colors: {
        ...colors,
        background: 0x060010,
      },
    };
  }, [effectOptions]);

  return (
    <div className="h-full w-full bg-[#060010]" style={{ backgroundColor: "#060010" }}>
      <HyperspeedImpl effectOptions={normalizedOptions} />
    </div>
  );
}
