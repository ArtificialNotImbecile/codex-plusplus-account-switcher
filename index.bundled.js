var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/constants.js
var require_constants = __commonJS({
  "src/constants.js"(exports2, module2) {
    var GLOBAL_SERVICE_KEY2 = "__codexpp_account_switcher_service__";
    var IPC_HANDLER_KEY2 = "__codexpp_account_switcher_ipc_handler__";
    var IPC_CHANNEL2 = "account-switcher";
    var ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    module2.exports = { GLOBAL_SERVICE_KEY: GLOBAL_SERVICE_KEY2, IPC_HANDLER_KEY: IPC_HANDLER_KEY2, IPC_CHANNEL: IPC_CHANNEL2, ACCOUNT_NAME_PATTERN };
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports2, module2) {
    function ok(state) {
      return { ok: true, state };
    }
    function fail(error) {
      return { ok: false, error };
    }
    function errorMessage(error) {
      return error instanceof Error ? error.message : String(error);
    }
    function stringifyError(error) {
      return error instanceof Error ? error.stack || error.message : String(error);
    }
    module2.exports = { ok, fail, errorMessage, stringifyError };
  }
});

// src/i18n.js
var require_i18n = __commonJS({
  "src/i18n.js"(exports2, module2) {
    var STRINGS = {
      "accounts.title": "Accounts",
      "accounts.configure": "Configure accounts",
      "accounts.emptySaved": "No saved accounts yet.",
      "accounts.emptyActive": "No active session. Relaunch and sign in.",
      "accounts.loading": "Loading saved accounts...",
      "accounts.switching": "Switching account...",
      "accounts.preparingSignIn": "Preparing sign-in...",
      "accounts.selected": "selected account",
      "accounts.switchedRelaunching": "Switched to {email}. Relaunching Codex...",
      "accounts.sessionClearedRelaunching": "Session cleared. Relaunching Codex for sign-in...",
      "accounts.relaunchFailed": "Relaunch failed: {error}",
      "settings.activeSession": "Active session",
      "settings.signedInAs": "Signed in as",
      "settings.unsavedAccount": "Unsaved account",
      "settings.noActiveSession": "No active session",
      "settings.activeAuthDescription": "Codex is using the session stored in ~/.codex/auth.json.",
      "settings.noAuthDescription": "No active auth file exists at ~/.codex/auth.json.",
      "settings.accountSetup": "Account setup",
      "settings.signInAnother": "Sign in to another account",
      "settings.signInAnotherDescription": "Back up the current session, clear auth, and relaunch Codex for sign-in.",
      "settings.startSignIn": "Start sign-in",
      "settings.refreshSaved": "Refresh saved accounts",
      "settings.refreshSavedDescription": "Rescan saved sessions in ~/.codex/auth_accounts.",
      "settings.refresh": "Refresh",
      "settings.savedAccounts": "Saved accounts",
      "settings.noSavedAccounts": "No saved accounts yet",
      "settings.noneFound": "None found",
      "settings.noSavedAccountsDescription": "Use Sign in to another account to create one.",
      "settings.activeInWindow": "Active in this Codex window.",
      "settings.usageUnchecked": "Usage not checked yet.",
      "settings.switch": "Switch",
      "settings.delete": "Delete",
      "settings.removing": "Removing account...",
      "service.saved": "Saved current account as {name}.",
      "service.switched": "Switched to {name}. Relaunching Codex.",
      "service.removed": "Removed saved account {name}.",
      "service.sessionCleared": "Session cleared. Relaunching Codex for sign-in.",
      "service.relaunching": "Relaunching Codex..."
    };
    function t2(key, params = {}) {
      const template = STRINGS[key] || key;
      return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
        return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
      });
    }
    module2.exports = { t: t2 };
  }
});

// src/node-utils.js
var require_node_utils = __commonJS({
  "src/node-utils.js"(exports2, module2) {
    var { ACCOUNT_NAME_PATTERN } = require_constants();
    function nodeDeps2() {
      return {
        fs: require("node:fs"),
        fsp: require("node:fs/promises"),
        os: require("node:os"),
        path: require("node:path")
      };
    }
    function codexAuthPaths2() {
      const { os, path } = nodeDeps2();
      const CODEX_DIR = path.join(os.homedir(), ".codex");
      return {
        CODEX_DIR,
        AUTH_PATH: path.join(CODEX_DIR, "auth.json"),
        CONFIG_PATH: path.join(CODEX_DIR, "config.toml"),
        ACCOUNTS_DIR: path.join(CODEX_DIR, "auth_accounts"),
        USAGE_CACHE_PATH: path.join(CODEX_DIR, "auth_accounts_usage.json"),
        CURRENT_NAME_PATH: path.join(CODEX_DIR, "current_account")
      };
    }
    function normalizeAccountName2(rawName) {
      if (typeof rawName !== "string") throw new Error("Account name is required.");
      const name = rawName.trim().replace(/\.json$/i, "");
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error(
          "Use letters, numbers, dots, underscores, or dashes. The name must start with a letter or number."
        );
      }
      return name;
    }
    function accountPath2(name) {
      const { path } = nodeDeps2();
      const { ACCOUNTS_DIR } = codexAuthPaths2();
      return path.join(ACCOUNTS_DIR, `${name}.json`);
    }
    async function ensureDir2(dir) {
      const { fsp } = nodeDeps2();
      await fsp.mkdir(dir, { recursive: true });
    }
    async function pathExists2(target) {
      const { fs, fsp } = nodeDeps2();
      try {
        await fsp.access(target, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    }
    module2.exports = { nodeDeps: nodeDeps2, codexAuthPaths: codexAuthPaths2, normalizeAccountName: normalizeAccountName2, accountPath: accountPath2, ensureDir: ensureDir2, pathExists: pathExists2 };
  }
});

// src/account/auth.js
var require_auth = __commonJS({
  "src/account/auth.js"(exports2, module2) {
    function emailFromAuthString(raw) {
      try {
        return emailFromAuth(JSON.parse(raw));
      } catch {
        return null;
      }
    }
    function emailFromAuth(auth) {
      const direct = auth?.email || auth?.user?.email || auth?.account?.email;
      if (typeof direct === "string" && direct.includes("@")) return direct;
      const idToken = auth?.tokens?.id_token;
      if (typeof idToken !== "string") return null;
      const [, payload] = idToken.split(".");
      if (!payload) return null;
      try {
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return typeof claims.email === "string" && claims.email.includes("@") ? claims.email : null;
      } catch {
        return null;
      }
    }
    module2.exports = { emailFromAuthString, emailFromAuth };
  }
});

// src/account/storage.js
var require_storage = __commonJS({
  "src/account/storage.js"(exports2, module2) {
    var {
      nodeDeps: nodeDeps2,
      codexAuthPaths: codexAuthPaths2,
      accountPath: accountPath2,
      ensureDir: ensureDir2,
      pathExists: pathExists2
    } = require_node_utils();
    var { emailFromAuthString } = require_auth();
    async function listAccountNames2() {
      const { fsp } = nodeDeps2();
      const { ACCOUNTS_DIR } = codexAuthPaths2();
      if (!await pathExists2(ACCOUNTS_DIR)) return [];
      const entries = await fsp.readdir(ACCOUNTS_DIR, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name.replace(/\.json$/i, "")).sort((a, b) => a.localeCompare(b, void 0, { sensitivity: "base" }));
    }
    async function getCurrentAccountName2(accounts) {
      const { fsp, path } = nodeDeps2();
      const { AUTH_PATH, ACCOUNTS_DIR, CURRENT_NAME_PATH } = codexAuthPaths2();
      if (!await pathExists2(AUTH_PATH)) return null;
      const matched = await findMatchingAccountByContents(accounts);
      if (matched) return matched;
      try {
        const raw = await fsp.readFile(CURRENT_NAME_PATH, "utf8");
        const name = raw.trim();
        if (name && accounts.includes(name)) return name;
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      if (!await pathExists2(AUTH_PATH)) return null;
      try {
        const stat = await fsp.lstat(AUTH_PATH);
        if (stat.isSymbolicLink()) {
          const target = await fsp.readlink(AUTH_PATH);
          const resolved = path.resolve(path.dirname(AUTH_PATH), target);
          const relative = path.relative(path.resolve(ACCOUNTS_DIR), resolved);
          if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
            return path.basename(resolved).replace(/\.json$/i, "");
          }
        }
      } catch {
      }
      return null;
    }
    async function findMatchingAccountByContents(accounts) {
      const { fsp } = nodeDeps2();
      const { AUTH_PATH } = codexAuthPaths2();
      let active;
      try {
        active = await fsp.readFile(AUTH_PATH, "utf8");
      } catch {
        return null;
      }
      for (const name of accounts) {
        try {
          const saved = await fsp.readFile(accountPath2(name), "utf8");
          if (saved === active) return name;
        } catch {
        }
      }
      return null;
    }
    async function accountContentsMatchActive(contents) {
      const { fsp } = nodeDeps2();
      const { AUTH_PATH } = codexAuthPaths2();
      try {
        return await fsp.readFile(AUTH_PATH, "utf8") === contents;
      } catch {
        return false;
      }
    }
    async function ensureAutosavedActiveAccount() {
      const { fsp } = nodeDeps2();
      const { AUTH_PATH, ACCOUNTS_DIR, CURRENT_NAME_PATH } = codexAuthPaths2();
      if (!await pathExists2(AUTH_PATH)) return null;
      const accounts = await listAccountNames2();
      const matched = await findMatchingAccountByContents(accounts);
      if (matched) {
        await fsp.writeFile(CURRENT_NAME_PATH, `${matched}
`, "utf8");
        return matched;
      }
      const active = await fsp.readFile(AUTH_PATH, "utf8");
      const sameEmail = await findMatchingAccountByEmail(accounts, active);
      if (sameEmail) {
        await fsp.copyFile(AUTH_PATH, accountPath2(sameEmail));
        await fsp.writeFile(CURRENT_NAME_PATH, `${sameEmail}
`, "utf8");
        return sameEmail;
      }
      await ensureDir2(ACCOUNTS_DIR);
      const name = await nextAvailableAccountName("account");
      await fsp.copyFile(AUTH_PATH, accountPath2(name));
      await fsp.writeFile(CURRENT_NAME_PATH, `${name}
`, "utf8");
      return name;
    }
    async function findMatchingAccountByEmail(accounts, activeContents) {
      const activeEmail = emailFromAuthString(activeContents)?.toLowerCase();
      if (!activeEmail) return null;
      const { fsp } = nodeDeps2();
      const { CURRENT_NAME_PATH } = codexAuthPaths2();
      let current = null;
      try {
        current = (await fsp.readFile(CURRENT_NAME_PATH, "utf8")).trim();
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const matches = [];
      for (const name of accounts) {
        try {
          const filePath = accountPath2(name);
          const [contents, stat] = await Promise.all([
            fsp.readFile(filePath, "utf8"),
            fsp.stat(filePath)
          ]);
          if (emailFromAuthString(contents)?.toLowerCase() === activeEmail) {
            matches.push({ name, isCurrent: name === current, mtimeMs: stat.mtimeMs });
          }
        } catch {
        }
      }
      matches.sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
        if (a.mtimeMs !== b.mtimeMs) return b.mtimeMs - a.mtimeMs;
        return a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
      });
      return matches[0]?.name || null;
    }
    async function nextAvailableAccountName(baseName) {
      const accounts = new Set(await listAccountNames2());
      if (!accounts.has(baseName)) return baseName;
      for (let index = 2; index < 1e4; index += 1) {
        const name = `${baseName}-${index}`;
        if (!accounts.has(name)) return name;
      }
      throw new Error("Could not find an available account name.");
    }
    module2.exports = {
      listAccountNames: listAccountNames2,
      getCurrentAccountName: getCurrentAccountName2,
      findMatchingAccountByContents,
      findMatchingAccountByEmail,
      accountContentsMatchActive,
      ensureAutosavedActiveAccount,
      nextAvailableAccountName
    };
  }
});

