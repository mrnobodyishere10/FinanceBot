import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import axios from "axios";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";
const octokit = new Octokit({ auth: token });

async function sendTelegram(message) {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!tgToken || !chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });
  } catch (e) { console.error("Telegram Error:", e.message); }
}

export async function main() {
  if (!token) return console.error("GITHUB_TOKEN tidak ditemukan!");
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });
  const repoFull = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repoFull.split("/");
  
  const eventName = process.env.GITHUB_EVENT_NAME;
  const manualCommand = process.env.MANUAL_COMMAND;
  const targetNumber = parseInt(process.env.ISSUE_NUMBER || process.env.PR_NUMBER);
  const bodyContent = process.env.EVENT_BODY || "Strategic Audit.";
  const prDiff = process.env.PR_DIFF || "";

  const systemPrompt = `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan, aman sesuai standar global dan tetap sesuai riset yang telah ada di dunia.

  TUGAS UTAMA:
  1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
  2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
  3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
  4. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). Format: [LABEL: nama1, nama2]

  PROTOKOL INTERVENSI (SURGICAL PRECISION):
  - Perbaiki/ganti/hapus HANYA bagian yang bermasalah. 
  - PRESERVASI: Dilarang keras menghapus kode lama yang sudah berfungsi dengan baik.
  - MODULARITAS: Buat file/folder/sub-folder baru jika analisis menunjukkan hal itu lebih baik untuk mencegah bentrok kode dan meningkatkan optimasi (khususnya Snapdragon 685).
  - AUTO-DOCS: Sinkronkan README.md dan /docs secara otomatis setiap ada perubahan struktur.

  STRUKTUR RESPON:
  - <thinking>: Analisis kritis bagian bermasalah & rencana preservasi kode lama.
  - <decision>: Ya/Tidak untuk push.
  - <metadata>: [LABEL: ...] FILE: path/file CODE: isi_lengkap_termasuk_kode_lama_yang_dipertahankan`;

  try {
    const { data: files } = await octokit.repos.getContent({ owner, repo, path: "" });
    const fileList = files.map(f => f.name).join(", ");

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Repo: ${repo}\nFiles: ${fileList}\nEvent: ${eventName}\nContext: ${prDiff || bodyContent}\nCommand: ${manualCommand || "Audit"}` }
      ],
      model: modelName,
      temperature: 0.2
    });

    const aiRes = response.choices[0].message.content;
    const labelMatch = aiRes.match(/\[LABEL:\s*(.*?)\]/);
    const labels = labelMatch ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) : [];

    const shouldPush = aiRes.toLowerCase().includes("<decision>: ya") || aiRes.toLowerCase().includes("<decision>: yes");
    if (shouldPush) {
      const segments = aiRes.split(/FILE:/g).slice(1);
      for (const segment of segments) {
        const filePath = segment.trim().split("\n")[0].trim();
        const codeContent = segment.split("CODE:")[1]?.split("[LABEL:")[0].split("<metadata>")[0].trim();

        if (filePath && codeContent) {
          let sha = null;
          try {
            const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
            sha = data.sha;
          } catch (e) { sha = null; }

          await octokit.repos.createOrUpdateFileContents({
            owner, repo, path: filePath,
            message: `🚀 Oracle Singularity: Precision update & architecture enhancement`,
            content: Buffer.from(codeContent).toString('base64'),
            sha: sha,
            branch: process.env.GITHUB_HEAD_REF || 'main'
          });
        }
      }
    }

    if (targetNumber) {
      await octokit.issues.createComment({ owner, repo, issue_number: targetNumber, body: `### 🤖 Oracle Report\n\n${aiRes.split("<metadata>")[0]}` });
      if (labels.length > 0) await octokit.issues.addLabels({ owner, repo, issue_number: targetNumber, labels });
    }
    await sendTelegram(`📢 *ORACLE REPORT*\nRepo: \`${repo}\`\n\n${aiRes.split("<metadata>")[0]}`);

  } catch (err) { await sendTelegram(`⚠️ *CRITICAL ERROR:* ${err.message}`); }
}
main();
                                                                              
