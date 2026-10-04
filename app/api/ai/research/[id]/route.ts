import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/services/research/research.service';
import { ApiResponse, DetailedResearchReport } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = researchService.getResearchReportById(id);

    if (!report) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Research report with id "${id}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<DetailedResearchReport>>({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Error fetching research report.' },
      { status: 500 }
    );
  }
}
