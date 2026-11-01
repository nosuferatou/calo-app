type SupabaseConfigValues = {
  url?: string;
  publishableKey?: string;
};

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseConfig(
  values: SupabaseConfigValues = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabaseConfig {
  const url = values.url?.trim();
  const publishableKey = values.publishableKey?.trim();

  if (!url || !publishableKey) {
    const missingVariables = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ].filter(Boolean);
    throw new Error(
      `Missing required Supabase environment variable(s): ${missingVariables.join(", ")}`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }

  return { url, publishableKey };
}
