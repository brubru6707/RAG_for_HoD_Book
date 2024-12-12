import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST = process.env.PINECONE_HOST;

const openai = new OpenAI();
const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const index = pc.Index("handfullofdust", PINECONE_HOST);

export async function POST(req) {
  try {
    const { question } = await req.json();
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    console.log("maybe?");
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const pineconeResponse = await index.namespace("").query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    const relevantContexts = pineconeResponse.matches.map(
      (match) => match.metadata.text
    );
    // Combine context for the final prompt
    const contextString = relevantContexts.join("\n");
    const prompt = `Based on the following context, answer the question:\n\n${contextString}\n\nQuestion: ${question}\nAnswer:`;

    console.log("this is the prompt " + prompt);

    // Generate response from OpenAI
    const completionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = completionResponse.choices[0].message["content"];

    return new Response(JSON.stringify({ answer: answer, prompt: prompt }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
