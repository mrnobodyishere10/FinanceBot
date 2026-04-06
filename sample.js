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
  
  // Konteks Event (Issue atau PR)
  const issueNumber = process.env.ISSUE_NUMBER;
  const prNumber = process.env.PR_NUMBER;
  const bodyContent = process.env.EVENT_BODY || "Tidak ada deskripsi spesifik.";
  const eventType = prNumber ? "Pull Request" : "Issue";
  const targetNumber = parseInt(issueNumber || prNumber);

  console.log(`Menjalankan ORACLE AI untuk ${eventType} #${targetNumber} di ${repoFull}...`);

  try {
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Anda adalah Autonomous AI Manager, bot pengelola repositori otonom dengan pengetahuan dunia yang luas dan pengalaman yang tinggi.
          Tugas Utama:
          1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
          2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
          3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
          4. Tentukan satu atau lebih label relevan secara BEBAS (creativity allowed).
          
          Format Respon:
          [LABEL: nama-label-1, nama-label-2]
          Isi analisis mendalam dan solusi Anda di sini...` 
        },
        { 
          role: "user", 
          content: `Tipe Event: ${eventType}\nKonteks Masalah & Konten: ${bodyContent}` 
        }
      ],
      temperature: 0.8,
      model: modelName
    });

    const aiRawResponse = response.choices[0].message.content;

    // Ekstraksi Label Otonom
    const labelMatch = aiRawResponse.match(/\[LABEL:\s*(.*?)\]/);
    const labels = labelMatch 
      ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) 
      : [];
    
    const cleanAnswer = aiRawResponse.replace(/\[LABEL:.*?\]/, "").trim();

    if (targetNumber && owner && repo) {
      // 1. Kirim Komentar
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: targetNumber,
        body: `### 🤖 Autonomous AI Manager\n\n${cleanAnswer}\n\n---\n_Analisis otonom berbasis pengetahuan global via GitHub Models_`
      });

      // 2. Tambahkan Label Secara Otonom
      if (labels.length > 0) {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: targetNumber,
          labels: labels
        });
        console.log(`Labels berhasil ditambahkan: ${labels.join(", ")}`);
      }
    }

  } catch (err) {
    console.error("The sample encountered an error:", err);
    process.exit(1);
  }
}

main();
