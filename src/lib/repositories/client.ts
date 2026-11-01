"use client";

import { createClient } from "@/lib/supabase/client";
import { createRepositories } from "@/lib/repositories";

export function createBrowserRepositories(expectedUserId?: string) {
  return createRepositories(createClient(), expectedUserId);
}
