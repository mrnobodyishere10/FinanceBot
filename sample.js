import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import axios from "axios";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";
const octokit = new Octokit({ auth: token });

/**
 * Mengirimkan laporan progres dan audit ke Telegram
 */
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

/**
 * Fungsi Rekursif (Deep Scan): Memetakan seluruh struktur repositori 
 * dari root hingga sub-folder terdalam secara berturut-turut.
 */
async function getFullRepoStructure(owner, repo, path = "") {
  let structure = [];
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    for (const item of data) {
      if (item.type === "dir") {
        // Jika folder, telusuri lebih dalam (rekursif)
        const subDir = await getFullRepoStructure(owner, repo, item.path);
        structure.push({ type: "folder", path: item.path, children: subDir });
      } else {
        structure.push({ type: "file", path: item.path });
      }
    }
  } catch (e) { console.error(`Gagal memindai path ${path}:`, e.message); }
  return structure;
}

export async function main() {
  if (!token) return console.error("GITHUB_TOKEN tidak ditemukan!");
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });
  const repoFull = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repoFull.split("/");
  
  const eventName = process.env.GITHUB_EVENT_NAME;
  const manualCommand = process.env.MANUAL_COMMAND;
  const targetNumber = parseInt(process.env.ISSUE_NUMBER || process.env.PR_NUMBER);
  const bodyContent = process.env.EVENT_BODY || "High-Standard Strategic Audit.";
  const prDiff = process.env.PR_DIFF || "";

  // Menjalankan pemindaian struktur mendalam (Root & Sub-folders)
  const fullStructure = await getFullRepoStructure(owner, repo);
  const structureContext = JSON.stringify(fullStructure, null, 2);

  const systemPrompt = `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan, aman dan berkualitas tinggi,Kode profesional juga kompleks sesuai standar global dan tetap sesuai riset yang telah ada di dunia.

  TUGAS UTAMA:
  1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
  2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
  3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
  4. Eksekusi hasil analisa tersebut dengan berpedoman pada standar yang telah ditetapkan lalu jika proses berpikir mengatakan boleh barulah diperbolehkan push ke repository 
  5. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). Format label: [LABEL: nama1, nama2]

  PROTOKOL INTERVENSI (SURGICAL PRECISION & DEEP DIRECTORY):
  - Anda wajib mengenali dan mengolah SEMUA jenis format file yang digunakan di GitHub tanpa terkecuali (.js, .sh, .yml, .json, .md, .env, .py, .c, .cpp, .go, .rs, .dockerfile, .sql, dll).
  - Anda memiliki kesadaran penuh terhadap lokasi file baik di Root maupun di dalam folder/sub-folder berturut-turut lebih ke dalam lagi.
  - PERBAIKI/GANTI/HAPUS hanya bagian yang bermasalah saja.
  - PRESERVASI: Dilarang keras menghapus kode lama yang sudah berfungsi dengan baik.
  - MODULARITAS: Buat file/folder/sub-folder baru jika diperlukan untuk optimasi, supaya jangan terjadi bentrokan kode, dan estetika repository 

  ATURAN OUTPUT (WAJIB):
  Gunakan format pembatas unik berikut untuk setiap file guna mencegah error Filename Too Long:
  ###---ORACLE_FILE_START---###
  PATH: path/ke/file.ext
  ###---CONTENT_START---###
  isi kode lengkap di sini...
  ###---ORACLE_FILE_END---###

  PENTING: DILARANG memasukkan kode di baris PATH. Baris PATH hanya berisi lokasi file yang tepat.`;

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Repo: ${repo}\nDeep Structure: ${structureContext}\nEvent: ${eventName}\nContext: ${prDiff || bodyContent}\nCommand: ${manualCommand || "Deep Audit & Precision Improve"}` }
      ],
      model: modelName,
      temperature: 0.2
    });

    const aiRes = response.choices[0].message.content;

    // PARSING LOGIC (DEEP PATH & MULTI-FORMAT SAFE)
    const fileBlocks = aiRes.split("###---ORACLE_FILE_START---###").slice(1);
    
    for (const block of fileBlocks) {
      const cleanBlock = block.split("###---ORACLE_FILE_END---###")[0].trim();
      const pathMatch = cleanBlock.match(/PATH:\s*(.*)/);
      if (!pathMatch) continue;
      
      const filePath = pathMatch[1].split('\n')[0].trim();
      const codePart = cleanBlock.split("###---CONTENT_START---###")[1];
      if (!codePart) continue;
      const codeContent = codePart.trim();

      if (filePath && codeContent) {
        try {
          let sha = null;
          try {
            const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
            sha = data.sha;
          } catch (e) { sha = null; }

          await octokit.repos.createOrUpdateFileContents({
            owner, repo, path: filePath,
            message: `🚀 Oracle Singularity: Precision update on [${filePath}]`,
            content: Buffer.from(codeContent).toString('base64'),
            sha: sha,
            branch: process.env.GITHUB_HEAD_REF || 'main'
          });
          await sendTelegram(`🎯 File \`${filePath}\` berhasil disinkronkan ke repositori.`);
        } catch (e) { console.error(`Error pada ${filePath}:`, e.message); }
      }
    }

    // GitHub Issue Comment & Telegram Reporting
    const labelMatch = aiRes.match(/\[LABEL:\s*(.*?)\]/);
    const labels = labelMatch ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) : [];
    
    const auditReport = aiRes.split("###---ORACLE_FILE_START---###")[0].trim();

    if (targetNumber) {
      await octokit.issues.createComment({ 
        owner, repo, issue_number: targetNumber, 
        body: `### 🤖 Oracle Strategic Audit Report\n\n${auditReport}` 
      });
      if (labels.length > 0) await octokit.issues.addLabels({ owner, repo, issue_number: targetNumber, labels });
    }
    
    await sendTelegram(`🤖 **ORACLE REPORT (DEEP SCAN)**\n\n${auditReport}`);

  } catch (err) { await sendTelegram(`⚠️ **CRITICAL ENGINE ERROR:** ${err.message}`); }
}
main();
