const { errorMessage } = require("./utils");
const { invoke } = require("./ipc");
const { t } = require("./i18n");
const { compactText, isVisible, protectInteractiveControl } = require("./dom-utils");
const { renderAccountsPageState } = require("./ui-settings");
const {
  accountPanelShell,
  setPanelStatus,
  PANEL_ROW_LEFT_INSET,
  accountDisplayName,
  accountUsageSummary,
  addButtonFeedback,
  bindButtonAction,
} = require("./ui-components");

const ACCOUNTS_PANEL_TRANSITION_MS = 160;
const ACCOUNTS_PANEL_EASING = "cubic-bezier(0.2, 0, 0, 1)";

// ─── Panel render ─────────────────────────────────────────────────────────────

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
    empty.textContent = accountState.hasActiveAuth
      ? t("accounts.emptySaved")
      : t("accounts.emptyActive");
    empty.style.cssText =
      "font-size:12px;color:var(--color-token-text-secondary,currentColor);padding:2px 0 4px;";
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

  // Notice / error
  if (accountState.notice || accountState.error) {
    const note = document.createElement("div");
    note.textContent = accountState.notice || accountState.error;
    note.style.cssText =
      `padding:0 24px 6px ${PANEL_ROW_LEFT_INSET}px;font-size:11px;line-height:1.3;color:` +
      (accountState.error
        ? "var(--color-token-text-error,#ff6b6b)"
        : "var(--color-token-text-secondary,currentColor)") +
      ";";
    panel.appendChild(note);
  }
}

function accountsHeaderRow(state, panel, accountState, expanded) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-expanded", expanded ? "true" : "false");
  button.style.cssText =
    "width:100%;border:0;background:transparent;color:var(--color-token-text-tertiary,currentColor);" +
    "font:inherit;font-size:14px;text-align:left;border-radius:8px;" +
    "padding:2px 0;cursor:pointer;display:grid;grid-template-columns:26px minmax(0,1fr) 20px;" +
    "column-gap:4px;align-items:center;";

  button.appendChild(cloneAccountIcon(panel, accountState));

  const title = document.createElement("span");
  title.textContent = t("accounts.title");
  title.style.cssText = "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--color-token-text-primary,currentColor);";
  button.appendChild(title);

  const chevronSlot = document.createElement("span");
  chevronSlot.style.cssText =
    "display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding-right:12px;";
  chevronSlot.appendChild(cloneRateLimitsChevron(panel, expanded));
  button.appendChild(chevronSlot);

  addButtonFeedback(button, {
    normal: { background: "transparent" },
    hover: { background: "color-mix(in srgb,currentColor 8%,transparent)" },
    active: {
      background: "color-mix(in srgb,currentColor 12%,transparent)",
      transform: "scale(0.99)",
    },
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
  slot.style.cssText =
    "display:flex;align-items:center;justify-content:center;height:27px;width:30px;padding-left:2px;" +
    "color:var(--color-token-text-primary,currentColor);";

  if (icon) {
    const clone = icon.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    slot.appendChild(clone);
    return slot;
  }

  slot.textContent = "◎";
  slot.style.fontSize = "15px";
  return slot;
}

function findAccountMenuIcon(panel, accountState) {
  const menu =
    panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') ||
    document;
  const current = accountState.current
    ? accountDisplayName(accountState, accountState.current, { includeCurrent: false })
    : "";
  const candidates = Array.from(menu.querySelectorAll('button, a, [role="menuitem"], div'));
  const accountRow = candidates.find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    const text = element.textContent || "";
    return (current && text.includes(current)) || /@/.test(text);
  });
  if (!(accountRow instanceof HTMLElement)) return null;
  return accountRow.querySelector("svg");
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
  const menu =
    panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') ||
    document;
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
      '[title*="usage" i]',
    ].join(","),
  );
  if (
    selectorMatch instanceof HTMLElement &&
    isVisible(selectorMatch) &&
    !selectorMatch.closest("[data-codexpp-account-switcher]")
  ) {
    const item = selectorMatch.closest(
      'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]',
    );
    if (isUsageRemainingItem(item)) return item;
    if (isUsageRemainingItem(selectorMatch)) return selectorMatch;
  }

  return Array.from(
    root.querySelectorAll(
      'button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]',
    ),
  ).find((element) => isUsageRemainingItem(element));
}

function isUsageRemainingItem(element) {
  if (!isMenuItemLike(element) || !isVisible(element)) return false;
  if (element.closest("[data-codexpp-account-switcher]")) return false;
  const label = [
    compactText(element),
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
  ].join(" ");
  return (
    /\busage remaining\b/i.test(label) ||
    /\brate limits remaining\b/i.test(label)
  );
}

function isMenuItemLike(element) {
  return (
    element instanceof HTMLElement &&
    element.matches('button, a, [role="button"], [role="menuitem"], [data-radix-collection-item]')
  );
}

// ─── Per-account row ──────────────────────────────────────────────────────────

