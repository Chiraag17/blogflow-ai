import { PrismaClient, BlogStatus, ApprovalStatus, PublishingStatus, WorkflowStatus } from '@prisma/client';
import { encryptCredential } from '../services/security/encryption.service';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // 1. Create or upsert default User
  const user = await prisma.user.upsert({
    where: { email: 'admin@blogflow.ai' },
    update: {},
    create: {
      id: 'user-1',
      name: 'Alex Rivera',
      email: 'admin@blogflow.ai',
      role: 'ADMIN',
    },
  });

  // 2. Create Websites
  const website1 = await prisma.website.upsert({
    where: { id: 'website-1' },
    update: {},
    create: {
      id: 'website-1',
      userId: user.id,
      name: 'TechPulse AI',
      url: 'https://techpulse.ai',
      niche: 'Artificial Intelligence & Software Engineering',
      targetAudience: 'Software Engineers, Architects, and Tech Founders',
      writingTone: 'Authoritative, technical yet engaging',
      preferredKeywords: ['AI Agents', 'LLM Architecture', 'Autonomous Workflows', 'Vector Databases'],
      excludedTopics: ['Cryptocurrency', 'Gambling'],
      websiteContext: {
        brandVoice: 'Authoritative technical thought leadership',
        targetReadingLevel: 'Advanced Developer',
        monetization: 'B2B SaaS Subscriptions',
      },
      connectionStatus: 'ACTIVE',
    },
  });

  const website2 = await prisma.website.upsert({
    where: { id: 'website-2' },
    update: {},
    create: {
      id: 'website-2',
      userId: user.id,
      name: 'CloudNative Devs',
      url: 'https://cloudnative.dev',
      niche: 'DevOps & Cloud Computing',
      targetAudience: 'DevOps Engineers, Cloud Architects',
      writingTone: 'Educational and hands-on',
      preferredKeywords: ['Kubernetes', 'Serverless', 'Terraform', 'Microservices'],
      excludedTopics: ['General Consumer Tech'],
      websiteContext: {
        brandVoice: 'Hands-on tutorials and system design breakdowns',
      },
      connectionStatus: 'ACTIVE',
    },
  });

  // 3. Create Automation Config
  await prisma.automationConfig.upsert({
    where: { websiteId: website1.id },
    update: {},
    create: {
      websiteId: website1.id,
      enabled: true,
      researchFrequency: 'WEEKLY',
      generationFrequency: 'WEEKLY',
      preferredPublishingDays: ['Tuesday', 'Thursday'],
      preferredPublishingTime: '10:00',
      timezone: 'UTC',
      maxBlogsPerWeek: 2,
      requireHumanApproval: true,
    },
  });

  // 4. Create CMS Integration with encrypted credentials
  const encryptedPassword = encryptCredential('test_wp_app_pwd_1234_5678');
  const cmsIntegration1 = await prisma.cMSIntegration.upsert({
    where: { id: 'cms-1' },
    update: {},
    create: {
      id: 'cms-1',
      websiteId: website1.id,
      provider: 'WORDPRESS',
      cmsUrl: 'https://techpulse.ai',
      username: 'techpulse_editor',
      encryptedCredentials: encryptedPassword,
      connectionStatus: 'CONNECTED',
      lastConnectedAt: new Date(),
    },
  });

  // 5. Create Research Report
  const research1 = await prisma.researchReport.upsert({
    where: { id: 'research-1' },
    update: {},
    create: {
      id: 'research-1',
      websiteId: website1.id,
      topic: 'Autonomous Multi-Agent AI Workflows in 2026',
      overview: 'An extensive evaluation of multi-agent architectures using LangGraph and stateful orchestration for autonomous software engineering and content workflows.',
      keyInsights: [
        'Stateful cyclical graphs outperform linear chaining for multi-step reasoning.',
        'Human-in-the-loop interruption ensures zero hallucinated live actions.',
        'Durable checkpointing with PostgreSQL enables long-running agent state recovery.',
      ],
      importantFacts: [
        'LangGraph JS provides native checkpointing and interrupt/resume hooks.',
        'Enterprise adoption of multi-agent workflows grew by 180% year-over-year.',
      ],
      suggestedHeadings: [
        'Introduction: Beyond Linear LLM Prompts',
        'Architecture of Multi-Agent State Graphs',
        'Persistent Checkpointing and Server Restart Resilience',
        'Human Approval as an Immutable Security Boundary',
        'Conclusion and Best Practices',
      ],
      keywords: ['multi-agent workflows', 'LangGraph orchestration', 'autonomous AI', 'checkpoint persistence'],
      sources: [
        {
          title: 'LangGraph Architecture Documentation',
          url: 'https://docs.langchain.com/langgraph',
          relevance: 'Primary architectural reference for stateful graphs',
          summary: 'Overview of StateGraph, checkpointing, and interrupt mechanics.',
        },
        {
          title: 'State of Autonomous AI Systems 2026',
          url: 'https://arxiv.org/abs/2402.01234',
          relevance: 'Academic survey on agentic workflow reliability',
          summary: 'Analysis of human-in-the-loop controls for production autonomy.',
        },
      ],
      status: 'COMPLETED',
    },
  });

  // 6. Create Blogs in various statuses
  // Blog 1: PENDING_APPROVAL
  const blog1 = await prisma.blog.upsert({
    where: { id: 'blog-1' },
    update: {},
    create: {
      id: 'blog-1',
      websiteId: website1.id,
      researchReportId: research1.id,
      title: 'Autonomous Multi-Agent AI Workflows in 2026: The Complete Engineering Guide',
      subtitle: 'How modern stateful graph orchestration replaces brittle linear chains in production applications.',
      slug: 'autonomous-multi-agent-ai-workflows-2026',
      content: `## Introduction: Beyond Linear LLM Prompts

Modern enterprise automation requires systems that can plan, reflect, inspect real-time data, and recover gracefully from edge-case failures. While early generative AI prototypes relied on simple single-turn prompts or rigid sequential pipelines, production engineering has decisively shifted toward stateful multi-agent graphs.

### Architecture of Multi-Agent State Graphs

Unlike traditional state machines, multi-agent graphs represent distinct specialized responsibilities—such as web research, content drafting, factual consistency checks, and CMS publishing—as interconnected nodes in an explicit directed graph.

* **Research Agent:** Performs deep SERP queries and synthesizes factual sources.
* **Writer Agent:** Assembles clean, structured Markdown adhering to editorial guidelines.
* **Quality Agent:** Audits keyword density, reading complexity, and verifies assertions against primary research sources.

### Human Approval as an Immutable Security Boundary

True autonomy does not mean unchecked authority. In high-stakes publication environments, a mandatory human approval checkpoint interrupts the state graph, persisting state in PostgreSQL until an authorized editor reviews the article and decides to approve, reject, or request revisions.

## Conclusion

By orchestrating specialized agents with durable PostgreSQL state persistence, modern organizations achieve rapid autonomous publication while maintaining strict human governance.`,
      introduction: 'Modern enterprise automation requires systems that can plan, reflect, inspect real-time data, and recover gracefully from edge-case failures.',
      conclusion: 'By orchestrating specialized agents with durable PostgreSQL state persistence, modern organizations achieve rapid autonomous publication while maintaining strict human governance.',
      faqs: [
        {
          question: 'What is LangGraph and why is it preferred over linear chains?',
          answer: 'LangGraph allows cyclical execution, state persistence across server restarts, and native human-in-the-loop interrupts.',
        },
        {
          question: 'Can the AI publish to WordPress without human approval?',
          answer: 'No. BlogFlow AI enforces a mandatory database-level human approval checkpoint before any publishing API request can execute.',
        },
      ],
      metaTitle: 'Autonomous Multi-Agent AI Workflows in 2026 | TechPulse',
      metaDescription: 'Learn how to build production-grade multi-agent autonomous workflows with persistent checkpointing and human-in-the-loop security.',
      focusKeyword: 'multi-agent AI workflows',
      secondaryKeywords: ['LangGraph orchestration', 'stateful agents', 'autonomous publishing'],
      tags: ['AI', 'LangGraph', 'Architecture', 'TypeScript'],
      category: 'Artificial Intelligence',
      estimatedReadingTime: 6,
      status: BlogStatus.PENDING_APPROVAL,
    },
  });

  // Blog 2: PUBLISHED
  const blog2 = await prisma.blog.upsert({
    where: { id: 'blog-2' },
    update: {},
    create: {
      id: 'blog-2',
      websiteId: website1.id,
      title: 'Building Next-Gen Serverless Architectures on Edge Compute',
      subtitle: 'Minimizing latency and cold starts with modern edge runtime strategies.',
      slug: 'building-next-gen-serverless-architectures-edge',
      content: `## The Evolution of Edge Computing

Edge computing brings application logic and data caching physically closer to users across global Points of Presence (PoPs). In this article, we examine how edge runtimes solve cold start challenges.

### Performance Benchmarks and Zero Cold Starts

By utilizing lightweight V8 isolates instead of containerized microVMs, edge functions initialize in sub-millisecond timeframes, delivering consistent global latencies under 50ms.`,
      metaTitle: 'Building Next-Gen Serverless Architectures on Edge Compute',
      metaDescription: 'Discover how edge runtimes and V8 isolates eliminate cold starts and accelerate global SaaS performance.',
      focusKeyword: 'edge compute serverless',
      secondaryKeywords: ['V8 isolates', 'edge runtime', 'cloud performance'],
      category: 'Cloud Architecture',
      estimatedReadingTime: 5,
      status: BlogStatus.PUBLISHED,
    },
  });

  // 7. Add Quality Report for Blog 1
  await prisma.qualityReport.create({
    data: {
      blogId: blog1.id,
      grammarStatus: 'PASSED',
      readabilityScore: 92.5,
      seoScore: 89.0,
      contentQualityScore: 94.0,
      factCheckingResults: [
        { claim: 'LangGraph provides native state persistence with checkpointers.', status: 'VERIFIED', source: 'https://docs.langchain.com/langgraph' },
        { claim: 'Human approval interruption halts graph execution until resumed.', status: 'VERIFIED', source: 'https://docs.langchain.com/langgraph' },
      ],
      issues: [],
      suggestions: [
        'Consider linking to the official PostgreSQL documentation for connection pooling best practices.',
      ],
    },
  });

  // 8. Add Approval Record for Blog 1
  await prisma.approval.create({
    data: {
      blogId: blog1.id,
      reviewerId: user.id,
      status: ApprovalStatus.PENDING,
      comments: 'Generated article awaiting final editorial review before WordPress publication.',
    },
  });

  // 9. Add Publishing Record for Blog 2
  await prisma.publishingRecord.upsert({
    where: {
      blogId_integrationId: {
        blogId: blog2.id,
        integrationId: cmsIntegration1.id,
      },
    },
    update: {},
    create: {
      blogId: blog2.id,
      integrationId: cmsIntegration1.id,
      externalPostId: '1042',
      publishedUrl: 'https://techpulse.ai/building-next-gen-serverless-architectures-edge',
      publishingStatus: PublishingStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
  });

  // 10. Add Workflow Execution for Blog 1
  await prisma.workflowExecution.upsert({
    where: { graphThreadId: 'thread-techpulse-blog-1' },
    update: {},
    create: {
      userId: user.id,
      websiteId: website1.id,
      blogId: blog1.id,
      workflowType: 'AUTONOMOUS_BLOG_CREATION',
      graphThreadId: 'thread-techpulse-blog-1',
      currentNode: 'humanApproval',
      status: WorkflowStatus.PAUSED,
      startedAt: new Date(Date.now() - 3600000), // 1 hr ago
    },
  });

  console.log('✅ Seed completed successfully!');
}

if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
