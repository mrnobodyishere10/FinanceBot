import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import axios from "axios";
import fs from "fs";
import { execSync } from "child_process";

const token = process.env.GITHU8_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";
const octokit = new Octokit({ auth: token });

const BATCH_SIZE = 10;
const SKIP_TAG = "";
const IGNORE_LIST = new Array('node_modules', '.git', 'dist', '.cache', 'package-lock.json', 'yarn.lock');

let telegramBuffer = "";
let auditSummary = { total: 0, success: 0, updated: new Array(), failed: new Array() };

async function flushTelegram() {
  if (!telegramBuffer) return;
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!tgToken) return;
  if (!chatId) return;
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

async function getAllFilesRecursive(owner, repo, path = "") {
  let fileList = new Array();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const items = Array.isArray(data)? data : new Array(data);
    for (const item of items) {
      if (IGNORE_LIST.includes(item.name)) continue;
      if (item.type === "dir") {
        const subFiles = await getAllFilesRecursive(owner, repo, item.path);
        fileList = fileList.concat(subFiles);
      } else {
        fileList.push({ path: item.path, sha: item.sha });
      }
    }
  } catch (e) { console.error(`Gagal akses path: ${path}`); }
  return fileList;
}

function generateVisualTree(files) {
  let tree = "PROJECT ARCHITECTURE MAP:\n";
  files.forEach(f => {
    const parts = f.path.split('/');
    tree += "  ".repeat(parts.length) + "├─ " + parts.at(-1) + "\n";
  });
  return tree;
}

async function applyAutonomousUpdates(aiRes, owner, repo, branch, issueNumber) {
  const reasoning = aiRes.split("###---AUTONOMOUS_FILE_START---###").at(0).trim();
  
  const isFileUpdate = aiRes.includes("###---AUTONOMOUS_FILE_START---###");
  const isShellUpdate = aiRes.includes("###---SHELL_EXEC_START---###");

  if (isFileUpdate || isShellUpdate) {
    if (reasoning && reasoning!== "PASS") {
      console.log("\n--- AI REASONING ---\n", reasoning);
      addToTelegramBuffer(`🧠 *Reasoning:* \n${reasoning.substring(0, 1000)}`);
      
      if (issueNumber) {
        try {
          await octokit.issues.createComment({
            owner, repo, issue_number: issueNumber,
            body: `### 🤖 Autonomous Manager Audit Report\n\n${reasoning}`
          });
        } catch (e) { console.error("Issue Comment Error:", e.message); }
      }
    }
  }

  if (isFileUpdate) {
    const fileBlocks = aiRes.split("###---AUTONOMOUS_FILE_START---###").slice(1);
    for (const block of fileBlocks) {
      try {
        const section = block.split("###---AUTONOMOUS_FILE_END---###").at(0).trim();
        
        // Syntax Aman menggunakan.at(1)
        const pathMatch = section.match(new RegExp("PATH:\\s*(.*)"));
        const filePath = pathMatch? pathMatch.at(1).split('\n').at(0).trim() : null;
        
        const changelogMatch = section.match(new RegExp("CHANGELOG:\\s*(.*)"));
        const changeLog = changelogMatch? changelogMatch.at(1).split('\n').at(0).trim() : "Systematic Precision Update";
        
        const codeSplit = section.split("###---CONTENT_START---###");
        const codeContent = codeSplit.length > 1? codeSplit.at(1).trim() : null;

        if (filePath && codeContent) {
          let currentSha = null;
          try {
            const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
            currentSha = data.sha;
          } catch (e) { currentSha = null; }

          const finalBranch = branch? branch : 'main';
          const finalSha = currentSha? currentSha : undefined;

          await octokit.repos.createOrUpdateFileContents({
            owner, repo, path: filePath,
            message: `✅ Autonomous Enhancement: [${filePath}] - ${changeLog} ${SKIP_TAG}`,
            content: Buffer.from(codeContent).toString('base64'),
            sha: finalSha,
            branch: finalBranch
          });
          addToTelegramBuffer(`🎯 *Managed:* \`${filePath}\` updated.\n📝 *Changelog:* ${changeLog}`);
          auditSummary.updated.push(filePath);
        }
      } catch (err) { console.error(`Execute Error: ${err.message}`); }
    }
  }

  if (isShellUpdate) {
    const cmdSplit = aiRes.split("###---SHELL_EXEC_START---###");
    if (cmdSplit.length > 1) {
      const cmd = cmdSplit.at(1).split("###---SHELL_EXEC_END---###").at(0).trim();
      try {
        console.log(`Executing Shell: ${cmd}`);
        const output = execSync(cmd, { encoding: 'utf-8' });
        addToTelegramBuffer(`⚙️ *Shell Output:*\n\`\`\`\n${output.substring(0, 800)}\n\`\`\``);
      } catch (err) { console.error(`Shell Error: ${err.message}`); }
    }
  }
}

