import { NextRequest, NextResponse } from 'next/server';
import { qualityAnalysisService } from '@/services/content/quality-analysis.service';
import { ApiResponse, DetailedQualityReport } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.articleContent) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Article content is required for quality analysis.' },
        { status: 400 }
      );
    }

    const report = await qualityAnalysisService.analyzeQuality({
      articleContent: body.articleContent,
      topic: body.topic,
      focusKeyword: body.focusKeyword,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      researchText: body.researchText,
    });

    return NextResponse.json<ApiResponse<DetailedQualityReport>>({
      success: true,
      data: report,
      message: 'Quality and factual consistency audit completed.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Quality analysis failed.' },
      { status: 500 }
    );
  }
}
