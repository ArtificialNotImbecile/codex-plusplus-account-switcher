const { nodeDeps, codexAuthPaths, ensureDir } = require("../node-utils");

async function saveAuthSnapshotWithCurrentBaseUrl(sourcePath, targetPath) {
  const { fsp } = nodeDeps();
  const raw = await fsp.readFile(sourcePath, "utf8");
  let auth;
  try {
    auth = JSON.parse(raw);
  } catch {
    await fsp.writeFile(targetPath, raw, "utf8");
    return;
  }

  if (isApiKeyAuth(auth)) {
    let changed = false;
    const currentBaseUrl = await readCurrentTopLevelTomlString("openai_base_url");
    if (currentBaseUrl && !accountOpenAIBaseUrl(auth)) {
      auth.base_url = currentBaseUrl;
      changed = true;
    }

    const currentModelProvider = await readCurrentTopLevelTomlString("model_provider");
    if (currentModelProvider && !accountModelProvider(auth)) {
      auth.model_provider = currentModelProvider;
      changed = true;
    }

    if (!changed) {
      await fsp.writeFile(targetPath, raw, "utf8");
      return;
    }

    await fsp.writeFile(targetPath, `${JSON.stringify(auth, null, 2)}\n`, "utf8");
    return;
  }

  await fsp.writeFile(targetPath, raw, "utf8");
}

async function readAuthJson(filePath, label) {
  const { fsp } = nodeDeps();
  const raw = await fsp.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

async function syncCodexConfigForAccount(auth) {
  if (!isApiKeyAuth(auth)) {
    await setTopLevelOpenAIBaseUrl(null);
    await setTopLevelModelProvider(null);
    return;
  }

  const baseUrl = accountOpenAIBaseUrl(auth);
  if (baseUrl) await setTopLevelOpenAIBaseUrl(baseUrl);

  const modelProvider = accountModelProvider(auth) || (await readCurrentModelProviderFallback());
  await setTopLevelModelProvider(modelProvider);
}

function isApiKeyAuth(auth) {
  return auth?.auth_mode === "apikey" || !!auth?.OPENAI_API_KEY;
}

function accountOpenAIBaseUrl(auth) {
  if (!isApiKeyAuth(auth)) return null;
  for (const key of ["openai_base_url", "base_url", "OPENAI_BASE_URL"]) {
    const baseUrl = normalizeBaseUrl(auth?.[key]);
    if (baseUrl) return baseUrl;
  }
  return null;
}

function accountModelProvider(auth) {
  if (!isApiKeyAuth(auth)) return null;
  for (const key of ["model_provider", "MODEL_PROVIDER"]) {
    const modelProvider = normalizeTomlString(auth?.[key]);
    if (modelProvider) return modelProvider;
  }
  return null;
}

function normalizeBaseUrl(value) {
  return normalizeTomlString(value);
}

function normalizeTomlString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function readCurrentModelProviderFallback() {
  return readCurrentTopLevelTomlString("model_provider", { commentedOnly: true });
}

async function readCurrentTopLevelTomlString(key, options = {}) {
  const { fsp } = nodeDeps();
  const { CONFIG_PATH } = codexAuthPaths();
  try {
    return readTopLevelTomlString(await fsp.readFile(CONFIG_PATH, "utf8"), key, options);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function setTopLevelOpenAIBaseUrl(baseUrl) {
  await writeTopLevelTomlString("openai_base_url", baseUrl);
}

async function setTopLevelModelProvider(modelProvider) {
  await writeTopLevelTomlString("model_provider", modelProvider, {
    commentWhenRemoving: true,
    replaceCommentedWhenSetting: true,
  });
}

async function writeTopLevelTomlString(key, value, options = {}) {
  const { fsp } = nodeDeps();
  const { CODEX_DIR, CONFIG_PATH } = codexAuthPaths();
  await ensureDir(CODEX_DIR);
  let current = "";
  try {
    current = await fsp.readFile(CONFIG_PATH, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const next = updateTopLevelTomlString(current, key, value, options);
  if (next !== current) {
    await fsp.writeFile(CONFIG_PATH, next, "utf8");
  }
}

function updateTopLevelTomlString(raw, key, value, options = {}) {
  const lines = raw ? raw.replace(/\r\n/g, "\n").split("\n") : [];
  if (lines.length && lines[lines.length - 1] === "") lines.pop();

  const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
  const commentedKeyPattern = new RegExp(`^\\s*#\\s*${escapeRegExp(key)}\\s*=`);
  const kept = [];
  let firstTableIndex = null;
  let inserted = false;
  for (const line of lines) {
    const isTableHeader = /^\s*\[/.test(line);
    if (firstTableIndex === null && isTableHeader) firstTableIndex = kept.length;
    const inTopLevel = firstTableIndex === null;
    if (inTopLevel && keyPattern.test(line)) {
      if (value) {
        if (!inserted) {
          kept.push(`${key} = ${JSON.stringify(value)}`);
          inserted = true;
        }
      } else if (options.commentWhenRemoving) {
        kept.push(commentTomlLine(line));
      }
      continue;
    }
    if (inTopLevel && value && options.replaceCommentedWhenSetting && commentedKeyPattern.test(line)) {
      if (!inserted) {
        kept.push(`${key} = ${JSON.stringify(value)}`);
        inserted = true;
      }
      continue;
    }
    kept.push(line);
  }

  const insertAt = firstTableIndex === null ? kept.length : firstTableIndex;
  if (value && !inserted) {
    kept.splice(insertAt, 0, `${key} = ${JSON.stringify(value)}`);
  }

  return `${kept.join("\n")}${kept.length ? "\n" : ""}`;
}

function commentTomlLine(line) {
  return /^\s*#/.test(line) ? line : `# ${line.trimStart()}`;
}

function readTopLevelTomlString(raw, key, options = {}) {
  const activePattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(['"])(.*)\\1\\s*(?:#.*)?$`);
  const commentedPattern = new RegExp(`^\\s*#\\s*${escapeRegExp(key)}\\s*=\\s*(['"])(.*)\\1\\s*(?:#.*)?$`);
  const includeCommented = options.includeCommented || options.commentedOnly;
  let commentedValue = null;
  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*\[/.test(line)) return commentedValue;
    const activeMatch = line.match(activePattern);
    if (activeMatch && !options.commentedOnly) return activeMatch[2].trim() || null;
    if (includeCommented && commentedValue === null) {
      const commentedMatch = line.match(commentedPattern);
      if (commentedMatch) commentedValue = commentedMatch[2].trim() || null;
    }
  }
  return commentedValue;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  saveAuthSnapshotWithCurrentBaseUrl,
  readAuthJson,
  syncCodexConfigForAccount,
  setTopLevelOpenAIBaseUrl,
  accountOpenAIBaseUrl,
};
