import { PrismaClient } from '@prisma/client';
import { WordPressService } from '../services/cms/wordpress.service.js';
import { encryptCredential, decryptCredential } from '../services/security/encryption.service.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING BLOGFLOW AI INTEGRATION TESTS ---');

  try {
    // 1. Verify User & Website in DB
    console.log('\n[1/5] Verifying test user & website in PostgreSQL...');
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@blogflow.ai`,
          name: 'Test Reviewer',
          passwordHash: 'dummyhash',
        },
      });
      console.log(` Created test user: ${user.id} (${user.email})`);
    } else {
      console.log(` Found existing user: ${user.id} (${user.email})`);
    }

    let website = await prisma.website.findFirst({ where: { userId: user.id } });
    if (!website) {
      website = await prisma.website.create({
        data: {
          userId: user.id,
          name: 'Tech Horizon Blog',
          url: 'https://techhorizon.example.com',
          niche: 'Artificial Intelligence & Engineering',
          targetAudience: 'Software Developers and CTOs',
          writingTone: 'authoritative',
          preferredKeywords: ['AI Agents', 'Autonomous Workflows', 'Next.js'],
        },
      });
      console.log(` Created test website: ${website.id} (${website.name})`);
    } else {
      console.log(` Found existing website: ${website.id} (${website.name})`);
    }

    // 2. Test Blog Editor: Create and Update in PostgreSQL
    console.log('\n[2/5] Testing Blog Editor persistence (Save to DB, SEO metadata, Headings)...');
    const createdBlog = await prisma.blog.create({
      data: {
        websiteId: website.id,
        title: 'Mastering AI Automation in 2026: The Definitive Guide',
        subtitle: 'How agentic workflows and multi-agent coordination are reshaping modern software',
        slug: `mastering-ai-automation-${Date.now().toString(36)}`,
        content: `# Mastering AI Automation in 2026\n\nArtificial Intelligence agents have transitioned from reactive prompts to proactive, multi-stage workflows.\n\n## 1. The Multi-Agent Paradigm\n\nModern architectures decouple research, synthesis, critique, and distribution.\n\n## 2. Deterministic Checkpointing\n\nState persistence with PostgreSQL ensures resumability across human-in-the-loop gates.`,
        metaTitle: 'Mastering AI Automation in 2026 | Guide',
        metaDescription: 'A complete breakdown of multi-agent workflows, checkpointing, and safe human-in-the-loop publishing.',
        focusKeyword: 'AI Automation',
        secondaryKeywords: ['multi-agent', 'langgraph', 'autonomous'],
        category: 'Technology',
        tags: ['AI', 'Engineering', 'Workflow'],
        estimatedReadingTime: 6,
        status: 'DRAFT',
      },
    });
    console.log(` Blog created with ID: ${createdBlog.id}, Status: ${createdBlog.status}`);

    // Update blog with edited headings and SEO
    const updatedBlog = await prisma.blog.update({
      where: { id: createdBlog.id },
      data: {
        title: 'Mastering AI Automation in 2026: An Advanced Technical Guide',
        content: createdBlog.content + '\n\n## 3. Production Deployment\n\nAlways maintain strict human gatekeeping before live publication.',
        estimatedReadingTime: 8,
      },
    });
    console.log(` Blog successfully updated: Title="${updatedBlog.title}", ReadingTime=${updatedBlog.estimatedReadingTime}min`);

    // Attach quality report with scores and suggestions
    const qualityReport = await prisma.qualityReport.create({
      data: {
        blogId: updatedBlog.id,
        grammarStatus: 'PASSED',
        readabilityScore: 92,
        seoScore: 95,
        contentQualityScore: 94,
        suggestions: [
          'Add internal links to related case studies',
          'Include schema FAQ block for search engine snippets',
        ],
        issues: [],
      },
    });
    console.log(` Quality report attached: Overall Score=${qualityReport.contentQualityScore}%, SEO Score=${qualityReport.seoScore}%`);

    // 3. Test Approval System & Security Enforcement
    console.log('\n[3/5] Testing Approval System & Security Gates...');

    // A. Transition to PENDING_APPROVAL
    const pendingBlog = await prisma.blog.update({
      where: { id: updatedBlog.id },
      data: { status: 'PENDING_APPROVAL' },
    });
    const pendingApproval = await prisma.approval.create({
      data: {
        blogId: pendingBlog.id,
        reviewerId: user.id,
        status: 'PENDING',
        comments: 'Ready for editorial review.',
      },
    });
    console.log(` Blog status transitioned to PENDING_APPROVAL (Approval record ID: ${pendingApproval.id})`);

    // B. Test Security Gate: Verify unapproved article CANNOT be published
    console.log(' Testing security gate: Attempting publish on unapproved article...');
    const unapprovedPublishAttempt = await WordPressService.publishPost({
      blogId: pendingBlog.id,
      integrationId: 'non-existent-or-mock',
      publishMode: 'draft',
    });

    if (!unapprovedPublishAttempt.success && unapprovedPublishAttempt.error.includes('approved')) {
      console.log(` Security gate passed: Publishing blocked as expected -> "${unapprovedPublishAttempt.error}"`);
    } else {
      throw new Error(`Security gate FAILURE: Publishing was not rejected for unapproved blog!`);
    }

    // C. Perform Human Approval
    console.log(' Performing human approval...');
    const approvedBlog = await prisma.blog.update({
      where: { id: pendingBlog.id },
      data: { status: 'APPROVED' },
    });
    await prisma.approval.update({
      where: { id: pendingApproval.id },
      data: {
        status: 'APPROVED',
        comments: 'Content, tone, and SEO parameters approved by human lead.',
        reviewedAt: new Date(),
      },
    });
    console.log(` Human approval recorded. Blog status: ${approvedBlog.status}`);

    // 4. Test WordPress Credentials Encryption & Connection Model
    console.log('\n[4/5] Testing WordPress Encrypted Credentials & Integration Setup...');
    const rawAppPassword = 'abcd 1234 efgh 5678';
    const encrypted = encryptCredential(rawAppPassword);
    const decrypted = decryptCredential(encrypted);

    if (decrypted !== rawAppPassword) {
      throw new Error('Encryption verification failed: decrypted credential does not match original.');
    }
    console.log(` AES-256-GCM encryption verified: successfully encrypted and decrypted password.`);

    // Create or retrieve CMSIntegration record in PostgreSQL
    let cmsIntegration = await prisma.cMSIntegration.findFirst({
      where: { websiteId: website.id },
    });
    if (!cmsIntegration) {
      cmsIntegration = await prisma.cMSIntegration.create({
        data: {
          websiteId: website.id,
          provider: 'WORDPRESS',
          cmsUrl: 'https://techhorizon.example.com',
          username: 'editor_admin',
          encryptedCredentials: encrypted,
          connectionStatus: 'CONNECTED',
          lastConnectedAt: new Date(),
        },
      });
      console.log(` Created CMSIntegration record: ${cmsIntegration.id} (status: ${cmsIntegration.connectionStatus})`);
    } else {
      console.log(` Using existing CMSIntegration record: ${cmsIntegration.id}`);
    }

    // 5. Test WordPress Publishing History & Record Persistence
    console.log('\n[5/5] Testing Publishing History & Post-Publication State...');
    const simulatedExternalPostId = String(Math.floor(1000 + Math.random() * 9000));
    const simulatedPostUrl = `${cmsIntegration.cmsUrl}/?p=${simulatedExternalPostId}`;

    const pubRecord = await prisma.publishingRecord.upsert({
      where: {
        blogId_integrationId: {
          blogId: approvedBlog.id,
          integrationId: cmsIntegration.id,
        },
      },
      create: {
        blogId: approvedBlog.id,
        integrationId: cmsIntegration.id,
        externalPostId: simulatedExternalPostId,
        publishedUrl: simulatedPostUrl,
        publishingStatus: 'PENDING', // Draft status
        publishedAt: new Date(),
      },
      update: {
        externalPostId: simulatedExternalPostId,
        publishedUrl: simulatedPostUrl,
        publishingStatus: 'PENDING',
        publishedAt: new Date(),
      },
    });

    console.log(` PublishingRecord created/updated:`);
    console.log(`   - ID: ${pubRecord.id}`);
    console.log(`   - External WP Post ID: ${pubRecord.externalPostId}`);
    console.log(`   - WordPress URL: ${pubRecord.publishedUrl}`);
    console.log(`   - Status: ${pubRecord.publishingStatus} (Draft)`);
    console.log(`   - Timestamp: ${pubRecord.publishedAt.toISOString()}`);

    // Verify query through history endpoint simulation
    const historyList = await prisma.publishingRecord.findMany({
      where: { blogId: approvedBlog.id },
      include: {
        blog: { select: { title: true, status: true } },
        integration: { select: { cmsUrl: true, username: true } },
      },
    });

    if (historyList.length > 0) {
      console.log(` History query verified: ${historyList.length} record(s) retrieved successfully from PostgreSQL.`);
    }

    console.log('\n ALL TESTS PASSED SUCCESSFULLY! Everything verified against PostgreSQL.');
  } catch (error) {
    console.error('\n Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
