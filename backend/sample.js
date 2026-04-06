require('dotenv').config();
import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"]; // Corrected the environment variable name
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

export async function main() {
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of France?" }
      ],
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 1.0,
      model: model
    });

    if (response.choices && response.choices.length > 0) {
      console.log(response.choices[0].message.content);
    } else {
      console.error("No choices returned in the response.");
    }
  } catch (err) {
    console.error("The sample encountered an error:", err);
  }
}

main();