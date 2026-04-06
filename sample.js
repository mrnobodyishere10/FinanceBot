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
 * Mendapatkan daftar seluruh file secara rekursif (Flat List)
 * Memastikan audit sistematis satu per satu tanpa melewatkan sub-folder.
 */
async function getAllFilesFlat(owner, repo, path = "") {
  let fileList = [];
  const ignore = ['node_modules', '.git', 'dist', '.cache', 'package-lock.json', 'yarn.lock'];
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    for (const item of data) {
      if (ignore.includes(item.name)) continue;
      if (item.type === "dir") {
        const subFiles = await getAllFilesFlat(owner, repo, item.path);
        fileList = fileList.concat(subFiles);
      } else {
        fileList.push(item.path);
      }
    }
  } catch (e) { console.error(`Gagal akses path ${path}:`, e.message); }
  return fileList;
}

/**
 * Memetakan struktur pohon (Tree) untuk memberikan konteks visual pada AI
 */
function generateVisualTree(files) {
  let tree = "ROOT/\n";
  files.forEach(f => {
    const parts = f.split('/');
    tree += "  ".repeat(parts.length) + "📄 " + parts[parts.length - 1] + "\n";
  });
  return tree;
}

export async function main() {
  if (!token) return console.error("GITHUB_TOKEN missing!");
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });
  const repoFull = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repoFull.split("/");
  
  const eventName = process.env.GITHUB_EVENT_NAME;
  const manualCommand = process.env.MANUAL_COMMAND;
  const targetNumber = parseInt(process.env.ISSUE_NUMBER || process.env.PR_NUMBER);
  const bodyContent = process.env.EVENT_BODY || "High-Standard Strategic Audit.";
  const prDiff = process.env.PR_DIFF || "";

  try {
    const allFiles = await getAllFilesFlat(owner, repo);
    const visualTree = generateVisualTree(allFiles);
    
    await sendTelegram(`🔍 **Oracle Singularity Online:** Memulai audit sistematis terhadap ${allFiles.length} file.`);

    // --- PENGGABUNGAN INSTRUKSI MUTLAK (SYSTEM PROMPT) ---
    const systemPrompt = `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan, aman dan berkualitas tinggi. Kode profesional juga kompleks sesuai standar global dan tetap sesuai riset yang telah ada di dunia.

    TUGAS UTAMA:
    1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
    2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
    3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
    4. Eksekusi hasil analisa tersebut dengan berpedoman pada standar yang telah ditetapkan lalu jika proses berpikir mengatakan boleh barulah diperbolehkan push ke repository.
    5. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). Format label: [LABEL: nama1, nama2]

    PROTOKOL INTERVENSI (SYSTEMATIC AUDIT & DEEP DIRECTORY):
    - Anda wajib mengenali dan mengolah SEMUA jenis format file di GitHub (.js, .sh, .yml, .json, .md, .env, .py, .c, .cpp, .go, .rs, .dockerfile, .sql, dll).
    - Anda memiliki kesadaran penuh terhadap lokasi file baik di Root maupun di dalam folder/sub-folder berturut-turut lebih ke dalam lagi.
    - SURGICAL PRECISION: Perbaiki/Ganti/Hapus hanya bagian yang bermasalah saja.
    - PRESERVASI: Dilarang keras menghapus kode lama yang sudah berfungsi dengan baik.
    - MODULARITAS: Buat file/folder/sub-folder baru jika diperlukan untuk optimasi (Snapdragon 685), estetika, dan mencegah bentrokan kode.
    - ANTI-TEBAKAN: JANGAN MENEBAK. Anda menerima isi file satu per satu untuk memastikan audit faktual.

    ATURAN OUTPUT (WAJIB):
    Gunakan format pembatas unik berikut untuk setiap file:
    ###---ORACLE_FILE_START---###
    PATH: path/ke/file.ext
    ###---CONTENT_START---###
    isi kode lengkap...
    ###---ORACLE_FILE_END---###

    PENTING: Jika file sudah sempurna, respon hanya dengan "PASS". DILARANG memasukkan kode di baris PATH.`;

    // LOOPING AUDIT SATU PER SATU (ANTI-TOKEN LIMIT)
    for (const filePath of allFiles) {
      const { data: fData } = await octokit.repos.getContent({ owner, repo, path: filePath });
      const currentContent = Buffer.from(fData.content, 'base64').toString();

      const response = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `REPO_STRUCTURE:\n${visualTree}\n\nTARGET_FILE: ${filePath}\nCONTENT:\n${currentContent}\n\nEVENT: ${eventName}\nCONTEXT: ${prDiff || bodyContent}\nCOMMAND: ${manualCommand || "Audit"}` }
        ],
        model: modelName,
        temperature: 0.1 
      });

      const aiRes = response.choices[0].message.content;

      if (aiRes.includes("###---ORACLE_FILE_START---###")) {
        const fileBlocks = aiRes.split("###---ORACLE_FILE_START---###").slice(1);
        for (const block of fileBlocks) {
          const cleanBlock = block.split("###---ORACLE_FILE_END---###")[0].trim();
          const pathFromAi = cleanBlock.match(/PATH:\s*(.*)/)?.[1].split('\n')[0].trim();
          const codeContent = cleanBlock.split("###---CONTENT_START---###")[1]?.trim();

          if (pathFromAi && codeContent) {
            let sha = null;
            try {
              const { data } = await octokit.repos.getContent({ owner, repo, path: pathFromAi });
              sha = data.sha;
            } catch (e) { sha = null; }

            await octokit.repos.createOrUpdateFileContents({
              owner, repo, path: pathFromAi,
              message: `✅ Oracle Singularity: Systematic Precision Update on [${pathFromAi}]`,
              content: Buffer.from(codeContent).toString('base64'),
              sha: sha, branch: process.env.GITHUB_HEAD_REF || 'main'
            });
            await sendTelegram(`🎯 **Audit Berhasil:** \`${pathFromAi}\` telah diperbarui.`);
          }
        }

        // Handle Labeling & Report
        const labelMatch = aiRes.match(/\[LABEL:\s*(.*?)\]/);
        const labels = labelMatch ? labelMatch[1].split(',').map(l => l.trim().toLowerCase()) : [];
        if (targetNumber && labels.length > 0) {
            await octokit.issues.addLabels({ owner, repo, issue_number: targetNumber, labels });
        }
      }
    }

    await sendTelegram(`🏁 **Audit Komprehensif Selesai.** Semua file telah diaudit sesuai standar global.`);

  } catch (err) { 
    await sendTelegram(`⚠️ **CRITICAL ENGINE ERROR:** ${err.message}`); 
    console.error(err);
  }
}
main();
