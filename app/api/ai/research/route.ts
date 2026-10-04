import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/services/research/research.service';
import { ApiResponse, DetailedResearchReport } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.topic || body.topic.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'A research topic is required.' },
        { status: 400 }
      );
    }

    const report = await researchService.conductResearch({
      topic: body.topic.trim(),
      niche: body.niche,
      targetAudience: body.targetAudience,
      keywords: body.keywords,
      maxQueries: body.maxQueries || 3,
    });

    return NextResponse.json<ApiResponse<DetailedResearchReport>>({
      success: true,
      data: report,
      message: 'Multi-source web research completed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Web research failed.' },
      { status: 500 }
    );
  }
}