// src/account/usage.js
var require_usage = __commonJS({
  "src/account/usage.js"(exports, module) {
    var { nodeDeps, codexAuthPaths, ensureDir } = require_node_utils();
    async function readAccountUsage(accounts) {
      const { fsp } = nodeDeps();
      const { USAGE_CACHE_PATH } = codexAuthPaths();
      let raw;
      try {
        raw = JSON.parse(await fsp.readFile(USAGE_CACHE_PATH, "utf8"));
      } catch {
        return {};
      }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
      return Object.fromEntries(
        accounts.map((name) => [name, normalizeUsageSnapshot(raw[name])]).filter(([, usage]) => usage)
      );
    }
    async function writeAccountUsage(name, snapshot) {
      const { fsp } = nodeDeps();
      const { CODEX_DIR, USAGE_CACHE_PATH } = codexAuthPaths();
      const usage = normalizeUsageSnapshot(snapshot);
      if (!usage) return false;
      let cache = {};
      try {
        const raw = JSON.parse(await fsp.readFile(USAGE_CACHE_PATH, "utf8"));
        if (raw && typeof raw === "object" && !Array.isArray(raw)) cache = raw;
      } catch {
      }
      cache[name] = usage;
      await ensureDir(CODEX_DIR);
      await fsp.writeFile(USAGE_CACHE_PATH, `${JSON.stringify(cache, null, 2)}
`, "utf8");
      return true;
    }
    function normalizeUsageSnapshot(snapshot) {
      if (!snapshot || typeof snapshot !== "object") return null;
      const fiveHour = normalizeUsageWindow(snapshot.fiveHour);
      const weekly = normalizeUsageWindow(snapshot.weekly);
      if (!fiveHour && !weekly) return null;
      const at = Number(snapshot.at);
      return {
        fiveHour,
        weekly,
        at: Number.isFinite(at) ? at : Date.now()
      };
    }
    function normalizeUsageWindow(window2) {
      if (!window2 || typeof window2 !== "object") return null;
      const pct = Number(window2.pct);
      if (!Number.isFinite(pct)) return null;
      return {
        label: typeof window2.label === "string" && window2.label ? window2.label : null,
        pct: Math.max(0, Math.min(100, Math.round(pct))),
        resetAt: typeof window2.resetAt === "string" && window2.resetAt ? window2.resetAt : null
      };
    }
    async function fetchActiveUsageSnapshot(api2) {
      if (typeof api2?.fetchActiveUsage === "function") {
        return api2.fetchActiveUsage();
      }
      const usage = await fetchUsageInCodexWebview();
      return snapshotFromUsagePayload(usage);
    }
    async function fetchUsageInCodexWebview() {
      const electronRequire = eval("require");
      const { webContents } = electronRequire("electron");
      const candidates = webContents.getAllWebContents().filter((wc) => {
        const url = wc.getURL();
        return !wc.isDestroyed() && (url.startsWith("app://") || url.includes("codex"));
      });
      let lastError = null;
      for (const wc of candidates) {
        try {
          return await wc.executeJavaScript(usageFetchScript(), true);
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("No Codex webview available for usage fetch.");
    }
    function usageFetchScript() {
      return `(() => new Promise((resolve, reject) => {
    const bridge = window.electronBridge;
    if (typeof bridge?.sendMessageFromView !== "function") {
      reject(new Error("electronBridge unavailable"));
      return;
    }
    const hostId = new URL(window.location.href).searchParams.get("hostId")?.trim() || "local";
    const requestId = "account-switcher-usage-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    let done = false;
    const cleanup = () => {
      done = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
    const finish = (fn, value) => {
      if (done) return;
      cleanup();
      fn(value);
    };
    const onMessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "fetch-response" || data.requestId !== requestId) return;
      if (data.responseType === "success") {
        try {
          const body = JSON.parse(data.bodyJsonString);
          if (data.status >= 200 && data.status < 300) finish(resolve, body);
          else finish(reject, new Error("HTTP " + data.status));
        } catch (error) {
          finish(reject, error);
        }
      } else {
        finish(reject, new Error(data.error || "fetch failed"));
      }
    };
    const timer = window.setTimeout(() => {
      bridge.sendMessageFromView({ type: "cancel-fetch", requestId }).catch(() => {});
      finish(reject, new Error("usage request timed out"));
    }, 10000);
    window.addEventListener("message", onMessage);
    bridge.sendMessageFromView({
      type: "fetch",
      hostId,
      requestId,
      method: "GET",
      url: "/wham/usage",
    }).catch((error) => finish(reject, error));
  }))();`;
    }
    function snapshotFromUsagePayload(payload) {
      const windows = collectUsageWindows(payload);
      const five = pickClosestUsageWindow(windows, 300, (minutes) => minutes > 0 && minutes < 1440);
      const weekly = pickClosestUsageWindow(windows, 7 * 24 * 60, (minutes) => minutes >= 1440);
      return {
        fiveHour: usageWindowSnapshot(five, "5h"),
        weekly: usageWindowSnapshot(weekly, "Weekly"),
        at: Date.now()
      };
    }
    function collectUsageWindows(value, out = [], seen = /* @__PURE__ */ new WeakSet()) {
      if (!value || typeof value !== "object") return out;
      if (seen.has(value)) return out;
      seen.add(value);
      if ("used_percent" in value && "limit_window_seconds" in value && "reset_at" in value) {
        out.push(value);
      }
      const values = Array.isArray(value) ? value : Object.values(value);
      for (const item of values) collectUsageWindows(item, out, seen);
      return out;
    }
    function pickClosestUsageWindow(windows, targetMinutes, predicate) {
      let best = null;
      let bestDistance = Infinity;
      for (const window2 of windows) {
        const minutes = Number(window2?.limit_window_seconds) / 60;
        if (!Number.isFinite(minutes) || !predicate(minutes)) continue;
        const distance = Math.abs(minutes - targetMinutes);
        if (!best || distance < bestDistance) {
          best = window2;
          bestDistance = distance;
        }
      }
      return best;
    }
    function usageWindowSnapshot(window2, label) {
      if (!window2 || typeof window2 !== "object") return null;
      const used = Number(window2.used_percent);
      if (!Number.isFinite(used)) return null;
      const resetAt = formatUsageResetAt(window2.reset_at, Number(window2.limit_window_seconds) >= 86400);
      return {
        label,
        pct: Math.round(Math.min(Math.max(100 - used, 0), 100)),
        resetAt
      };
    }
    function formatUsageResetAt(epochSeconds, includeDay) {
      const seconds = Number(epochSeconds);
      if (!Number.isFinite(seconds)) return null;
      const date = new Date(seconds * 1e3);
      if (!Number.isFinite(date.getTime())) return null;
      return date.toLocaleTimeString(void 0, {
        ...includeDay ? { weekday: "short" } : {},
        hour: "numeric",
        minute: "2-digit"
      });
    }
    module.exports = {
      readAccountUsage,
      writeAccountUsage,
      normalizeUsageSnapshot,
      normalizeUsageWindow,
      fetchActiveUsageSnapshot,
      snapshotFromUsagePayload
    };
  }
});

// src/account/state.js
var require_state = __commonJS({
  "src/account/state.js"(exports2, module2) {
    var { nodeDeps: nodeDeps2, codexAuthPaths: codexAuthPaths2, accountPath: accountPath2, pathExists: pathExists2 } = require_node_utils();
    var { emailFromAuthString } = require_auth();
    var {
      accountContentsMatchActive,
      ensureAutosavedActiveAccount,
      getCurrentAccountName: getCurrentAccountName2,
      listAccountNames: listAccountNames2
    } = require_storage();
    var { readAccountUsage: readAccountUsage2 } = require_usage();
    async function readState2(extra = {}) {
      const { AUTH_PATH, ACCOUNTS_DIR, CONFIG_PATH, CURRENT_NAME_PATH } = codexAuthPaths2();
      await ensureAutosavedActiveAccount();
      const allAccounts = await listAccountNames2();
      const visibleAccounts = await selectVisibleAccounts(allAccounts);
      const accounts = visibleAccounts.map((account) => account.name);
      const current = await getCurrentAccountName2(accounts);
      const hasActiveAuth = await pathExists2(AUTH_PATH);
      const accountEmails = Object.fromEntries(
        visibleAccounts.map(({ name, email }) => [name, email]).filter(([, email]) => email)
      );
      const accountUsage = await readAccountUsage2(accounts);
      return {
        accounts,
        accountEmails,
        accountUsage,
        current,
        hasActiveAuth,
        paths: {
          auth: AUTH_PATH,
          accountsDir: ACCOUNTS_DIR,
          config: CONFIG_PATH,
          current: CURRENT_NAME_PATH
        },
        ...extra
      };
    }
    async function selectVisibleAccounts(accounts) {
      const details = await Promise.all(accounts.map(readAccountDetails));
      const byIdentity = /* @__PURE__ */ new Map();
      for (const detail of details) {
        const key = detail.email ? `email:${detail.email.toLowerCase()}` : `name:${detail.name}`;
        const existing = byIdentity.get(key);
        if (!existing || compareAccountPreference(detail, existing) < 0) {
          byIdentity.set(key, detail);
        }
      }
      return Array.from(byIdentity.values()).sort(
        (a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" })
      );
    }
    async function readAccountDetails(name) {
      const { fsp } = nodeDeps2();
      let raw = null;
      let mtimeMs = 0;
      try {
        const filePath = accountPath2(name);
        const [contents, stat] = await Promise.all([
          fsp.readFile(filePath, "utf8"),
          fsp.stat(filePath)
        ]);
        raw = contents;
        mtimeMs = stat.mtimeMs;
      } catch {
      }
      return {
        name,
        email: raw ? emailFromAuthString(raw) : null,
        isActive: raw ? await accountContentsMatchActive(raw) : false,
        mtimeMs
      };
    }
    function compareAccountPreference(left, right) {
      if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
      if (left.mtimeMs !== right.mtimeMs) return right.mtimeMs - left.mtimeMs;
      return left.name.localeCompare(right.name, void 0, { sensitivity: "base" });
    }
    module2.exports = { readState: readState2, selectVisibleAccounts };
  }
});

// src/account/config.js
var require_config = __commonJS({
  "src/account/config.js"(exports2, module2) {
    var { nodeDeps: nodeDeps2, codexAuthPaths: codexAuthPaths2, ensureDir: ensureDir2 } = require_node_utils();
    async function saveAuthSnapshotWithCurrentBaseUrl2(sourcePath, targetPath) {
      const { fsp } = nodeDeps2();
      const raw = await fsp.readFile(sourcePath, "utf8");
      let auth;
      try {
        auth = JSON.parse(raw);
      } catch {
        await fsp.writeFile(targetPath, raw, "utf8");
        return;
      }
      const currentBaseUrl = await readCurrentOpenAIBaseUrl();
      if (isApiKeyAuth(auth) && currentBaseUrl && !accountOpenAIBaseUrl(auth)) {
        auth.base_url = currentBaseUrl;
        await fsp.writeFile(targetPath, `${JSON.stringify(auth, null, 2)}
`, "utf8");
        return;
      }
      await fsp.writeFile(targetPath, raw, "utf8");
    }
    async function readAuthJson2(filePath, label) {
      const { fsp } = nodeDeps2();
      const raw = await fsp.readFile(filePath, "utf8");
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`${label} is not valid JSON.`);
      }
    }
    async function syncOpenAIBaseUrlForAccount2(auth) {
      if (!isApiKeyAuth(auth)) {
        await setTopLevelOpenAIBaseUrl2(null);
        return;
      }
      const baseUrl = accountOpenAIBaseUrl(auth);
      if (baseUrl) await setTopLevelOpenAIBaseUrl2(baseUrl);
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
    function normalizeBaseUrl(value) {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    async function readCurrentOpenAIBaseUrl() {
      const { fsp } = nodeDeps2();
      const { CONFIG_PATH } = codexAuthPaths2();
      try {
        return readTopLevelTomlString(await fsp.readFile(CONFIG_PATH, "utf8"), "openai_base_url");
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    }
    async function setTopLevelOpenAIBaseUrl2(baseUrl) {
      const { fsp } = nodeDeps2();
      const { CODEX_DIR, CONFIG_PATH } = codexAuthPaths2();
      await ensureDir2(CODEX_DIR);
      let current = "";
      try {
        current = await fsp.readFile(CONFIG_PATH, "utf8");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const next = updateTopLevelTomlString(current, "openai_base_url", baseUrl);
      if (next !== current) {
        await fsp.writeFile(CONFIG_PATH, next, "utf8");
      }
    }
    function updateTopLevelTomlString(raw, key, value) {
      const lines = raw ? raw.replace(/\r\n/g, "\n").split("\n") : [];
      if (lines.length && lines[lines.length - 1] === "") lines.pop();
      const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
      const kept = [];
      let firstTableIndex = null;
      for (const line of lines) {
        const isTableHeader = /^\s*\[/.test(line);
        if (firstTableIndex === null && isTableHeader) firstTableIndex = kept.length;
        if (firstTableIndex === null && keyPattern.test(line)) continue;
        kept.push(line);
      }
      const insertAt = firstTableIndex === null ? kept.length : firstTableIndex;
      if (value) {
        kept.splice(insertAt, 0, `${key} = ${JSON.stringify(value)}`);
      }
      return `${kept.join("\n")}${kept.length ? "\n" : ""}`;
    }
    function readTopLevelTomlString(raw, key) {
      const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(['"])(.*)\\1\\s*(?:#.*)?$`);
      for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
        if (/^\s*\[/.test(line)) return null;
        const match = line.match(keyPattern);
        if (!match) continue;
        return match[2].trim() || null;
      }
      return null;
    }
    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    module2.exports = {
      saveAuthSnapshotWithCurrentBaseUrl: saveAuthSnapshotWithCurrentBaseUrl2,
      readAuthJson: readAuthJson2,
      syncOpenAIBaseUrlForAccount: syncOpenAIBaseUrlForAccount2,
      setTopLevelOpenAIBaseUrl: setTopLevelOpenAIBaseUrl2,
      accountOpenAIBaseUrl
    };
  }
});

// src/account/actions.js
var require_actions = __commonJS({
  "src/account/actions.js"(exports, module) {
    var { t } = require_i18n();
    var {
      nodeDeps,
      codexAuthPaths,
      normalizeAccountName,
      accountPath,
      ensureDir,
      pathExists
    } = require_node_utils();
    var { readState } = require_state();
    var { getCurrentAccountName, listAccountNames } = require_storage();
    var { fetchActiveUsageSnapshot, writeAccountUsage } = require_usage();
    var {
      readAuthJson,
      saveAuthSnapshotWithCurrentBaseUrl,
      setTopLevelOpenAIBaseUrl,
      syncOpenAIBaseUrlForAccount
    } = require_config();
    async function saveCurrentAccount(rawName) {
      const { fsp } = nodeDeps();
      const { AUTH_PATH, ACCOUNTS_DIR, CURRENT_NAME_PATH } = codexAuthPaths();
      const name = normalizeAccountName(rawName);
      if (!await pathExists(AUTH_PATH)) {
        throw new Error(`No active Codex auth file found at ${AUTH_PATH}`);
      }
      await ensureDir(ACCOUNTS_DIR);
      await saveAuthSnapshotWithCurrentBaseUrl(AUTH_PATH, accountPath(name));
      await fsp.writeFile(CURRENT_NAME_PATH, `${name}
`, "utf8");
      return readState({ notice: t("service.saved", { name }) });
    }
    async function switchAccount(rawName, api2) {
      const { fsp } = nodeDeps();
      const { CODEX_DIR, AUTH_PATH, CURRENT_NAME_PATH } = codexAuthPaths();
      const name = normalizeAccountName(rawName);
      const source = accountPath(name);
      if (!await pathExists(source)) throw new Error(`Saved account not found: ${name}`);
      await ensureDir(CODEX_DIR);
      try {
        const account = await readAuthJson(source, `Saved account ${name}`);
        await syncOpenAIBaseUrlForAccount(account);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        api2?.log?.warn?.(`[account-switcher] skipped base URL sync for ${name}: ${message}`);
      }
      await fsp.copyFile(source, AUTH_PATH);
      await fsp.writeFile(CURRENT_NAME_PATH, `${name}
`, "utf8");
      api2?.log?.info?.(`[account-switcher] switched auth file to ${name}; app relaunch required`);
      return readState({
        notice: t("service.switched", { name }),
        requiresAppRelaunch: true
      });
    }
    async function deleteAccount(rawName) {
      const { fsp } = nodeDeps();
      const { CURRENT_NAME_PATH } = codexAuthPaths();
      const name = normalizeAccountName(rawName);
      await fsp.rm(accountPath(name), { force: true });
      try {
        const raw = await fsp.readFile(CURRENT_NAME_PATH, "utf8");
        if (raw.trim() === name) {
          await fsp.rm(CURRENT_NAME_PATH, { force: true });
        }
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      return readState({ notice: t("service.removed", { name }) });
    }
    async function clearActiveAuth(api2) {
      const { fsp, path } = nodeDeps();
      const { CODEX_DIR, AUTH_PATH, CURRENT_NAME_PATH } = codexAuthPaths();
      await ensureDir(CODEX_DIR);
      await setTopLevelOpenAIBaseUrl(null);
      if (await pathExists(AUTH_PATH)) {
        const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        await fsp.copyFile(AUTH_PATH, path.join(CODEX_DIR, `auth.account-switcher-backup-${stamp}.json`));
        await fsp.rm(AUTH_PATH, { force: true });
      }
      await fsp.rm(CURRENT_NAME_PATH, { force: true });
      api2?.log?.info?.("[account-switcher] cleared active auth file; app relaunch required");
      return readState({
        notice: t("service.sessionCleared"),
        requiresAppRelaunch: true
      });
    }
    async function refreshActiveUsage(api2) {
      const accounts = await listAccountNames();
      const current = await getCurrentAccountName(accounts);
      if (!current) return readState();
      const snapshot = await fetchActiveUsageSnapshot(api2);
      await writeAccountUsage(current, snapshot);
      return readState();
    }
    async function relaunchCodex(api) {
      api?.log?.info?.("[account-switcher] relaunch requested");
      const electronRequire = eval("require");
      const { app } = electronRequire("electron");
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 100);
      return readState({ notice: t("service.relaunching") });
    }
    module.exports = {
      saveCurrentAccount,
      switchAccount,
      deleteAccount,
      clearActiveAuth,
      refreshActiveUsage,
      relaunchCodex
    };
  }
});

// src/account/service.js
var require_service = __commonJS({
  "src/account/service.js"(exports2, module2) {
    var { ok, fail, errorMessage, stringifyError } = require_utils();
    var {
      clearActiveAuth: clearActiveAuth2,
      deleteAccount: deleteAccount2,
      refreshActiveUsage: refreshActiveUsage2,
      relaunchCodex: relaunchCodex2,
      saveCurrentAccount: saveCurrentAccount2,
      switchAccount: switchAccount2
    } = require_actions();
    var { readState: readState2 } = require_state();
    function createAccountService2(api2) {
      return {
        async handle(message) {
          const action = message?.action;
          try {
            api2.log?.info?.(`[account-switcher] action ${String(action)}`);
            if (action === "state") return ok(await readState2());
            if (action === "save") return ok(await saveCurrentAccount2(message?.name));
            if (action === "switch") return ok(await switchAccount2(message?.name, api2));
            if (action === "delete") return ok(await deleteAccount2(message?.name));
            if (action === "clear-active") return ok(await clearActiveAuth2(api2));
            if (action === "refresh-usage") return ok(await refreshActiveUsage2(api2));
            if (action === "relaunch") return ok(await relaunchCodex2(api2));
            return fail(`Unknown account action: ${String(action)}`);
          } catch (error) {
            api2.log.warn("[account-switcher] action failed", stringifyError(error));
            return fail(errorMessage(error));
          }
        }
      };
    }
    module2.exports = { createAccountService: createAccountService2 };
  }
});

// src/dom-utils.js
var require_dom_utils = __commonJS({
  "src/dom-utils.js"(exports2, module2) {
    function compactText(element) {
      return (element?.textContent || "").replace(/\s+/g, " ").trim();
    }
    function isVisible(element) {
      if (!(element instanceof HTMLElement)) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    }
    function findMenuItem(root, pattern) {
      return Array.from(
        root.querySelectorAll('[role="menuitem"], button, [data-radix-collection-item]')
      ).find((element) => {
        return element instanceof HTMLElement && isVisible(element) && pattern.test(compactText(element));
      });
    }
    function protectInteractiveControl(element, options = {}) {
      const preventClickDefault = options.preventClickDefault !== false;
      const stop = (event) => {
        event.stopPropagation();
      };
      element.addEventListener("pointerdown", stop, true);
      element.addEventListener("mousedown", stop, true);
      element.addEventListener("mouseup", stop, true);
      element.addEventListener("keydown", stop, true);
      element.addEventListener(
        "click",
        (event) => {
          if (preventClickDefault) event.preventDefault();
          event.stopPropagation();
        },
        true
      );
    }
    module2.exports = { compactText, isVisible, findMenuItem, protectInteractiveControl };
  }
});

// src/ipc.js
var require_ipc = __commonJS({
  "src/ipc.js"(exports2, module2) {
    var { IPC_CHANNEL: IPC_CHANNEL2 } = require_constants();
    async function invoke(state, action, payload = {}) {
      const result = await state.api.ipc.invoke(IPC_CHANNEL2, { ...payload, action });
      if (!result?.ok) throw new Error(result?.error || "Account switcher action failed.");
      state.lastState = result.state;
      return result.state;
    }
    module2.exports = { invoke };
  }
});

// src/ui-components.js
var require_ui_components = __commonJS({
  "src/ui-components.js"(exports2, module2) {
    var { protectInteractiveControl } = require_dom_utils();
    var PANEL_ROW_LEFT_INSET = 30;
    function addButtonFeedback(element, styles) {
      const normal = {
        background: element.style.background || element.style.backgroundColor || "transparent",
        color: element.style.color || "",
        transform: element.style.transform || ""
      };
      const apply = (values) => {
        if (values.background != null) element.style.background = values.background;
        if (values.color != null) element.style.color = values.color;
        if (values.transform != null) element.style.transform = values.transform;
      };
      const hover = styles.hover || {};
      const active = styles.active || hover;
      const restore = () => apply(styles.normal || normal);
      element.style.transition = "background-color 120ms ease, color 120ms ease, transform 80ms ease";
      element.addEventListener("pointerenter", () => {
        if (element.disabled) return;
        apply(hover);
      });
      element.addEventListener("pointerleave", restore);
      element.addEventListener("focus", () => {
        if (element.disabled) return;
        apply(hover);
      });
      element.addEventListener("blur", restore);
      element.addEventListener("pointerdown", () => {
        if (element.disabled) return;
        apply(active);
      });
      element.addEventListener("pointerup", () => {
        if (element.disabled) return;
        apply(hover);
      });
      element.addEventListener("pointercancel", restore);
    }
    function smallButton(label) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText = "height:24px;border:0;border-radius:6px;padding:0 8px;background:color-mix(in srgb,var(--color-token-text-primary,currentColor) 10%,transparent);color:var(--color-token-text-primary,currentColor);font:inherit;font-size:12px;line-height:1;cursor:pointer;";
      addButtonFeedback(button, {
        hover: {
          background: "color-mix(in srgb,var(--color-token-text-primary,currentColor) 16%,transparent)"
        },
        active: {
          background: "color-mix(in srgb,var(--color-token-text-primary,currentColor) 22%,transparent)",
          transform: "scale(0.98)"
        }
      });
      protectInteractiveControl(button);
      return button;
    }
    function iconButton(label, text) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.style.cssText = "display:grid;place-items:center;width:22px;height:22px;border:0;border-radius:5px;background:transparent;color:var(--color-token-text-secondary,currentColor);font:inherit;font-size:16px;line-height:1;cursor:pointer;";
      addButtonFeedback(button, {
        hover: {
          background: "color-mix(in srgb,var(--color-token-text-primary,currentColor) 10%,transparent)",
          color: "var(--color-token-text-primary,currentColor)"
        },
        active: {
          background: "color-mix(in srgb,var(--color-token-text-primary,currentColor) 18%,transparent)",
          color: "var(--color-token-text-primary,currentColor)",
          transform: "scale(0.94)"
        }
      });
      protectInteractiveControl(button);
      return button;
    }
    function settingsButton(label) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.className = "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-sm text-token-text-primary hover:bg-token-foreground/10 disabled:cursor-default disabled:opacity-50";
      button.style.border = "1px solid color-mix(in srgb, currentColor 14%, transparent)";
      button.style.backgroundColor = "color-mix(in srgb, currentColor 5%, transparent)";
      addButtonFeedback(button, {
        hover: {
          background: "color-mix(in srgb, currentColor 10%, transparent)"
        },
        active: {
          background: "color-mix(in srgb, currentColor 16%, transparent)",
          transform: "scale(0.98)"
        }
      });
      protectInteractiveControl(button);
      return button;
    }
    function settingsSection(title) {
      const section = document.createElement("section");
      section.className = "flex flex-col gap-2";
      const titleRow = document.createElement("div");
      titleRow.className = "flex h-toolbar items-center justify-between gap-2 px-0 py-0";
      const inner = document.createElement("div");
      inner.className = "flex min-w-0 flex-1 flex-col gap-1";
      const heading = document.createElement("div");
      heading.className = "text-base font-medium text-token-text-primary";
      heading.textContent = title;
      inner.appendChild(heading);
      titleRow.appendChild(inner);
      section.appendChild(titleRow);
      return section;
    }
    function settingsCard() {
      const card = document.createElement("div");
      card.className = "border-token-border flex flex-col divide-y-[0.5px] divide-token-border rounded-lg border";
      card.style.backgroundColor = "var(--color-background-panel, var(--color-token-bg-fog))";
      return card;
    }
    function settingsRowShell() {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-4 p-3";
      return row;
    }
    function settingsInfoRow(titleText, valueText, descriptionText) {
      const row = settingsRowShell();
      const left = document.createElement("div");
      left.className = "flex min-w-0 flex-col gap-1";
      const title = document.createElement("div");
      title.className = "min-w-0 text-sm text-token-text-primary";
      title.textContent = titleText;
      left.appendChild(title);
      if (descriptionText) {
        const desc = document.createElement("div");
        desc.className = "text-token-text-secondary min-w-0 text-sm";
        desc.textContent = descriptionText;
        left.appendChild(desc);
      }
      const value = document.createElement("div");
      value.className = "max-w-[45%] shrink-0 truncate text-right text-sm text-token-text-secondary";
      value.title = valueText;
      value.textContent = valueText;
      row.append(left, value);
      return row;
    }
    function settingsActionRow(titleText, descriptionText, actionText, onClick) {
      const row = settingsRowShell();
      const left = document.createElement("div");
      left.className = "flex min-w-0 flex-col gap-1";
      const title = document.createElement("div");
      title.className = "min-w-0 text-sm text-token-text-primary";
      title.textContent = titleText;
      left.appendChild(title);
      const desc = document.createElement("div");
      desc.className = "text-token-text-secondary min-w-0 text-sm";
      desc.textContent = descriptionText;
      left.appendChild(desc);
      row.appendChild(left);
      const button = settingsButton(actionText);
      bindButtonAction(button, onClick);
      row.appendChild(button);
      return row;
    }
    function bindButtonAction(button, onAction) {
      let lastRun = 0;
      const run = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;
        const now = Date.now();
        if (now - lastRun < 350) return;
        lastRun = now;
        onAction(event);
      };
      button.addEventListener("pointerup", run);
      button.addEventListener("click", run);
    }
    function settingsStatus(text, isError = false) {
      const status = document.createElement("div");
      status.className = "text-token-text-secondary text-sm";
      status.style.color = isError ? "var(--color-token-text-error, #c2410c)" : "var(--color-token-text-secondary, currentColor)";
      status.textContent = text;
      return status;
    }
    function accountPanelShell(base) {
      const panel = document.createElement("div");
      panel.setAttribute("data-codexpp-account-switcher", "panel");
      panel.setAttribute("role", "presentation");
      panel.style.cssText = [
        "box-sizing:border-box",
        "width:100%",
        "margin:0",
        "padding:0",
        "color:var(--color-token-text-primary,currentColor)",
        "cursor:default",
        "user-select:none"
      ].join(";");
      return panel;
    }
    function setPanelStatus(panel, text) {
      panel.textContent = "";
      const status = document.createElement("div");
      status.textContent = text;
      status.style.cssText = `font-size:12px;line-height:1.35;color:var(--color-token-text-secondary,currentColor);padding:4px 24px 6px ${PANEL_ROW_LEFT_INSET}px;`;
      panel.appendChild(status);
    }
    function accountDisplayName(accountState, name, options = {}) {
      const email = accountState?.accountEmails?.[name];
      const suffix = accountState?.current === name && options.includeCurrent !== false ? " (current)" : "";
      return email ? `${email}${suffix}` : `${name}${suffix}`;
    }
    function accountUsageSummary(accountState, name) {
      const usage = accountState?.accountUsage?.[name];
      if (!usage || typeof usage !== "object") return null;
      const parts = [];
      const fiveHour = usageWindowSummary(usage.fiveHour, "5h");
      const weekly = usageWindowSummary(usage.weekly, "Weekly");
      if (fiveHour) parts.push(fiveHour);
      if (weekly) parts.push(weekly);
      if (!parts.length) return null;
      return parts.join(" \xB7 ");
    }
    function usageWindowSummary(window2, fallbackLabel) {
      if (typeof window2?.pct !== "number") return null;
      const label = window2.label || fallbackLabel;
      const reset = window2.pct <= 0 && window2.resetAt ? `, resets ${window2.resetAt}` : "";
      return `${label} ${window2.pct}%${reset}`;
    }
    module2.exports = {
      PANEL_ROW_LEFT_INSET,
      addButtonFeedback,
      smallButton,
      iconButton,
      settingsButton,
      settingsSection,
      settingsCard,
      settingsRowShell,
      settingsInfoRow,
      settingsActionRow,
      settingsStatus,
      bindButtonAction,
      accountPanelShell,
      setPanelStatus,
      accountDisplayName,
      accountUsageSummary
    };
  }
});

// src/ui-settings.js
var require_ui_settings = __commonJS({
  "src/ui-settings.js"(exports2, module2) {
    var { errorMessage } = require_utils();
    var { invoke } = require_ipc();
    var { t: t2 } = require_i18n();
    var {
      settingsButton,
      settingsSection,
      settingsCard,
      settingsRowShell,
      settingsInfoRow,
      settingsActionRow,
      settingsStatus,
      accountDisplayName,
      accountUsageSummary,
      bindButtonAction
    } = require_ui_components();
    async function renderAccountsPage(state, root) {
      root.textContent = "";
      root.appendChild(settingsStatus(t2("accounts.loading")));
      try {
        const accountState = await invoke(state, "state");
        renderAccountsPageState(state, root, accountState);
        refreshUsageInBackground(state, root);
      } catch (error) {
        root.textContent = "";
        root.appendChild(settingsStatus(errorMessage(error), true));
      }
    }
    function renderAccountsPageState(state, root, accountState) {
      root.textContent = "";
      const intro = settingsSection(t2("settings.activeSession"));
      const introCard = settingsCard();
      const currentName = accountState.current || (accountState.hasActiveAuth ? t2("settings.unsavedAccount") : t2("settings.noActiveSession"));
      const currentValue = accountState.current ? accountDisplayName(accountState, accountState.current, { includeCurrent: false }) : currentName;
      introCard.appendChild(
        settingsInfoRow(
          t2("settings.signedInAs"),
          currentValue,
          accountState.hasActiveAuth ? t2("settings.activeAuthDescription") : t2("settings.noAuthDescription")
        )
      );
      intro.appendChild(introCard);
      root.appendChild(intro);
      const actions = settingsSection(t2("settings.accountSetup"));
      const actionCard = settingsCard();
      actionCard.appendChild(
        settingsActionRow(
          t2("settings.signInAnother"),
          t2("settings.signInAnotherDescription"),
          t2("settings.startSignIn"),
          () => clearActiveFromSettings(state, root)
        )
      );
      actionCard.appendChild(
        settingsActionRow(
          t2("settings.refreshSaved"),
          t2("settings.refreshSavedDescription"),
          t2("settings.refresh"),
          () => renderAccountsPage(state, root)
        )
      );
      actions.appendChild(actionCard);
      root.appendChild(actions);
      const saved = settingsSection(t2("settings.savedAccounts"));
      const savedCard = settingsCard();
      const accounts = Array.isArray(accountState.accounts) ? accountState.accounts : [];
      if (!accounts.length) {
        savedCard.appendChild(
          settingsInfoRow(
            t2("settings.noSavedAccounts"),
            t2("settings.noneFound"),
            t2("settings.noSavedAccountsDescription")
          )
        );
      } else {
        for (const name of accounts) {
          savedCard.appendChild(settingsAccountRow(state, root, accountState, name));
        }
      }
      saved.appendChild(savedCard);
      root.appendChild(saved);
      if (accountState.notice || accountState.error) {
        root.appendChild(settingsStatus(accountState.notice || accountState.error, !!accountState.error));
      }
    }
    function settingsAccountRow(state, root, accountState, name) {
      const row = settingsRowShell();
      const left = document.createElement("div");
      left.className = "flex min-w-0 flex-col gap-1";
      const title = document.createElement("div");
      title.className = "min-w-0 truncate text-sm text-token-text-primary";
      title.textContent = accountDisplayName(accountState, name);
      title.title = accountDisplayName(accountState, name, { includeCurrent: false });
      left.appendChild(title);
      const desc = document.createElement("div");
      desc.className = "text-token-text-secondary min-w-0 text-sm";
      desc.textContent = accountUsageSummary(accountState, name) || (accountState.current === name ? t2("settings.activeInWindow") : t2("settings.usageUnchecked"));
      left.appendChild(desc);
      row.appendChild(left);
      const actionsEl = document.createElement("div");
      actionsEl.className = "flex shrink-0 items-center gap-2";
      const switchButton = settingsButton(t2("settings.switch"));
      switchButton.disabled = accountState.current === name;
      bindButtonAction(
        switchButton,
        () => runSettingsAction(state, root, "switch", { name }, t2("accounts.switching"))
      );
      actionsEl.appendChild(switchButton);
      const removeButton = settingsButton(t2("settings.delete"));
      bindButtonAction(removeButton, () => {
        runSettingsAction(state, root, "delete", { name }, t2("settings.removing"));
      });
      actionsEl.appendChild(removeButton);
      row.appendChild(actionsEl);
      return row;
    }
    function clearActiveFromSettings(state, root) {
      runSettingsAction(state, root, "clear-active", {}, t2("accounts.preparingSignIn"));
    }
    function refreshUsageInBackground(state, root) {
      const now = Date.now();
      if (state.usageRefreshInFlight || now - (state.lastUsageRefreshAt || 0) < 6e4) return;
      state.usageRefreshInFlight = true;
      state.lastUsageRefreshAt = now;
      invoke(state, "refresh-usage").then((accountState) => {
        if (root.isConnected) renderAccountsPageState(state, root, accountState);
      }).catch((error) => {
        state.api.log.warn("[account-switcher] usage refresh failed", errorMessage(error));
      }).finally(() => {
        state.usageRefreshInFlight = false;
      });
    }
    async function runSettingsAction(state, root, action, payload, loadingText) {
      root.textContent = "";
      root.appendChild(settingsStatus(loadingText));
      try {
        const accountState = await invoke(state, action, payload);
        if (action === "switch" || action === "clear-active") {
          root.textContent = "";
          root.appendChild(settingsStatus(authReloadMessage(action, accountState)));
          scheduleAppRelaunch(state, root);
          return;
        }
        renderAccountsPageState(state, root, accountState);
      } catch (error) {
        renderAccountsPageState(state, root, {
          ...state.lastState || { accounts: [], current: null, hasActiveAuth: false },
          error: errorMessage(error)
        });
      }
    }
    function authReloadMessage(action, accountState) {
      if (action === "clear-active") {
        return t2("accounts.sessionClearedRelaunching");
      }
      const email = accountState.current ? accountDisplayName(accountState, accountState.current, { includeCurrent: false }) : t2("accounts.selected");
      return t2("accounts.switchedRelaunching", { email });
    }
    function scheduleAppRelaunch(state, root) {
      window.setTimeout(() => {
        invoke(state, "relaunch").catch((error) => {
          root.textContent = "";
          root.appendChild(settingsStatus(t2("accounts.relaunchFailed", { error: errorMessage(error) }), true));
        });
      }, 1200);
    }
    module2.exports = {
      renderAccountsPage,
      renderAccountsPageState
    };
  }
});

// src/ui-popup.js
var require_ui_popup = __commonJS({
  "src/ui-popup.js"(exports2, module2) {
    var { errorMessage } = require_utils();
    var { invoke } = require_ipc();
    var { t: t2 } = require_i18n();
    var { compactText, isVisible, protectInteractiveControl } = require_dom_utils();
    var { renderAccountsPageState } = require_ui_settings();
    var {
      accountPanelShell,
      setPanelStatus,
      PANEL_ROW_LEFT_INSET,
      accountDisplayName,
      accountUsageSummary,
      addButtonFeedback,
      bindButtonAction
    } = require_ui_components();
    var ACCOUNTS_PANEL_TRANSITION_MS = 160;
    var ACCOUNTS_PANEL_EASING = "cubic-bezier(0.2, 0, 0, 1)";
    function renderAccountPanel(state, panel, accountState) {
      panel.textContent = "";
      panel.setAttribute("data-codexpp-account-switcher", "panel");
      const accounts = Array.isArray(accountState.accounts) ? accountState.accounts : [];
      const expanded = state.accountsExpanded !== false;
      const section = document.createElement("div");
      section.style.cssText = "display:flex;flex-direction:column;padding:2px 0 4px;";
      section.appendChild(accountsHeaderRow(state, panel, accountState, expanded));
      if (!expanded) {
        panel.appendChild(section);
        return;
      }
      const list = document.createElement("div");
      list.style.cssText = `display:flex;flex-direction:column;min-width:0;margin-left:${PANEL_ROW_LEFT_INSET}px;`;
      if (accounts.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = accountState.hasActiveAuth ? t2("accounts.emptySaved") : t2("accounts.emptyActive");
        empty.style.cssText = "font-size:12px;color:var(--color-token-text-secondary,currentColor);padding:2px 0 4px;";
        list.appendChild(empty);
      }
      for (const name of accounts) {
        list.appendChild(accountRow(state, panel, accountState, name));
      }
      list.appendChild(configureAccountsRow(state, panel));
      const body = document.createElement("div");
      body.setAttribute("data-codexpp-account-switcher-body", "accounts");
      body.style.cssText = "overflow:hidden;opacity:1;";
      const bodyInner = document.createElement("div");
      bodyInner.style.cssText = "min-height:0;";
      bodyInner.appendChild(list);
      body.appendChild(bodyInner);
      section.appendChild(body);
      panel.appendChild(section);
      if (accountState.notice || accountState.error) {
        const note = document.createElement("div");
        note.textContent = accountState.notice || accountState.error;
        note.style.cssText = `padding:0 24px 6px ${PANEL_ROW_LEFT_INSET}px;font-size:11px;line-height:1.3;color:` + (accountState.error ? "var(--color-token-text-error,#ff6b6b)" : "var(--color-token-text-secondary,currentColor)") + ";";
        panel.appendChild(note);
      }
    }
    function accountsHeaderRow(state, panel, accountState, expanded) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
      button.style.cssText = "width:100%;border:0;background:transparent;color:var(--color-token-text-tertiary,currentColor);font:inherit;font-size:14px;text-align:left;border-radius:8px;padding:2px 0;cursor:pointer;display:grid;grid-template-columns:26px minmax(0,1fr) 20px;column-gap:4px;align-items:center;";
      button.appendChild(cloneAccountIcon(panel, accountState));
      const title = document.createElement("span");
      title.textContent = t2("accounts.title");
      title.style.cssText = "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--color-token-text-primary,currentColor);";
      button.appendChild(title);
      const chevronSlot = document.createElement("span");
      chevronSlot.style.cssText = "display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding-right:12px;";
      chevronSlot.appendChild(cloneRateLimitsChevron(panel, expanded));
      button.appendChild(chevronSlot);
      addButtonFeedback(button, {
        normal: { background: "transparent" },
        hover: { background: "color-mix(in srgb,currentColor 8%,transparent)" },
        active: {
          background: "color-mix(in srgb,currentColor 12%,transparent)",
          transform: "scale(0.99)"
        }
      });
      protectInteractiveControl(button);
      bindButtonAction(button, () => toggleAccountsExpanded(state, panel, accountState, expanded));
      return button;
    }
    function toggleAccountsExpanded(state, panel, accountState, expanded) {
      if (!expanded) {
        state.accountsExpanded = true;
        renderAccountPanel(state, panel, accountState);
        return;
      }
      const header = panel.querySelector("button[aria-expanded='true']");
      header?.setAttribute("aria-expanded", "false");
      const chevron = header?.querySelector("svg");
      if (chevron instanceof SVGElement) {
        chevron.style.transform = "rotate(0deg)";
      }
      state.accountsExpanded = false;
      renderAccountPanel(state, panel, accountState);
    }
    function cloneAccountIcon(panel, accountState) {
      const icon = findAccountMenuIcon(panel, accountState);
      const slot = document.createElement("span");
      slot.setAttribute("aria-hidden", "true");
      slot.style.cssText = "display:flex;align-items:center;justify-content:center;height:27px;width:30px;padding-left:2px;color:var(--color-token-text-primary,currentColor);";
      if (icon) {
        const clone = icon.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        slot.appendChild(clone);
        return slot;
      }
      slot.textContent = "\u25CE";
      slot.style.fontSize = "15px";
      return slot;
    }
    function findAccountMenuIcon(panel, accountState) {
      const menu = panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') || document;
      const current = accountState.current ? accountDisplayName(accountState, accountState.current, { includeCurrent: false }) : "";
      const candidates2 = Array.from(menu.querySelectorAll('button, a, [role="menuitem"], div'));
      const accountRow2 = candidates2.find((element) => {
        if (!(element instanceof HTMLElement)) return false;
        const text = element.textContent || "";
        return current && text.includes(current) || /@/.test(text);
      });
      if (!(accountRow2 instanceof HTMLElement)) return null;
      return accountRow2.querySelector("svg");
    }
    function cloneRateLimitsChevron(panel, expanded) {
      const chevron = findRateLimitsChevron(panel);
      if (chevron) {
        const clone = chevron.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.style.transform = expanded ? "rotate(90deg)" : "rotate(0deg)";
        clone.style.transformOrigin = "center";
        clone.style.transition = `transform ${ACCOUNTS_PANEL_TRANSITION_MS}ms ${ACCOUNTS_PANEL_EASING}`;
        return clone;
      }
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      return spacer;
    }
    function findRateLimitsChevron(panel) {
      const menu = panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') || document;
      const usageRemaining = findUsageRemainingItem(menu);
      if (!(usageRemaining instanceof HTMLElement)) return null;
      const icons = Array.from(usageRemaining.querySelectorAll("svg"));
      return icons.length ? icons[icons.length - 1] : null;
    }
    function findUsageRemainingItem(root) {
      const selectorMatch = root.querySelector(
        [
          '[id*="usage" i]',
          '[class*="usage" i]',
          '[data-testid*="usage" i]',
          '[data-test*="usage" i]',
          '[aria-label*="usage" i]',
          '[title*="usage" i]'
        ].join(",")
      );
      if (selectorMatch instanceof HTMLElement && isVisible(selectorMatch) && !selectorMatch.closest("[data-codexpp-account-switcher]")) {
        const item = selectorMatch.closest(
          'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]'
        );
        if (isUsageRemainingItem(item)) return item;
        if (isUsageRemainingItem(selectorMatch)) return selectorMatch;
      }
      return Array.from(
        root.querySelectorAll(
          'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]'
        )
      ).find((element) => isUsageRemainingItem(element));
    }
    function isUsageRemainingItem(element) {
      if (!isMenuItemLike(element) || !isVisible(element)) return false;
      if (element.closest("[data-codexpp-account-switcher]")) return false;
      const label = [
        compactText(element),
        element.getAttribute("aria-label") || "",
        element.getAttribute("title") || ""
      ].join(" ");
      return /\busage remaining\b/i.test(label) || /\brate limits remaining\b/i.test(label);
    }
    function isMenuItemLike(element) {
      return element instanceof HTMLElement && element.matches('button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]');
    }
    function accountRow(state, panel, accountState, name) {
      const row = document.createElement("button");
      row.type = "button";
      row.title = accountDisplayName(accountState, name, { includeCurrent: false });
      const normalBackground = accountState.current === name ? "var(--color-token-list-hover-background, var(--color-token-bg-tertiary, color-mix(in srgb,currentColor 8%,transparent)))" : "transparent";
      row.style.cssText = `width:100%;border:0;text-align:left;font:inherit;display:flex;flex-direction:column;gap:2px;border-radius:8px;margin-left:-8px;margin-right:-8px;padding:4px 8px;background:${normalBackground};color:var(--color-token-text-primary,currentColor);cursor:pointer;`;
      const nameText = document.createElement("span");
      nameText.textContent = accountDisplayName(accountState, name);
      nameText.style.cssText = "display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;";
      row.appendChild(nameText);
      const usage = accountUsageSummary(accountState, name);
      if (usage) {
        const usageText = document.createElement("span");
        usageText.textContent = usage;
        usageText.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--color-token-text-secondary,currentColor);font-size:11px;";
        row.appendChild(usageText);
      }
      addButtonFeedback(row, {
        normal: { background: normalBackground },
        hover: {
          background: accountState.current === name ? "var(--color-token-list-hover-background, var(--color-token-bg-tertiary, color-mix(in srgb,currentColor 10%,transparent)))" : "var(--color-token-list-hover-background, color-mix(in srgb,currentColor 8%,transparent))"
        },
        active: {
          background: accountState.current === name ? "var(--color-token-list-active-selection-background, var(--color-token-list-hover-background, color-mix(in srgb,currentColor 12%,transparent)))" : "var(--color-token-list-hover-background, color-mix(in srgb,currentColor 12%,transparent))",
          transform: "scale(0.99)"
        }
      });
      protectInteractiveControl(row);
      bindButtonAction(row, () => {
        if (accountState.current === name) return;
        void runPanelAction(state, panel, "switch", { name }, t2("accounts.switching"));
      });
      return row;
    }
    function configureAccountsRow(state, panel) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = t2("accounts.configure");
      button.style.cssText = "width:100%;border:0;background:transparent;color:var(--color-token-text-secondary,currentColor);font:inherit;font-size:13px;text-align:left;border-radius:8px;margin-left:-8px;margin-right:-8px;padding:5px 8px;cursor:pointer;";
      addButtonFeedback(button, {
        normal: { background: "transparent" },
        hover: { background: "color-mix(in srgb,currentColor 8%,transparent)" },
        active: {
          background: "color-mix(in srgb,currentColor 12%,transparent)",
          transform: "scale(0.99)"
        }
      });
      protectInteractiveControl(button);
      bindButtonAction(button, () => openAccountsSettings(state, panel));
      return button;
    }
    function openAccountsSettings(state, panel) {
      const menu = panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') || document;
      const settingsItem = findMenuCommand(menu, /settings/i);
      settingsItem?.click();
      window.setTimeout(() => {
        const accountsNav = Array.from(
          document.querySelectorAll('button[data-codexpp^="nav-page-"], button')
        ).find((element) => {
          return element instanceof HTMLElement && /\baccounts\b/i.test(element.textContent || "");
        });
        if (accountsNav instanceof HTMLElement) accountsNav.click();
      }, 300);
      panel.remove();
    }
    function findMenuCommand(root, pattern) {
      return Array.from(root.querySelectorAll('button, a, [role="menuitem"]')).find((element) => {
        return element instanceof HTMLElement && pattern.test(element.textContent || "");
      });
    }
    async function runPanelAction(state, panel, action, payload, loadingText) {
      setPanelStatus(panel, loadingText);
      try {
        const accountState = await invoke(state, action, payload);
        if (action === "switch" || action === "clear-active") {
          setPanelStatus(panel, authReloadMessage(action, accountState));
          scheduleAppRelaunch(state, panel);
          return;
        }
        renderAccountPanel(state, panel, accountState);
        if (state.settingsRoot?.isConnected) {
          renderAccountsPageState(state, state.settingsRoot, accountState);
        }
      } catch (error) {
        renderAccountPanel(state, panel, {
          ...state.lastState || { accounts: [], current: null, hasActiveAuth: false },
          error: errorMessage(error)
        });
      }
    }
    function authReloadMessage(action, accountState) {
      if (action === "clear-active") {
        return t2("accounts.sessionClearedRelaunching");
      }
      const email = accountState.current ? accountDisplayName(accountState, accountState.current, { includeCurrent: false }) : t2("accounts.selected");
      return t2("accounts.switchedRelaunching", { email });
    }
    function scheduleAppRelaunch(state, panel) {
      window.setTimeout(() => {
        invoke(state, "relaunch").catch((error) => {
          setPanelStatus(panel, t2("accounts.relaunchFailed", { error: errorMessage(error) }));
        });
      }, 1200);
    }
    async function refreshPanel(state, panel) {
      setPanelStatus(panel, t2("accounts.loading"));
      try {
        const accountState = await invoke(state, "state");
        renderAccountPanel(state, panel, accountState);
        refreshUsageInBackground(state, panel);
      } catch (error) {
        setPanelStatus(panel, errorMessage(error));
      }
    }
    function refreshUsageInBackground(state, panel) {
      const now = Date.now();
      if (state.usageRefreshInFlight || now - (state.lastUsageRefreshAt || 0) < 6e4) return;
      state.usageRefreshInFlight = true;
      state.lastUsageRefreshAt = now;
      invoke(state, "refresh-usage").then((accountState) => {
        if (panel.isConnected) renderAccountPanel(state, panel, accountState);
        if (state.settingsRoot?.isConnected) {
          renderAccountsPageState(state, state.settingsRoot, accountState);
        }
      }).catch((error) => {
        state.api.log.warn("[account-switcher] usage refresh failed", errorMessage(error));
      }).finally(() => {
        state.usageRefreshInFlight = false;
      });
    }
    module2.exports = { renderAccountPanel, accountPanelShell, refreshPanel };
  }
});

// src/renderer.js
var require_renderer = __commonJS({
  "src/renderer.js"(exports2, module2) {
    var { compactText, isVisible, findMenuItem } = require_dom_utils();
    var { accountPanelShell, renderAccountPanel, refreshPanel } = require_ui_popup();
    var { renderAccountsPage } = require_ui_settings();
    function startRenderer2(state) {
      if (typeof state.api.settings?.registerPage === "function") {
        const pageHandle = state.api.settings.registerPage({
          id: "accounts",
          title: "Accounts",
          description: "Switch Codex accounts and manage saved sessions.",
          iconSvg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M10 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M4.75 16.25c.7-2.15 2.65-3.5 5.25-3.5s4.55 1.35 5.25 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
          render: (root) => {
            state.settingsRoot = root;
            renderAccountsPage(state, root);
          }
        });
        state.disposers.push(() => pageHandle.unregister?.());
      } else {
        state.api.log.warn(
          "[account-switcher] registerPage unavailable; account controls will only appear in the account menu."
        );
      }
      const schedule = () => {
        if (state.disposed || state.pending) return;
        state.pending = window.requestAnimationFrame(() => {
          state.pending = 0;
          scanForAccountMenu(state);
        });
      };
      state.observer = new MutationObserver(schedule);
      state.observer.observe(document.documentElement, { childList: true, subtree: true });
      state.disposers.push(() => state.observer?.disconnect());
      document.addEventListener("pointerdown", schedule, true);
      document.addEventListener("keydown", schedule, true);
      state.disposers.push(() => document.removeEventListener("pointerdown", schedule, true));
      state.disposers.push(() => document.removeEventListener("keydown", schedule, true));
      schedule();
    }
    function scanForAccountMenu(state) {
      const menu = findSettingsAccountMenu();
      if (!menu) return;
      if (menu.querySelector("[data-codexpp-account-switcher]")) return;
      installAccountSwitcher(state, menu);
    }
    function findSettingsAccountMenu() {
      const candidates2 = Array.from(
        document.querySelectorAll(
          '[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]'
        )
      );
      for (const candidate of candidates2) {
        if (!(candidate instanceof HTMLElement) || !isVisible(candidate)) continue;
        const text = compactText(candidate);
        if (!/\bsettings\b/i.test(text) || !/\blog out\b/i.test(text)) continue;
        if (!hasUsageRemainingItem(candidate) && !/\bpersonal account\b/i.test(text)) continue;
        return candidate.matches("[data-radix-popper-content-wrapper]") ? candidate.querySelector('[role="menu"], [data-radix-menu-content]') || candidate : candidate;
      }
      return findAccountMenuByRateLimits() || findSidebarAccountMenuByItems();
    }
    function findAccountMenuByRateLimits() {
      const usageRemaining = findUsageRemainingItem();
      if (!usageRemaining) return null;
      const menu = usageRemaining.closest(
        '[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]'
      );
      if (menu instanceof HTMLElement && isVisible(menu)) {
        const text = compactText(menu);
        if (/\bsettings\b/i.test(text) || /\blog out\b/i.test(text) || hasUsageRemainingItem(menu)) {
          return menu.matches("[data-radix-popper-content-wrapper]") ? menu.querySelector('[role="menu"], [data-radix-menu-content]') || menu : menu;
        }
      }
      return null;
    }
    function findUsageRemainingItem(root = document) {
      const selectorMatch = root.querySelector(
        [
          '[id*="usage" i]',
          '[class*="usage" i]',
          '[data-testid*="usage" i]',
          '[data-test*="usage" i]',
          '[aria-label*="usage" i]',
          '[title*="usage" i]'
        ].join(",")
      );
      if (selectorMatch instanceof HTMLElement && isVisible(selectorMatch) && !selectorMatch.closest("[data-codexpp-account-switcher]")) {
        const item = selectorMatch.closest(
          'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]'
        );
        if (isUsageRemainingItem(item)) return item;
        if (isUsageRemainingItem(selectorMatch)) return selectorMatch;
      }
      const candidates2 = root.querySelectorAll(
        'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]'
      );
      for (const element of candidates2) {
        if (isUsageRemainingItem(element)) return element;
      }
      return null;
    }
    function isUsageRemainingItem(element) {
      if (!isMenuItemLike(element) || !isVisible(element)) return false;
      if (element.closest("[data-codexpp-account-switcher]")) return false;
      const label = [
        compactText(element),
        element.getAttribute("aria-label") || "",
        element.getAttribute("title") || ""
      ].join(" ");
      return /\busage remaining\b/i.test(label) || /\brate limits remaining\b/i.test(label);
    }
    function isMenuItemLike(element) {
      return element instanceof HTMLElement && element.matches('button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]');
    }
    function hasUsageRemainingItem(root) {
      return Boolean(findUsageRemainingItem(root));
    }
    function findSidebarAccountMenuByItems() {
      const items = Array.from(
        document.querySelectorAll('button, a, [role="menuitem"], [data-radix-collection-item]')
      ).filter((element) => isMenuItemLike(element) && isVisible(element));
      const settings = items.find((element) => isMenuCommandItem(element, /\bsettings\b/i));
      const logout = items.find((element) => isMenuCommandItem(element, /\blog out\b/i));
      if (!settings || !logout) return null;
      let node = settings.parentElement;
      while (node && node !== document.body) {
        if (node.contains(logout)) {
          const text = compactText(node);
          if (hasUsageRemainingItem(node) || /\bpersonal account\b/i.test(text)) {
            return node;
          }
        }
        node = node.parentElement;
      }
      return null;
    }
    function isMenuCommandItem(element, pattern) {
      if (!isMenuItemLike(element) || !isVisible(element)) return false;
      if (element.closest("[data-codexpp-account-switcher]")) return false;
      const label = [
        compactText(element),
        element.getAttribute("aria-label") || "",
        element.getAttribute("title") || ""
      ].join(" ");
      return label.length <= 120 && pattern.test(label);
    }
    function installAccountSwitcher(state, menu) {
      const target = findUsageRemainingItem(menu) || findMenuItem(menu, /settings/i) || Array.from(menu.children).find((child) => child instanceof HTMLElement);
      if (!(target instanceof HTMLElement) || !target.parentElement) return;
      const panel = accountPanelShell(target);
      target.before(panel);
      refreshPanel(state, panel).catch((error) => {
        state.api.log.warn("[account-switcher] panel load failed", String(error));
      });
    }
    module2.exports = { startRenderer: startRenderer2 };
  }
});

// index.js
var { GLOBAL_SERVICE_KEY, IPC_HANDLER_KEY, IPC_CHANNEL } = require_constants();
var { createAccountService } = require_service();
var { startRenderer } = require_renderer();
module.exports = {
  start(api2) {
    if (api2.process === "main") {
      startMain(api2);
      return;
    }
    const state = {
      api: api2,
      accountsExpanded: true,
      observer: null,
      pending: 0,
      disposed: false,
      disposers: [],
      lastState: null,
      lastUsageRefreshAt: 0,
      settingsRoot: null,
      usageRefreshInFlight: false
    };
    this._state = state;
    startRenderer(state);
  },
  stop() {
    const state = this._state;
    if (!state) return;
    state.disposed = true;
    if (state.observer) state.observer.disconnect();
    if (state.pending) window.cancelAnimationFrame(state.pending);
    for (const dispose of state.disposers.splice(0).reverse()) {
      try {
        dispose();
      } catch {
      }
    }
    this._pageHandle?.unregister?.();
    document.querySelectorAll("[data-codexpp-account-switcher]").forEach((element) => {
      element.remove();
    });
  }
};
function startMain(api2) {
  const service = createAccountService(api2);
  globalThis[GLOBAL_SERVICE_KEY] = service;
  if (!globalThis[IPC_HANDLER_KEY]) {
    api2.ipc.handle(IPC_CHANNEL, async (message) => {
      const active = globalThis[GLOBAL_SERVICE_KEY];
      return active.handle(message);
    });
    globalThis[IPC_HANDLER_KEY] = true;
  }
  api2.log.info("[account-switcher] main provider active");
}
