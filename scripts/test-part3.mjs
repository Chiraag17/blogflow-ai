import assert from 'assert';
import { encryptCredential, decryptCredential, maskSecret } from '../services/security/encryption.service.js';
import { WordPressService } from '../services/cms/wordpress.service.js';
import { blogflowGraph, resumeWorkflowDecision } from '../services/langgraph/workflow.graph.js';
import { StateGraph, Annotation, START, END, interrupt, Command, MemorySaver } from '@langchain/langgraph';

console.log('🧪 Starting BlogFlow AI Part 3 Test Suite...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAll() {
  // ==========================================
  // Suite 1: Security & Credential Encryption
  // ==========================================
  console.log('--- 1. Security & AES-256-GCM Credential Encryption ---');

  runTest('Encrypt and Decrypt WordPress Application Password', () => {
    const rawSecret = 'abcd 1234 efgh 5678';
    const encrypted = encryptCredential(rawSecret);

    assert.notStrictEqual(encrypted, rawSecret, 'Encrypted string must not match raw secret');
    assert.strictEqual(encrypted.split(':').length, 3, 'Cipher package must contain iv:authTag:ciphertext');

    const decrypted = decryptCredential(encrypted);
    assert.strictEqual(decrypted, rawSecret, 'Decrypted secret must match original password');
  });

  runTest('Secret Masking for Safe Telemetry', () => {
    const secret = 'abcd-1234-efgh-5678';
    const masked = maskSecret(secret);
    assert.strictEqual(masked, 'abcd...5678', 'Masked secret should only show prefix and suffix');
  });

  runTest('Corrupted Cipher Package Rejection', () => {
    assert.throws(() => {
      decryptCredential('invalid-format');
    }, /Invalid cipher package format/, 'Must throw on invalid cipher format');
  });

  // ==========================================
  // Suite 2: WordPress REST API Architecture
  // ==========================================
  console.log('\n--- 2. WordPress REST API Service & Idempotency ---');

  runTest('URL Normalization', () => {
    const rawUrl = 'https://my-wordpress-blog.com///';
    const normalized = WordPressService.normalizeUrl(rawUrl);
    assert.strictEqual(normalized, 'https://my-wordpress-blog.com');
  });

  runTest('Basic Auth Header Construction', () => {
    const header = WordPressService.getBasicAuthHeader('editor', 'abcd 1234 efgh');
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf8');
    assert.strictEqual(decoded, 'editor:abcd1234efgh', 'Spaces in application passwords must be trimmed');
  });

  await runAsyncTest('Publishing Security: Unapproved Article Rejection', async () => {
    // Attempting to publish an unapproved article must return an error
    const result = await WordPressService.publishPost({
      blogId: 'non-existent-or-unapproved',
      integrationId: 'any-integration',
      publishMode: 'publish',
    });

    assert.strictEqual(result.success, false, 'Unapproved publishing must be blocked');
    assert.ok(result.error, 'Must provide rejection error message');
  });

  // ==========================================
  // Suite 3: LangGraph Multi-Agent Workflow
  // ==========================================
  console.log('\n--- 3. LangGraph Multi-Agent Workflow & Checkpointing ---');

  await runAsyncTest('LangGraph Human Approval Interrupt and Resumption with Command', async () => {
    const TestState = Annotation.Root({
      status: Annotation({ reducer: (x, y) => y ?? x, default: () => 'draft' }),
      decision: Annotation({ reducer: (x, y) => y ?? x, default: () => '' }),
    });

    const builder = new StateGraph(TestState)
      .addNode('draft', () => ({ status: 'draft_ready' }))
      .addNode('humanApproval', (state) => {
        const humanInput = interrupt({
          message: 'Human review required',
          status: state.status,
        });
        return { decision: humanInput, status: humanInput === 'APPROVE' ? 'approved' : 'rejected' };
      })
      .addNode('publisher', (state) => ({ status: 'published' }))
      .addEdge(START, 'draft')
      .addEdge('draft', 'humanApproval')
      .addConditionalEdges('humanApproval', (state) => (state.decision === 'APPROVE' ? 'publisher' : END))
      .addEdge('publisher', END);

    const checkpointer = new MemorySaver();
    const testGraph = builder.compile({ checkpointer });
    const config = { configurable: { thread_id: 'unit-test-thread-1' } };

    // 1. Initial run must halt at interrupt
    const step1 = await testGraph.invoke({ status: 'started' }, config);
    assert.strictEqual(step1.status, 'draft_ready', 'Draft must be ready before interrupt');

    const stateAfterStep1 = await testGraph.getState(config);
    assert.strictEqual(stateAfterStep1.next[0], 'humanApproval', 'Next node must be humanApproval');
    assert.ok(stateAfterStep1.tasks[0]?.interrupts?.length > 0, 'Interrupt must be present');

    // 2. Resume with Command APPROVE
    const step2 = await testGraph.invoke(new Command({ resume: 'APPROVE' }), config);
    assert.strictEqual(step2.status, 'published', 'Resumed graph must reach publishing node');
    assert.strictEqual(step2.decision, 'APPROVE', 'Decision must record APPROVE');

    // 3. Final state inspection
    const finalState = await testGraph.getState(config);
    assert.strictEqual(finalState.values.status, 'published');
  });

  await runAsyncTest('LangGraph Rejection Termination Edge', async () => {
    const TestState = Annotation.Root({
      status: Annotation({ reducer: (x, y) => y ?? x, default: () => 'draft' }),
      decision: Annotation({ reducer: (x, y) => y ?? x, default: () => '' }),
    });

    const builder = new StateGraph(TestState)
      .addNode('draft', () => ({ status: 'draft_ready' }))
      .addNode('humanApproval', (state) => {
        const humanInput = interrupt({ message: 'Human review required' });
        return { decision: humanInput, status: humanInput === 'APPROVE' ? 'approved' : 'rejected' };
      })
      .addNode('publisher', () => ({ status: 'published' }))
      .addEdge(START, 'draft')
      .addEdge('draft', 'humanApproval')
      .addConditionalEdges('humanApproval', (state) => (state.decision === 'APPROVE' ? 'publisher' : END))
      .addEdge('publisher', END);

    const checkpointer = new MemorySaver();
    const testGraph = builder.compile({ checkpointer });
    const config = { configurable: { thread_id: 'unit-test-thread-reject' } };

    await testGraph.invoke({ status: 'started' }, config);
    const step2 = await testGraph.invoke(new Command({ resume: 'REJECT' }), config);

    assert.strictEqual(step2.status, 'rejected', 'Status must be rejected');
    assert.strictEqual(step2.decision, 'REJECT', 'Decision must be REJECT');

    const finalState = await testGraph.getState(config);
    assert.strictEqual(finalState.values.status, 'rejected', 'Publisher must not be executed');
  });

  // ==========================================
  // Summary
  // ==========================================
  console.log(`\n==========================================`);
  console.log(`Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`==========================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All Part 3 architecture tests passed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runAll().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
