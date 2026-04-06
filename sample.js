import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

// Konfigurasi Kredensial & Endpoint
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "gpt-4o-mini"; // Pastikan ID model sesuai di GitHub Marketplace

// Inisialisasi Octokit untuk akses fitur GitHub (Issue, Label, Comment)
const octokit = new Octokit({ auth: token });

export async function main() {
  // 1. Validasi Token
  if (!token) {
    console.error("Token tidak ditemukan! Pastikan GITHUB_TOKEN sudah diatur di Secrets.");
    return;
  }

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  // 2. Ambil Konteks dari GitHub Actions (Environment Variables)
  const repoFull = process.env.GITHUB_REPOSITORY || ""; 
  const [owner, repo] = repoFull.split("/");
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY || "Tidak ada deskripsi spesifik.";

  console.log(`Menjalankan AI untuk Repo: ${repoFull} pada Issue #${issueNumber}`);

  try {
    // 3. Panggil GitHub Models (Logika AI)
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Anda adalah bot otomatis internal repo yang bertugas menganalisis status dan mengelola kebutuhan repositori." 
        },
        { 
          role: "user", 
          content: `Konteks Issue: ${issueBody}\n\nTugas: Jelaskan status repositori ini berdasarkan issue tersebut dan berikan saran pengelolaan yang dibutuhkan.` 
        }
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: modelName
    });

    const aiContent = response.choices[0].message.content;

    // 4. Output ke Console (Log Actions)
    console.log("--- RESPONS AI ---");
    console.log(aiContent);

    // 5. Aksi Nyata: Balas Komentar di Issue (Jika dipicu oleh Issue)
    if (issueNumber && owner && repo) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(issueNumber),
        body: `### 🤖 AI Repository Assistant\n\n${aiContent}\n\n---\n_Respon ini dihasilkan otomatis menggunakan GitHub Models._`
      });
      console.log(`Berhasil mengirim balasan ke Issue #${issueNumber}`);
    }

  } catch (err) {
    console.error("Sampel mengalami error:", err);
    process.exit(1);
  }
}

// Menjalankan fungsi utama
main();
