import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(value: unknown) {
  const email = normalizeString(value);
  return email ? email.toLowerCase() : null;
}

function normalizePhoneDigits(value: unknown) {
  const phone = normalizeString(value);
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function normalizePassport(value: unknown) {
  const passport = normalizeString(value);
  return passport ? passport.toUpperCase().replace(/\s+/g, "") : null;
}

function normalizeStoredPassport(value: string | null | undefined) {
  if (!value) return null;
  return value.toUpperCase().replace(/\s+/g, "");
}

type ClientLookupRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passport: string | null;
  branchId: string | null;
};

type LeadLookupRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passportNumber: string | null;
  branchId: string | null;
  clientId: string | null;
  intakeSubmissionId: string | null;
  lastActivityAt: Date | null;
};

type IntakeLookupRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passportNumber: string | null;
  branchId: string | null;
  clientId: string | null;
  lead: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    passportNumber: string | null;
    branchId: string | null;
    clientId: string | null;
    intakeSubmissionId: string | null;
    lastActivityAt: Date | null;
  } | null;
};

type MatchReason =
  | "passport_exact"
  | "email_exact"
  | "phone_exact"
  | "phone_normalized"
  | "multi_field_exact";

type ClientCandidate = {
  entityType: "client";
  confidence: "confirmed" | "possible";
  score: number;
  reason: MatchReason;
  client: ClientLookupRecord;
};

type LeadCandidate = {
  entityType: "lead";
  confidence: "confirmed" | "possible";
  score: number;
  reason: MatchReason;
  lead: LeadLookupRecord;
};

type IntakeCandidate = {
  entityType: "historical_intake";
  confidence: "confirmed" | "possible";
  score: number;
  reason: MatchReason;
  intakeSubmission: Omit<IntakeLookupRecord, "lead">;
  hasLinkedClient: boolean;
};

type CandidateMatch = ClientCandidate | LeadCandidate | IntakeCandidate;

function buildScore(params: {
  storedEmail: string | null | undefined;
  storedPhone: string | null | undefined;
  storedPassport: string | null | undefined;
  email: string | null;
  phone: string | null;
  phoneDigits: string | null;
  passportNumber: string | null;
  branchId: string | null;
  storedBranchId: string | null | undefined;
}) {
  const {
    storedEmail,
    storedPhone,
    storedPassport,
    email,
    phone,
    phoneDigits,
    passportNumber,
    branchId,
    storedBranchId,
  } = params;

  const reasons: MatchReason[] = [];
  let score = 0;

  const exactPassport =
    passportNumber &&
    normalizeStoredPassport(storedPassport) === passportNumber;

  const exactEmail =
    email &&
    storedEmail &&
    storedEmail.toLowerCase() === email;

  const exactPhone =
    phone &&
    storedPhone &&
    storedPhone.trim() === phone;

  const normalizedPhone =
    !exactPhone &&
    phoneDigits &&
    storedPhone &&
    normalizePhoneDigits(storedPhone) === phoneDigits;

  if (exactPassport) {
    score += 100;
    reasons.push("passport_exact");
  }

  if (exactEmail) {
    score += 95;
    reasons.push("email_exact");
  }

  if (exactPhone) {
    score += 90;
    reasons.push("phone_exact");
  }

  if (normalizedPhone) {
    score += 60;
    reasons.push("phone_normalized");
  }

  if ([exactPassport, exactEmail, exactPhone].filter(Boolean).length >= 2) {
    score += 15;
    reasons.unshift("multi_field_exact");
  }

  if (branchId && storedBranchId && branchId === storedBranchId) {
    score += 5;
  }

  if (score <= 0) return null;

  return {
    score,
    reason: reasons[0] ?? (normalizedPhone ? "phone_normalized" : "phone_exact"),
    confidence: score >= 90 ? ("confirmed" as const) : ("possible" as const),
  };
}

