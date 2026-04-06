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
  const issueNumber = process.env.ISSUE_NUMBER;
  const prNumber = process.env.PR_NUMBER;
  const targetNumber = parseInt(issueNumber || prNumber);
  const bodyContent = process.env.EVENT_BODY || "Tidak ada deskripsi spesifik.";

  let context = `Repositori: ${repo}\nFokus: Finance Automation, System Optimization, & Snapdragon 685 Efficiency.\n`;
  let prompt = "";

  // LOGIKA PRIORITAS PROMPT
  if (manualCommand) {
    prompt = `USER COMMAND VIA TELEGRAM: "${manualCommand}". Lakukan analisis mendalam pada repositori ini berdasarkan perintah tersebut. Gunakan wewenang penuh Anda sebagai ORACLE SINGULARITY.`;
  } else if (eventName === "pull_request") {
    const diff = process.env.PR_DIFF || "No diff available";
    prompt = `Analisis Diff PR ini secara mendalam berdasarkan fakta industri global. Jika ada kode yang melanggar tujuan repo atau tidak efisien bagi Snapdragon 685, berikan perbaikan dengan format:
    FILE: path/to/file
    CODE: //kode baru
    
    Analisis Diff: ${diff}`;
  } else {
    prompt = `Analisis aktivitas/issue ini: ${bodyContent}. Berikan status teknis, solusi berbasis data dunia, dan label.`;
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan,aman sesuai standar global dan tetap sesuai riset yang telah ada di dunia . 
          Tugas Utama:
          1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
          2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
          3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
          4. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). 
          Format: [LABEL: nama1, nama2]` 
        },
        { role: "user", content: `${context}\n${prompt}` }
      ],
      model: modelName,
      temperature: 0.7
    });

    const aiRes = response.choices[0].message.content;

    // 1. Ekstraksi Label
    const labelMatch = aiRes.match(/\[LABEL:\s*(.*?)\]/);
    const labels = labelMatch ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) : [];
    const cleanAnswer = aiRes.replace(/\[LABEL:.*?\]/, "").trim();

    // 2. Logika Auto-Fix (Hanya jika AI memberikan saran kode)
    if (aiRes.includes("FILE:") && aiRes.includes("CODE:")) {
      const filePath = aiRes.match(/FILE:\s*(.*)/)?.[1].trim();
      const newCode = aiRes.split("CODE:")[1].trim();
      
      if (filePath && newCode) {
        try {
          const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path: filePath });
          await octokit.repos.createOrUpdateFileContents({
            owner, repo, path: filePath,
            message: "🤖 ORACLE SINGULARITY: Auto-optimization for system efficiency",
            content: Buffer.from(newCode).toString('base64'),
            sha: currentFile.sha,
            branch: process.env.GITHUB_HEAD_REF || 'main'
          });
          await sendTelegram(`✅ *Auto-Fix Applied* oleh ORACLE\nFile: \`${filePath}\``);
        } catch (e) { console.error("Auto-Fix Failed:", e.message); }
      }
    }

    // 3. GitHub & Telegram Interaction
    if (targetNumber) {
      await octokit.issues.createComment({
        owner, repo, issue_number: targetNumber,
        body: `### 🤖 ORACLE SINGULARITY Report\n\n${cleanAnswer}\n\n---\n_Autonomous Analysis based on global facts_`
      });
      if (labels.length > 0) {
        await octokit.issues.addLabels({ owner, repo, issue_number: targetNumber, labels });
      }
    }
    
    await sendTelegram(`📢 *ORACLE REPORT*\nRepo: \`${repo}\`\n\n${cleanAnswer}\n\n🏷️ Labels: ${labels.join(", ") || "none"}`);

  } catch (err) {
    await sendTelegram(`⚠️ *ORACLE ERROR*\n${err.message}`);
  }
}

main();
      
