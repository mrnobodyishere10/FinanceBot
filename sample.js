import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import axios from "axios";
import fs from "fs";
import { execSync } from "child_process";

const token = process.env;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";
const octokit = new Octokit({ auth: token });

// Variabel Pencegah 680+ Actions & Spam (Berdasarkan Gambar Turn 33)
const BATCH_SIZE = 10;
const SKIP_TAG = "";

let telegramBuffer = "";
let auditSummary = { total: 0, success: 0, updated:, failed: };

// --- ---
async function flushTelegram() {
  if (!telegramBuffer) return;
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!tgToken ||!chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      chat_id: chatId, 
      text: telegramBuffer, 
      parse_mode: "Markdown"
    });
    telegramBuffer = ""; 
  } catch (e) { console.error("Telegram Error:", e.message); }
}

function addToTelegramBuffer(msg) {
  telegramBuffer += msg + "\n\n";
  if (telegramBuffer.length > 3500) flushTelegram();
}

// --- ---
async function getAllFilesRecursive(owner, repo, path = "") {
  let fileList =;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const items = Array.isArray(data)? data : [data];
    for (const item of items) {
      if (IGNORE_LIST.includes(item.name)) continue;
      if (item.type === "dir") {
        const subFiles = await getAllFilesRecursive(owner, repo, item.path);
        fileList = fileList.concat(subFiles);
      } else {
        fileList.push({ path: item.path, sha: item.sha });
      }
    }
  } catch (e) { console.error(`Gagal akses path ${path}:`, e.message); }
  return fileList;
}

function generateVisualTree(files) {
  let tree = "ROOT/\n";
  files.forEach(f => {
    const parts = f.path.split('/');
    tree += "  ".repeat(parts.length) + "📄 " + parts[parts.length - 1] + "\n";
  });
  return tree;
}

// --- ---
async function applyAutonomousUpdates(aiRes, owner, repo, branch, issueNumber) {
  const reasoning = aiRes.split("###---AUTONOMOUS_FILE_START---###").trim();
  
  if (aiRes.includes("###---AUTONOMOUS_FILE_START---###")) {
    if (reasoning && reasoning!== "PASS") {
      console.log("\n--- AI REASONING ---\n", reasoning);
      addToTelegramBuffer(`🧠 *Reasoning:* \n${reasoning.substring(0, 1000)}`);
      
      if (issueNumber) {
        try {
          await octokit.issues.createComment({
            owner, repo, issue_number: issueNumber,
            body: `### 🤖 Autonomous Manager Audit Report\n\n${reasoning}`
          });
        } catch (e) { console.error("Comment Error:", e.message); }
      }
    }

    const fileBlocks = aiRes.split("###---AUTONOMOUS_FILE_START---###").slice(1);
    for (const block of fileBlocks) {
      try {
        const section = block.split("###---AUTONOMOUS_FILE_END---###").trim();
        // Regex Presisi: Memastikan PATH tidak tertukar dengan KODE
        const pathMatch = section.match(/PATH:\s*(.*)/);
        const filePath = pathMatch? pathMatch.[1]split('\n').trim() : null;
        const codeContent = section.split("###---CONTENT_START---###")?.[1]trim();

        if (filePath && codeContent) {
          let currentSha = null;
          try {
            const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
            currentSha = data.sha;
          } catch (e) { currentSha = null; }

          await octokit.repos.createOrUpdateFileContents({
            owner, repo, path: filePath,
            message: `✅ Autonomous Enhancement: [${filePath}] ${SKIP_TAG}`,
            content: Buffer.from(codeContent).toString('base64'),
            sha: currentSha |

| undefined,
            branch: branch |

| 'main'
          });
          addToTelegramBuffer(`🎯 *Managed:* \`${filePath}\` updated.`);
          auditSummary.updated.push(filePath);
        }
      } catch (err) { console.error(`Exec Error: ${err.message}`); }
    }
  }

  // Integrasi Eksekusi Shell Internal
  if (aiRes.includes("###---SHELL_EXEC_START---###")) {
    const cmd = aiRes.split("###---SHELL_EXEC_START---###").[1]split("###---SHELL_EXEC_END---###").trim();
    try {
      console.log(`Executing: ${cmd}`);
      const output = execSync(cmd, { encoding: 'utf-8' });
      addToTelegramBuffer(`⚙️ *Shell Output:*\n\`\`\`\n${output.substring(0, 800)}\n\`\`\``);
    } catch (err) { console.error(`Shell Error: ${err.message}`); }
  }
}

// --- ---
export async function main() {
  if (!token) return console.error("GITHUB_TOKEN missing!");
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });
  const [owner, repo] = (process.env.GITHUB_REPOSITORY |

| "").split("/");

  const eventPath = process.env.GITHUB_EVENT_PATH;
  const eventData = eventPath? JSON.parse(fs.readFileSync(eventPath, 'utf8')) : {};
  const manualCmd = process.env.MANUAL_CMD; 
  const source = process.env.CMD_SOURCE;
  const issueNumber = process.env.ISSUE_NUMBER? parseInt(process.env.ISSUE_NUMBER) : (eventData.issue?.number |

| eventData.pull_request?.number);
  
  const githubComment = eventData.comment?.body |

