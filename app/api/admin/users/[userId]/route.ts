import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const paramsSchema = z.object({
  userId: z.string().trim().min(1).max(128),
});

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const parsedParams = paramsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      return errorResponse("Invalid user id.", 400);
    }

    const token = getBearerToken(request);
    if (!token) {
      return errorResponse("Missing authorization token.", 401);
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
      return errorResponse("Invalid authorization token.", 401);
    }

    const callerDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!callerDoc.exists || callerDoc.get("role") !== "admin") {
      return errorResponse("Only admins can delete users.", 403);
    }

    const targetUserId = parsedParams.data.userId;
    if (targetUserId === decodedToken.uid) {
      return errorResponse("Admins cannot delete their own account here.", 400);
    }

    try {
      await adminAuth.deleteUser(targetUserId);
    } catch (error: unknown) {
      const code = error instanceof Error ? (error as Error & { code?: string }).code : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    await adminDb.collection("users").doc(targetUserId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user deletion failed:", error);
    return errorResponse("Failed to delete user.", 500);
  }
}