function sortMatches(a: CandidateMatch, b: CandidateMatch) {
  if (b.score !== a.score) return b.score - a.score;

  const priority = {
    client: 0,
    lead: 1,
    historical_intake: 2,
  } as const;

  return priority[a.entityType] - priority[b.entityType];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const branchId = normalizeString(body.branchId);
    const phone = normalizeString(body.phone);
    const email = normalizeEmail(body.email);
    const passportNumber = normalizePassport(body.passportNumber);
    const phoneDigits = normalizePhoneDigits(body.phone);

    if (!phone && !email && !passportNumber) {
      return NextResponse.json(
        { error: "Phone, email, or passport number is required" },
        { status: 400 }
      );
    }

    const [clients, leads, intakeSubmissions] = await Promise.all([
      prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passport: true,
          branchId: true,
        },
        take: 200,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.lead.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passportNumber: true,
          branchId: true,
          clientId: true,
          intakeSubmissionId: true,
          lastActivityAt: true,
        },
        take: 200,
        orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
      }),

      prisma.intakeFormSubmission.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passportNumber: true,
          branchId: true,
          clientId: true,
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              passportNumber: true,
              branchId: true,
              clientId: true,
              intakeSubmissionId: true,
              lastActivityAt: true,
            },
          },
        },
        take: 200,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const clientMatches: ClientCandidate[] = clients
      .map((client) => {
        const result = buildScore({
          storedEmail: client.email,
          storedPhone: client.phone,
          storedPassport: client.passport,
          email,
          phone,
          phoneDigits,
          passportNumber,
          branchId,
          storedBranchId: client.branchId,
        });

        if (!result) return null;

        return {
          entityType: "client" as const,
          confidence: result.confidence,
          score: result.score,
          reason: result.reason,
          client,
        };
      })
      .filter(Boolean) as ClientCandidate[];

    const leadMatches: LeadCandidate[] = leads
      .map((lead) => {
        const result = buildScore({
          storedEmail: lead.email,
          storedPhone: lead.phone,
          storedPassport: lead.passportNumber,
          email,
          phone,
          phoneDigits,
          passportNumber,
          branchId,
          storedBranchId: lead.branchId,
        });

        if (!result) return null;

        return {
          entityType: "lead" as const,
          confidence: result.confidence,
          score: result.score,
          reason: result.reason,
          lead,
        };
      })
      .filter(Boolean) as LeadCandidate[];

    const intakeMatches: IntakeCandidate[] = intakeSubmissions
      .filter((submission) => !submission.lead)
      .map((submission) => {
        const result = buildScore({
          storedEmail: submission.email,
          storedPhone: submission.phone,
          storedPassport: submission.passportNumber,
          email,
          phone,
          phoneDigits,
          passportNumber,
          branchId,
          storedBranchId: submission.branchId,
        });

        if (!result) return null;

        return {
          entityType: "historical_intake" as const,
          confidence: result.confidence,
          score: result.score,
          reason: result.reason,
          intakeSubmission: {
            id: submission.id,
            firstName: submission.firstName,
            lastName: submission.lastName,
            email: submission.email,
            phone: submission.phone,
            passportNumber: submission.passportNumber,
            branchId: submission.branchId,
            clientId: submission.clientId,
          },
          hasLinkedClient: Boolean(submission.clientId),
        };
      })
      .filter(Boolean) as IntakeCandidate[];

    const inferredLeadMatches: LeadCandidate[] = intakeSubmissions
      .filter((submission) => Boolean(submission.lead))
      .map((submission) => {
        if (!submission.lead) return null;

        const result = buildScore({
          storedEmail: submission.email ?? submission.lead.email,
          storedPhone: submission.phone ?? submission.lead.phone,
          storedPassport:
            submission.passportNumber ?? submission.lead.passportNumber,
          email,
          phone,
          phoneDigits,
          passportNumber,
          branchId,
          storedBranchId: submission.branchId ?? submission.lead.branchId,
        });

        if (!result) return null;

        return {
          entityType: "lead" as const,
          confidence: result.confidence,
          score: result.score,
          reason: result.reason,
          lead: submission.lead,
        };
      })
      .filter(Boolean) as LeadCandidate[];

    const dedupedLeadMap = new Map<string, LeadCandidate>();
    for (const match of [...leadMatches, ...inferredLeadMatches]) {
      const existing = dedupedLeadMap.get(match.lead.id);
      if (!existing || match.score > existing.score) {
        dedupedLeadMap.set(match.lead.id, match);
      }
    }

    const allMatches: CandidateMatch[] = [
      ...clientMatches,
      ...Array.from(dedupedLeadMap.values()),
      ...intakeMatches,
    ].sort(sortMatches);

    const confirmedMatch = allMatches.find(
      (match) => match.confidence === "confirmed"
    );

    if (confirmedMatch?.entityType === "client") {
      return NextResponse.json({
        success: true,
        mode: "existing_client",
        allowFormFill: false,
        matchConfidence: confirmedMatch.confidence,
        matchReason: confirmedMatch.reason,
        client: confirmedMatch.client,
        possibleMatches: allMatches
          .filter((match) => match !== confirmedMatch)
          .slice(0, 3),
      });
    }

    if (confirmedMatch?.entityType === "lead") {
      return NextResponse.json({
        success: true,
        mode: "existing_lead",
        allowFormFill: false,
        matchConfidence: confirmedMatch.confidence,
        matchReason: confirmedMatch.reason,
        lead: confirmedMatch.lead,
        possibleMatches: allMatches
          .filter((match) => match !== confirmedMatch)
          .slice(0, 3),
      });
    }

    if (confirmedMatch?.entityType === "historical_intake") {
      return NextResponse.json({
        success: true,
        mode: "historical_intake_match",
        allowFormFill: true,
        matchConfidence: confirmedMatch.confidence,
        matchReason: confirmedMatch.reason,
        hasLinkedClient: confirmedMatch.hasLinkedClient,
        intakeSubmission: confirmedMatch.intakeSubmission,
        possibleMatches: allMatches
          .filter((match) => match !== confirmedMatch)
          .slice(0, 3),
        message:
          "A previous intake record was found, but no active lead is linked yet. You can continue to route this into the live lead queue.",
      });
    }

    const possibleMatches = allMatches
      .filter((match) => match.confidence === "possible")
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      mode: "new",
      allowFormFill: true,
      possibleMatches,
      message:
        possibleMatches.length > 0
          ? "No confirmed existing record found. Possible matches are available for review."
          : "No reliable existing record found.",
    });
  } catch (error) {
    console.error("POST /api/check-in/lookup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to lookup check-in",
      },
      { status: 500 }
    );
  }
}