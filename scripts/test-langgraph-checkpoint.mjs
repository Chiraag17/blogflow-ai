// scripts/test-langgraph-checkpoint.mjs
// LangGraph PostgreSQL checkpoint integration test
// Run with: npx dotenv -e .env.local -- node scripts/test-langgraph-checkpoint.mjs

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

(async () => {
  let checkpointer;
  try {
    const connStr = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL;
    if (!connStr) {
      throw new Error(
        "LANGGRAPH_CHECKPOINT_DATABASE_URL is not set in the environment."
      );
    }

    // Initialise PostgreSQL checkpoint saver
    checkpointer = await PostgresSaver.fromConnString(connStr);
    await checkpointer.setup();

    // Define a simple workflow with a single mutable state field
    const StateAnnotation = Annotation.Root({
      message: Annotation({
        reducer: (current, update) => (update !== undefined ? update : current),
        default: () => "",
      }),
    });
    const workflow = new StateGraph(StateAnnotation);

    // Node that appends a suffix to the message
    workflow.addNode("append", async (state) => {
      return {
        message: `${state.message} | Saved by LangGraph`,
      };
    });

    // Connect START → append → END
    workflow.addEdge(START, "append");
    workflow.addEdge("append", END);

    // Compile the graph using the PostgreSQL checkpointer
    const graph = workflow.compile({ checkpointer });

    const threadId = "blogflow-checkpoint-test";

    // Invoke the graph with an initial message
    await graph.invoke(
      { message: "BlogFlow AI test" },
      { configurable: { thread_id: threadId } }
    );

    // Retrieve the persisted state
    const savedState = await graph.getState({
      configurable: { thread_id: threadId },
    });
    const savedMessage = savedState?.values?.message;

    // Verify the saved message matches expectations
    const expected = "BlogFlow AI test | Saved by LangGraph";
    if (savedMessage !== expected) {
      throw new Error(
        `Unexpected saved message: ${savedMessage}. Expected: ${expected}`
      );
    }

    console.log(
      "✅ LangGraph PostgreSQL checkpoint test passed. Message saved and retrieved correctly."
    );
  } catch (err) {
    console.error("❌ LangGraph PostgreSQL checkpoint test failed:", err);
    process.exit(1);
  } finally {
    // Ensure the PostgreSQL connection is closed
    try {
      await checkpointer?.end?.();
    } catch (_) {
      // ignore cleanup errors
    }
  }
})();
