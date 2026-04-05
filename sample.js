import OpenAI from "openai";

// Token diambil dari environment variable GitHub Actions
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4o-mini"; // Gunakan gpt-4o-mini atau gpt-4o yang mana tersedia

export async function main() {
  // Pastikan token ada sebelum menjalankan
  if (!token) {
    console.error("Token tidak ditemukan! Pastikan GITHUB_TOKEN sudah diatur.");
    return;
  }

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const response = await client.chat.completions.create({
    messages: [
        { role: "system", content: "Anda adalah bot otomatis internal repo." },
        { role: "user", content: "Jelaskan status repositori ini dan kelola apa saja yang dibutuhkan repository ini." }
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: model
    });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
    
