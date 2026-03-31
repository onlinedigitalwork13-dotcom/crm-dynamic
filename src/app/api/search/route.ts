import { z } from "zod";
import { globalSearch } from "@/lib/search-service";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { isApiError } from "@/lib/api-errors";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export async function GET(request: Request) {
  try {
    const session = await requireApiAuth();

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") ?? "";

    const parsed = searchQuerySchema.safeParse({ q: rawQuery });

    if (!parsed.success) {
      return fail("Invalid search query", 400, parsed.error.flatten());
    }

    const results = await globalSearch(parsed.data.q, {
      userId: session.user.id,
      roleName: session.user.roleName,
      branchId: session.user.branchId ?? null,
      isActive: session.user.isActive,
    });

    return ok(results);
  } catch (error) {
    console.error("Search API error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}