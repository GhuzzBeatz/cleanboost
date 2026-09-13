import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const contextPath = path.join(root, "CONTEXTO_CODEX.md");
const packagePath = path.join(root, "package.json");
const manifestPath = path.join(root, "update-manifest.json");

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return fallback;
  }
}

function readJson(file) {
  try {
    return JSON.parse(readText(file));
  } catch {
    return {};
  }
}

function listFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function slugFromPackage(pkg) {
  const name = String(pkg.name || "").trim().toLowerCase();
  return name.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function productName(pkg) {
  return (
    pkg?.build?.productName ||
    pkg?.productName ||
    pkg?.name ||
    path.basename(root)
  );
}

function appId(pkg) {
  return pkg?.build?.appId || "";
}

function releaseAssetName(pkg) {
  const product = productName(pkg);
  return `${product}.Setup.exe`;
}

function extractNavScreens() {
  const index = readText(path.join(root, "index.html"));
  const screens = [];
  const re = /<button[^>]*class=["'][^"']*\bnav-btn\b[^"']*["'][^>]*data-page=["']([^"']+)["'][^>]*>([\s\S]*?)<\/button>/gi;
  for (const match of index.matchAll(re)) {
    const id = match[1].trim();
    const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (id && label) screens.push(`${label} (${id})`);
  }
  return [...new Set(screens)].slice(0, 24);
}

function extractDocsAiSections() {
  const docsDir = path.join(root, "docs", "ai");
  return listFiles(docsDir)
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => {
      const rel = path.relative(root, file).replace(/\\/g, "/");
      return readText(file)
        .split(/\r?\n/)
        .filter((line) => /^#{1,3}\s+/.test(line))
        .map((line) => `${rel}: ${line.replace(/^#{1,3}\s+/, "").trim()}`);
    })
    .slice(0, 30);
}

function existingObjective(context) {
  const match = context.match(/- Objetivo:\s*(.+)/);
  return match ? match[1].trim() : "Aplicativo GHZ Plugin com licenca online.";
}

function replaceSection(context, title, body) {
  const heading = `## ${title}`;
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\r?\\n[\\s\\S]*?(?=\\r?\\n## |$)`);
  const block = `${heading}\n${body.trim()}\n`;
  if (re.test(context)) return context.replace(re, block);
  return `${context.trim()}\n\n${block}\n`;
}

function trimContext(context) {
  const max = 10000;
  if (context.length <= max) return context;
  const keepSections = [
    "Identidade",
    "Regras que nao podem quebrar",
    "Licenca e seguranca",
    "Downloads e releases",
    "Mapa rapido de telas",
    "Stack e pontos de entrada",
    "Fluxo recomendado para uma tarefa nova",
  ];
  const chunks = [];
  for (const section of keepSections) {
    const re = new RegExp(`## ${section}\\r?\\n[\\s\\S]*?(?=\\r?\\n## |$)`);
    const match = context.match(re);
    if (match) chunks.push(match[0].trim());
  }
  const header = context.split("## ")[0].trim();
  return `${header}\n\n${chunks.join("\n\n")}\n`;
}

const pkg = readJson(packagePath);
const manifest = readJson(manifestPath);
const context = readText(contextPath);
if (!context.trim()) {
  throw new Error("CONTEXTO_CODEX.md nao encontrado ou vazio.");
}

const product = productName(pkg);
const publicId = slugFromPackage(pkg);
const version = pkg.version || manifest.version || "";
let gitRepo = "";
try {
  gitRepo = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
  gitRepo = gitRepo
    .replace(/^git@github.com:/, "https://github.com/")
    .replace(/\.git$/, "");
} catch {}
const repo = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : gitRepo;
const objective = existingObjective(context);
const manifestUrl = `https://ghzplugin.com.br/api/ghz-update.php?app=${publicId}`;
const downloadUrl = `https://ghzplugin.com.br/api/ghz-update.php?app=${publicId}&download=1`;
const screens = extractNavScreens();
const docs = extractDocsAiSections();

let next = context;
next = replaceSection(next, "Identidade", `
- Produto: ${product}
- Pasta local principal: manter conforme projeto local do app
- Repositorio GitHub: ${repo || "preencher quando indisponivel no ambiente"}
- package.name: ${pkg.name || ""}
- package.version atual: ${version}
- build.productName: ${product}
- build.appId: ${appId(pkg)}
- ID publico de download/update: ${publicId}
- Objetivo: ${objective}
`);

next = replaceSection(next, "Downloads e releases", `
- GHZ update API: https://ghzplugin.com.br/api/ghz-update.php
- Manifest: ${manifestUrl}
- Download direto: ${downloadUrl}
- Versao publicada no manifest local: ${manifest.version || version || "nao informada"}
- Repo release usado pelo roteador: ${repo ? `${repo}/releases` : "releases do repositorio atual"}
- Asset esperado pelo roteador de downloads: ${releaseAssetName(pkg)}
- Se o repositorio for privado, o token de GitHub fica apenas como secret da Edge Function/GitHub Actions, nunca dentro do app.
- Notas de release nao devem vazar URL interna, token ou link temporario.
`);

if (screens.length || docs.length) {
  next = replaceSection(next, "Mapa rapido de telas", `
${screens.length ? screens.map((screen) => `- Tela: ${screen}`).join("\n") : "- Telas: conferir index.html/pages/."}
${docs.length ? "\n\nBase docs/ai detectada:\n" + docs.map((item) => `- ${item}`).join("\n") : ""}
`);
}

next = replaceSection(next, "Stack e pontos de entrada", `
- Stack detectada: Electron + HTML/CSS/JS, empacotamento por electron-builder quando package.json tiver build.
- Entrada declarada no package.json: ${pkg.main || "main.js"}
- Scripts npm: ${Object.keys(pkg.scripts || {}).join(", ") || "nenhum script declarado"}
- Telas ficam normalmente em index.html, pages/, components/, js/, css/ e assets/.
- Base de ajuda IA, quando existir, fica em docs/ai/.
- Backend/edge functions, quando existir, fica em cloud/ ou supabase/.
- Testes, quando existirem, ficam em tests/; validar pelo script npm test ou validacao direcionada antes de release.
`);

next = trimContext(next).trimEnd() + "\n";
fs.writeFileSync(contextPath, next, "utf8");
console.log(`CONTEXTO_CODEX.md atualizado: ${next.length} caracteres.`);
