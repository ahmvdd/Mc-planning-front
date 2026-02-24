"use client";

import { useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

function decodeOrgName(token: string | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as { orgName?: string | null; organizationName?: string | null };
    return payload.orgName ?? payload.organizationName ?? null;
  } catch {
    return null;
  }
}

export default function OrgTitle() {
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setOrgName(null);
      return;
    }

    const decodedName = decodeOrgName(token);
    if (decodedName) {
      setOrgName(decodedName);
      return;
    }

    apiFetchClient<{ orgName?: string | null; organizationName?: string | null }>(
      "/auth/me",
    )
      .then((data) => {
        setOrgName(data.orgName ?? data.organizationName ?? null);
      })
      .catch(() => setOrgName(null));
  }, []);

  return (
    <p className="text-lg font-semibold text-slate-900">
      {orgName ?? "Manager"}
    </p>
  );
}
