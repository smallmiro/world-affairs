import type { AnalysisRepositoryPort } from "../../domain/analysis/ports";
import type { AiAnalysis } from "../../domain/analysis/entities";
import type { AnalysisTargetType, Language, SentimentLabel } from "../../shared/types";
import type { PrismaClient } from "../../generated/prisma/client";

function toAiAnalysis(row: Record<string, unknown>): AiAnalysis {
  return {
    id: row.id as string,
    targetType: row.targetType as AnalysisTargetType,
    targetId: (row.targetId as string) ?? null,
    type: row.type as AiAnalysis["type"],
    result: {
      en: row.resultEn as string,
      ko: row.resultKo as string,
      ja: row.resultJa as string,
    },
    sentiment: (row.sentiment as number) ?? null,
    sentimentLabel: null,
    model: row.model as string,
    createdAt: new Date(row.createdAt as string | Date),
  };
}

export class AnalysisRepository implements AnalysisRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  async save(analysis: AiAnalysis): Promise<void> {
    await this.prisma.aiAnalysis.create({
      data: {
        id: analysis.id,
        targetType: analysis.targetType,
        targetId: analysis.targetId,
        type: analysis.type,
        resultEn: analysis.result.en,
        resultKo: analysis.result.ko,
        resultJa: analysis.result.ja,
        sentiment: analysis.sentiment,
        model: analysis.model,
      },
    });
  }

  async findByTarget(
    targetType: AnalysisTargetType,
    targetId: string,
  ): Promise<AiAnalysis[]> {
    const rows = await this.prisma.aiAnalysis.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toAiAnalysis(r as unknown as Record<string, unknown>));
  }

  async findLatestBriefing(lang: Language): Promise<AiAnalysis | null> {
    const row = await this.prisma.aiAnalysis.findFirst({
      where: { type: "briefing" },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return toAiAnalysis(row as unknown as Record<string, unknown>);
  }
}
