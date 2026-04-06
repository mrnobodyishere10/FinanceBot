import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "gpt-4o-mini";

const octokit = new Octokit({ auth: token });

export async function main() {
  if (!token) {
    console.error("Token tidak ditemukan! Pastikan GITHUB_TOKEN sudah diatur.");
    return;
  }

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const repoFull = process.env.GITHUB_REPOSITORY || ""; 
  const [owner, repo] = repoFull.split("/");
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY || "Tidak ada deskripsi spesifik.";

  console.log(`Menganalisis Issue #${issueNumber} pada ${repoFull}...`);

  try {
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Anda adalah bot pengelola repositori otonom dan bisa melakukan segalanya berdasarkan pengalaman dan pengetahuan anda yang luas. Tugas Anda:
          1. Jelaskan status masalah dan apa yang dibutuhkan repositori ini.
          2. Tentukan satu atau dua label yang paling relevan secara bebas (contoh: 'bug', 'ui-fix', 'security', 'python-script', dll).
          3. Analisa anda harus berdasarkan data dan fakta yang berasal dari seluruh informasi dan pengetahuan yang ada di dunia ini
          Format Respon:
          [LABEL: nama-label-1, nama-label-2]
          Isi analisis dan solusi Anda di sini...` 
        },
        { 
          role: "user", 
          content: `Konteks Masalah dan Hasil analisa: ${issueBody}` 
        }
      ],
      temperature: 0.8,
      model: modelName
    });

    const aiRawResponse = response.choices[0].message.content;

    // Ekstraksi Label (bebas sesuai imajinasi AI)
    const labelMatch = aiRawResponse.match(/\[LABEL:\s*(.*?)\]/);
    const labels = labelMatch 
      ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) 
      : [];
    
    // Menghilangkan bagian tag [LABEL] dari teks utama untuk komentar
    const cleanAnswer = aiRawResponse.replace(/\[LABEL:.*?\]/, "").trim();

    if (issueNumber && owner && repo) {
      // 1. Kirim Komentar ke Issue
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(issueNumber),
        body: `### 🤖 AI Repository Assistant\n\n${cleanAnswer}\n\n---\n_Analisis otomatis via GitHub Models_`
      });

      // 2. Tambahkan Label (AI bebas menentukan nama labelnya)
      if (labels.length > 0) {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: parseInt(issueNumber),
          labels: labels
        });
        console.log(`Labels ditambahkan: ${labels.join(", ")}`);
      }
    }

  } catch (err) {
    console.error("Error pada eksekusi bot:", err);
    process.exit(1);
  }
}

main();