function accountRow(state, panel, accountState, name) {
  const row = document.createElement("button");
  row.type = "button";
  row.title = accountDisplayName(accountState, name, { includeCurrent: false });
  const normalBackground =
    accountState.current === name
      ? "var(--color-token-list-hover-background, var(--color-token-bg-tertiary, color-mix(in srgb,currentColor 8%,transparent)))"
      : "transparent";
  row.style.cssText =
    "width:100%;border:0;text-align:left;font:inherit;display:flex;flex-direction:column;gap:2px;" +
    `border-radius:8px;margin-left:-8px;margin-right:-8px;padding:4px 8px;background:${normalBackground};` +
    "color:var(--color-token-text-primary,currentColor);cursor:pointer;";
  const nameText = document.createElement("span");
  nameText.textContent = accountDisplayName(accountState, name);
  nameText.style.cssText =
    "display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;";
  row.appendChild(nameText);
  const usage = accountUsageSummary(accountState, name);
  if (usage) {
    const usageText = document.createElement("span");
    usageText.textContent = usage;
    usageText.style.cssText =
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
      "color:var(--color-token-text-secondary,currentColor);font-size:11px;";
    row.appendChild(usageText);
  }
  addButtonFeedback(row, {
    normal: { background: normalBackground },
    hover: {
      background: accountState.current === name
        ? "var(--color-token-list-hover-background, var(--color-token-bg-tertiary, color-mix(in srgb,currentColor 10%,transparent)))"
        : "var(--color-token-list-hover-background, color-mix(in srgb,currentColor 8%,transparent))",
    },
    active: {
      background: accountState.current === name
        ? "var(--color-token-list-active-selection-background, var(--color-token-list-hover-background, color-mix(in srgb,currentColor 12%,transparent)))"
        : "var(--color-token-list-hover-background, color-mix(in srgb,currentColor 12%,transparent))",
      transform: "scale(0.99)",
    },
  });
  protectInteractiveControl(row);
  bindButtonAction(row, () => {
    if (accountState.current === name) return;
    void runPanelAction(state, panel, "switch", { name }, t("accounts.switching"));
  });
  return row;
}

function configureAccountsRow(state, panel) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = t("accounts.configure");
  button.style.cssText =
    "width:100%;border:0;background:transparent;color:var(--color-token-text-secondary,currentColor);" +
    "font:inherit;font-size:13px;text-align:left;border-radius:8px;margin-left:-8px;margin-right:-8px;" +
    "padding:5px 8px;cursor:pointer;";
  addButtonFeedback(button, {
    normal: { background: "transparent" },
    hover: { background: "color-mix(in srgb,currentColor 8%,transparent)" },
    active: {
      background: "color-mix(in srgb,currentColor 12%,transparent)",
      transform: "scale(0.99)",
    },
  });
  protectInteractiveControl(button);
  bindButtonAction(button, () => openAccountsSettings(state, panel));
  return button;
}

function openAccountsSettings(state, panel) {
  const menu =
    panel.closest('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper]') ||
    document;
  const settingsItem = findMenuCommand(menu, /settings/i);
  settingsItem?.click();
  window.setTimeout(() => {
    const accountsNav = Array.from(
      document.querySelectorAll('button[data-codexpp^="nav-page-"], button'),
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

// ─── User-initiated actions ───────────────────────────────────────────────────

function clearActiveForNewLogin(state, panel) {
  runPanelAction(state, panel, "clear-active", {}, t("accounts.preparingSignIn"));
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
      ...(state.lastState || { accounts: [], current: null, hasActiveAuth: false }),
      error: errorMessage(error),
    });
  }
}

function authReloadMessage(action, accountState) {
  if (action === "clear-active") {
    return t("accounts.sessionClearedRelaunching");
  }
  const email = accountState.current
    ? accountDisplayName(accountState, accountState.current, { includeCurrent: false })
    : t("accounts.selected");
  return t("accounts.switchedRelaunching", { email });
}

function scheduleAppRelaunch(state, panel) {
  window.setTimeout(() => {
    invoke(state, "relaunch").catch((error) => {
      setPanelStatus(panel, t("accounts.relaunchFailed", { error: errorMessage(error) }));
    });
  }, 1200);
}

async function refreshPanel(state, panel) {
  setPanelStatus(panel, t("accounts.loading"));
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
  if (state.usageRefreshInFlight || now - (state.lastUsageRefreshAt || 0) < 60_000) return;
  state.usageRefreshInFlight = true;
  state.lastUsageRefreshAt = now;
  invoke(state, "refresh-usage")
    .then((accountState) => {
      if (panel.isConnected) renderAccountPanel(state, panel, accountState);
      if (state.settingsRoot?.isConnected) {
        renderAccountsPageState(state, state.settingsRoot, accountState);
      }
    })
    .catch((error) => {
      state.api.log.warn("[account-switcher] usage refresh failed", errorMessage(error));
    })
    .finally(() => {
      state.usageRefreshInFlight = false;
  });
}

module.exports = { renderAccountPanel, accountPanelShell, refreshPanel };
