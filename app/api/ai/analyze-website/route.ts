import { NextRequest, NextResponse } from 'next/server';
import { websiteAnalysisService } from '@/services/research/website-analysis.service';
import { ApiResponse, WebsiteAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.url && !body.manualContext) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'A valid website URL or manual context is required for analysis.' },
        { status: 400 }
      );
    }

    const analysis = await websiteAnalysisService.analyzeWebsite({
      websiteId: body.websiteId,
      name: body.name || 'Website',
      url: body.url || '',
      niche: body.niche,
      audience: body.audience,
      tone: body.tone,
      keywords: body.keywords,
      excludedTopics: body.excludedTopics,
      manualContext: body.manualContext,
    });

    return NextResponse.json<ApiResponse<WebsiteAnalysis>>({
      success: true,
      data: analysis,
      message: 'Website context analyzed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Website analysis failed.' },
      { status: 500 }
    );
  }
}
