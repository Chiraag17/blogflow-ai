import { NextRequest, NextResponse } from 'next/server';
import { topicDiscoveryService } from '@/services/research/topic-discovery.service';
import { ApiResponse, ResearchTopic } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.niche && !body.websiteName) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Website niche or name is required for topic discovery.' },
        { status: 400 }
      );
    }

    const topics = await topicDiscoveryService.discoverTopics({
      websiteId: body.websiteId || 'web-default',
      websiteName: body.websiteName || 'My Website',
      niche: body.niche || 'Technology',
      targetAudience: body.targetAudience || 'General Audience',
      keywords: body.keywords || [],
      excludedTopics: body.excludedTopics || [],
      seedTopic: body.seedTopic,
    });

    return NextResponse.json<ApiResponse<ResearchTopic[]>>({
      success: true,
      data: topics,
      message: `Discovered ${topics.length} relevant topics with real web intelligence.`,
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Topic discovery failed.' },
      { status: 500 }
    );
  }
}