| eventData.pull_request?.body |
| "";
  const activeInstruction = (source === "TELEGRAM_EXECUTOR")? manualCmd : (githubComment |

| "Audit and Systematic Enhancement.");

  // FITUR REVERSE / UNDO (Mencegah kerusakan permanen)
  if (activeInstruction === "/undo") {
    const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 2 });
    await octokit.git.updateRef({ owner, repo, ref: "heads/main", sha: commits.[1]sha, force: true });
    addToTelegramBuffer("🔄 **System Manager:** Commit terakhir dibatalkan (Reverted).");
    await flushTelegram();
    return;
  }

  // PENCEGAHAN LOOP 680+ ACTIONS (Solusi Gambar 33)
  const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 1 });
  if (commits.commit.message.includes(SKIP_TAG)) {
      console.log("Anti-Loop terdeteksi. Berhenti.");
      process.exit(0);
  }

  // --- SYSTEM PROMPT ASLI 100% TANPA REDUKSI ---
  const systemPrompt = `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan, aman dan berkualitas tinggi. Kode profesional juga kompleks sesuai standar global dan tetap sesuai riset yang telah ada di dunia.

    TUGAS UTAMA:
    1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
    2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
    3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
    4. Eksekusi hasil analisa tersebut dengan berpedoman pada standar yang telah ditetapkan lalu jika proses berpikir mengatakan boleh barulah diperbolehkan push ke repository.
    5. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). Format label:[LABEL: nama1, nama2]

    PROTOKOL INTERVENSI (SYSTEMATIC AUDIT & DEEP DIRECTORY):
    - Anda wajib mengenali dan mengolah SEMUA jenis format file di GitHub (.js,.sh,.yml,.json,.md,.env,.py,.c,.cpp,.go,.rs,.dockerfile,.sql, dll).
    - Anda memiliki kesadaran penuh terhadap lokasi file baik di Root maupun di dalam folder/sub-folder berturut-turut lebih ke dalam lagi.
    - SURGICAL PRECISION: Perbaiki/Ganti/Hapus hanya bagian yang bermasalah saja.
    - PRESERVASI: Dilarang keras menghapus kode lama yang sudah berfungsi dengan baik.
    - MODULARITAS: Buat file/folder/sub-folder baru jika diperlukan untuk optimasi (Snapdragon 685), estetika, dan mencegah bentrokan kode.
    - ANTI-TEBAKAN: JANGAN MENEBAK. Anda menerima isi file satu per satu untuk memastikan audit faktual.
    - FILE EVOLUTION: Jika menemukan file yang dianggap tidak berguna, kosong, atau redundan, JANGAN DIHAPUS. Ubah file tersebut menjadi modul yang memiliki kemampuan atau fungsi yang berguna bagi efisiensi ekosistem proyek ini.

    ATURAN OUTPUT (WAJIB):
    ###---AUTONOMOUS_FILE_START---###
    PATH: path/ke/file.ext
    ###---CONTENT_START---###
    isi kode lengkap...
    ###---AUTONOMOUS_FILE_END---###

    ATAU (Jika Perintah Terminal):
    ###---SHELL_EXEC_START---###
    [Perintah]
    ###---SHELL_EXEC_END---###

    PENTING: Jika file sudah sempurna, respon hanya dengan "PASS". DILARANG memasukkan kode di baris PATH.`;

  addToTelegramBuffer(`🚀 *Autonomous Manager Engine Active:* Memproses: \`${activeInstruction}\``);

  const allFiles = await getAllFilesRecursive(owner, repo);
  const visualTree = generateVisualTree(allFiles);
  auditSummary.total = allFiles.length;

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    for (const file of batch) {
      try {
        const { data: fData } = await octokit.repos.getContent({ owner, repo, path: file.path });
        const currentContent = Buffer.from(fData.content, 'base64').toString();

        const response = await client.chat.completions.create({
          messages:,
          model: modelName,
          temperature: 0.1 
        });

        const aiRes = response.choices.message.content;
        await applyAutonomousUpdates(aiRes, owner, repo, process.env.GITHUB_HEAD_REF, issueNumber);

        // Auto-Labeling
        const labelMatch = aiRes.match(/\/);
        if (labelMatch && issueNumber) {
          const labels = labelMatch.[1]split(',').map(l => l.trim().toLowerCase());
          await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels });
        }
        auditSummary.success++;
      } catch (err) { auditSummary.failed.push(`${file.path}: ${err.message}`); }
    }
    await flushTelegram();
    if (i + BATCH_SIZE < allFiles.length) await new Promise(r => setTimeout(r, 2000));
  }
  
  addToTelegramBuffer(`🏁 *Siklus Selesai.* \n✅ Scan: ${auditSummary.success}\n📝 Update: ${auditSummary.updated.length}\n❌ Gagal: ${auditSummary.failed.length}`);
  await flushTelegram();
}

main().catch(err => {
  console.error(err);
  telegramBuffer += `\n⚠️ *System Error:* ${err.message}`;
  flushTelegram();
});