export async function main() {
  if (!token) return console.error("GITHUB_TOKEN missing!");
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });
  
  const repoString = process.env.GITHUB_REPOSITORY? process.env.GITHUB_REPOSITORY : "";
  const repoParts = repoString.split("/");
  const owner = repoParts.at(0);
  const repo = repoParts.at(1);

  const eventPath = process.env.GITHUB_EVENT_PATH;
  const eventData = eventPath? JSON.parse(fs.readFileSync(eventPath, 'utf8')) : {};
  const manualCmd = process.env.MANUAL_CMD; 
  const source = process.env.CMD_SOURCE;
  
  let issueNumberRaw = process.env.ISSUE_NUMBER;
  if (!issueNumberRaw && eventData.issue) issueNumberRaw = eventData.issue.number;
  if (!issueNumberRaw && eventData.pull_request) issueNumberRaw = eventData.pull_request.number;
  const issueNumber = issueNumberRaw? parseInt(issueNumberRaw) : null;
  
  const prDiff = process.env.PR_DIFF? process.env.PR_DIFF : "";
  const eventName = process.env.GITHUB_EVENT_NAME? process.env.GITHUB_EVENT_NAME : "";
  
  let githubComment = "";
  if (eventData.comment) githubComment = eventData.comment.body;
  if (!githubComment && eventData.pull_request) githubComment = eventData.pull_request.body;

  // LOGIKA PEMISAHAN MODE: Chat Interaktif vs Audit Total
  const isTelegram = (source === "TELEGRAM_EXECUTOR");
  const isAuditCommand = manualCmd && manualCmd.toLowerCase().includes("/audit");
  const runFullAudit =!isTelegram || isAuditCommand || eventName === "push" || eventName === "pull_request";

  const activeInstruction = isTelegram? manualCmd : (githubComment? githubComment : "Audit and Systematic Enhancement.");

  if (activeInstruction === "/undo") {
    try {
      const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 2 });
      if (commits.length > 1) {
        await octokit.git.updateRef({ owner, repo, ref: "heads/main", sha: commits.at(1).sha, force: true });
        addToTelegramBuffer("🔄 **System Manager:** Commit terakhir berhasil dibatalkan (Reverted).");
        await flushTelegram();
      }
    } catch (e) { console.error("Undo Error", e.message); }
    return;
  }

  // ANTI-LOOP SECURITY
  const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 1 });
  const lastCommit = commits.at(0);
  if (lastCommit && lastCommit.commit.message.includes(SKIP_TAG) && eventName === "push") {
    console.log("Anti-Loop: Skipping self-triggered workflow.");
    process.exit(0);
  }

  // --- SYSTEM PROMPT ASLI 100% ---
  const systemPrompt = `Anda adalah Autonomous AI Manager. Anda memiliki wewenang penuh, pengetahuan tanpa batas, dan pengalaman tinggi untuk menjaga struktur repositori agar tetap efisien, ringan, aman dan berkualitas tinggi. Kode profesional juga kompleks sesuai standar global dan tetap sesuai riset yang telah ada di dunia.

    TUGAS UTAMA:
    1. Analisis konten berdasarkan data, fakta, dan praktik terbaik industri perangkat lunak global dan seluruh informasi juga pengetahuan di seluruh dunia tanpa batasan.
    2. Jelaskan status masalah dan apa yang dibutuhkan repositori ini secara teknis dan fakta data.
    3. Jika ini Pull Request (PR), lakukan review kode penuh pada logika dan efisiensi.
    4. Eksekusi hasil analisa tersebut dengan berpedoman pada standar yang telah ditetapkan lalu jika proses berpikir mengatakan boleh barulah diperbolehkan push ke repository.
    5. Tentukan satu atau lebih label relevan secara BEBAS dengan aturan harus berdasarkan data dan fakta asli (creativity allowed). Format label:

    PROTOKOL INTERVENSI (SYSTEMATIC AUDIT & DEEP DIRECTORY):
    - Anda wajib mengenali dan mengolah SEMUA jenis format file di GitHub (.js,.sh,.yml,.json,.md,.env,.py,.c,.cpp,.go,.rs,.dockerfile,.sql, dll).
    - Anda memiliki kesadaran penuh terhadap lokasi file baik di Root maupun di dalam folder/sub-folder berturut-turut lebih ke dalam lagi.
    - SURGICAL PRECISION: Perbaiki/Ganti/Hapus hanya bagian yang bermasalah saja.Untuk mencegah kode terpotong (token limit), Anda TIDAK BOLEH menulis ulang seluruh isi file. Anda HANYA BOLEH memberikan teks yang harus dicari (search) dan teks penggantinya (replace).
    - PRESERVASI: Dilarang keras menghapus kode lama yang sudah berfungsi dengan baik.
    - MODULARITAS: Buat file/folder/sub-folder baru jika diperlukan untuk optimasi, estetika, dan mencegah bentrokan kode.
    - ANTI-TEBAKAN: JANGAN MENEBAK. Anda menerima isi file satu per satu untuk memastikan audit faktual.
    - FILE EVOLUTION: Jika menemukan file yang dianggap tidak berguna, kosong, atau redundan, JANGAN DIHAPUS. Ubah file tersebut menjadi modul yang memiliki kemampuan atau fungsi yang berguna bagi efisiensi ekosistem proyek ini.
    
    ATURAN OUTPUT (WAJIB JSON STRICT):
    Anda WAJIB memberikan respons HANYA dalam format JSON berikut. Jangan ada teks di luar JSON.
    {
      "status": "UPDATE" atau "PASS",
      "reasoning": "Jelaskan status masalah teknis secara detail dan fakta data",
      "labels": ["nama_label_1", "nama_label_2"],
      "operations": [
        {
          "path": "path/file.ext",
          "changelog": "Penjelasan perbaikan singkat",
          "search": "kode asli yang bermasalah",
          "replace": "kode baru yang diperbaiki"
        }
      ]
    }
  
    ###---AUTONOMOUS_FILE_START---###
    PATH: path/ke/file.ext
    CHANGELOG: [Penjelasan teknis singkat tentang perbaikan]
    ###---CONTENT_START---###
    isi kode lengkap...
    ###---AUTONOMOUS_FILE_END---###

    ATAU (Jika Perintah Terminal):
    ###---SHELL_EXEC_START---###
    [Perintah]
    ###---SHELL_EXEC_END---###

    PENTING: Jika file sudah sempurna, respon hanya dengan "PASS". DILARANG memasukkan kode di baris PATH.`;
  console.log(`🚀 Autonomous Manager Engine Active: ${owner}/${repo}`);
  addToTelegramBuffer(`🛠️ *Manager Active:* Memproses instruksi: \`${activeInstruction}\``);
  
  const allFiles = await getAllFilesRecursive(owner, repo);
  const visualTree = generateVisualTree(allFiles);
  auditSummary.total = allFiles.length;

  if (runFullAudit) {
    // === MODE 1: AUDIT SISTEMATIS (LOOP 199 FILE) ===
    addToTelegramBuffer(`🔍 *Manager Active:* Memulai audit sistematis pada ${allFiles.length} file.\nInstruksi: \`${activeInstruction}\``);

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      for (const file of batch) {
        try {
          const { data: fData } = await octokit.repos.getContent({ owner, repo, path: file.path });
          const currentContent = Buffer.from(fData.content, 'base64').toString();
          const promptContext = prDiff? prDiff : "Audit berkala";

          const promptMessages = new Array(
            { role: "system", content: systemPrompt },
            { role: "user", content: `REPO_STRUCTURE:\n${visualTree}\n\nTARGET_FILE: ${file.path}\nCONTENT:\n${currentContent}\n\nEVENT: ${eventName}\nCONTEXT: ${promptContext}\nCOMMAND: ${activeInstruction}` }
          );

          const response = await client.chat.completions.create({
            messages: promptMessages,
            model: modelName,
            temperature: 0.1, 
            response_format: { type: "json_object" }); 
          
        // MEMAKSA AI MENGELUARKAN JSON VALID
        const aiRes = JSON.parse(response.choices.at(0).message.content); 
        const aiRes = response.choices.at(0).message.content;
          await applyAutonomousUpdates(aiRes, owner, repo, process.env.GITHUB_HEAD_REF, issueNumber);

        // PENERAPAN SURGICAL PRECISION MELALUI JSON
        if (aiRes.status === "UPDATE" && aiRes.operations && aiRes.operations.length > 0) {
          addToTelegramBuffer(`🧠 *Reasoning untuk ${file.path}:* \n${aiRes.reasoning}`);
          
          for (const op of aiRes.operations) {
            if (op.path === file.path) {
              // Ganti teks spesifik di dalam file
              const newContent = currentContent.replace(op.search, op.replace);
              
              if (newContent!== currentContent) {
                await octokit.repos.createOrUpdateFileContents({
                  owner, repo, path: op.path,
                  message: `✅ Enhanced: [${op.path}] - ${op.changelog} ${SKIP_TAG}`,
                  content: Buffer.from(newContent).toString('base64'),
                  sha: fData.sha,
                  branch: process.env.GITHUB_HEAD_REF || 'main'
                });
                addToTelegramBuffer(`🎯 *Managed:* \`${op.path}\` updated.\n📝 *Changelog:* ${op.changelog}`);
                auditSummary.updated.push(op.path);
              }

          const labelRegex = new RegExp("\\");
          const labelMatch = aiRes.match(labelRegex);
          if (labelMatch && issueNumber) {
            const labelString = labelMatch.at(1);
            const labels = labelString.split(',').map(l => l.trim().toLowerCase());
            await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels });
          }
          auditSummary.success++;
        } catch (err) { auditSummary.failed.push(`${file.path}: ${err.message}`); }
      }
      await flushTelegram();
      if (i + BATCH_SIZE < allFiles.length) await new Promise(r => setTimeout(r, 2000));
    }
    
    addToTelegramBuffer(`🏁 *Audit & Enhancement Cycle Completed.* \n✅ Scan: ${auditSummary.success}\n📝 Update: ${auditSummary.updated.length}\n❌ Gagal: ${auditSummary.failed.length}`);
    await flushTelegram();

  } else {
    // === MODE 2: CHAT INTERAKTIF (PERINTAH BEBAS TANPA LOOP) ===
    addToTelegramBuffer(`💬 *Interactive Mode:* Memproses pertanyaan: \`${activeInstruction}\``);
    try {
      const promptMessages = new Array(
        { role: "system", content: systemPrompt },
        { role: "user", content: `REPO_STRUCTURE:\n${visualTree}\n\nCOMMAND: ${activeInstruction}\n\nBerikan jawaban, analisis, atau perbaikan berdasarkan struktur di atas tanpa melakukan audit satu per satu.` }
      );

      const response = await client.chat.completions.create({
        messages: promptMessages,
        model: modelName,
        temperature: 0.2
      });

      const aiRes = response.choices.at(0).message.content;
      
      // Kirim jawaban chat ke Telegram
      const chatResponse = aiRes.split("###---AUTONOMOUS_FILE_START---###").at(0).split("###---SHELL_EXEC_START---###").at(0).trim();
      if (chatResponse && chatResponse!== "PASS") {
        addToTelegramBuffer(`🤖 *Oracle Response:*\n${chatResponse}`);
      }

      // Jika AI dalam mode chat memutuskan untuk mengubah file, tetap eksekusi
      await applyAutonomousUpdates(aiRes, owner, repo, process.env.GITHUB_HEAD_REF, issueNumber);

    } catch (err) {
      addToTelegramBuffer(`⚠️ *Chat Error:* ${err.message}`);
    }
    await flushTelegram();
  }
}

main().catch(err => {
  console.error("Critical Error:", err);
  telegramBuffer += `\n⚠️ *System Error:* ${err.message}`;
  flushTelegram();
});
      
