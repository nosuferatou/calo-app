import { createClient } from "@/lib/supabase/server";
import { createRepositories } from "@/lib/repositories";

export async function createServerRepositories() {
  return createRepositories(await createClient());
}
