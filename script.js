import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const storageKey = "ct-control-center";
const legacyStorageKey = "ct-vip-kooperationen";
const localCacheKey = "ct-control-cache";
const businessTypes = ["VIP", "Kooperation", "Bestellung", "Reservierung"];

const vipPackages = {
  Silber: {
    food: 10,
    drinks: 10,
    cookies: 2,
    discount: 5,
  },
  Gold: {
    food: 15,
    drinks: 15,
    cookies: 5,
    discount: 10,
  },
};

const form = document.querySelector("#entryForm");
const fields = {
  id: document.querySelector("#entryId"),
  type: document.querySelector("#typeInput"),
  name: document.querySelector("#nameInput"),
  packageName: document.querySelector("#packageInput"),
  months: document.querySelector("#monthsInput"),
  codeWord: document.querySelector("#codeWordInput"),
  advantages: document.querySelector("#advantagesInput"),
  reminder: document.querySelector("#reminderInput"),
  orderItems: document.querySelector("#orderItemsInput"),
  orderTime: document.querySelector("#orderTimeInput"),
  orderPrice: document.querySelector("#orderPriceInput"),
  reservationTime: document.querySelector("#reservationTimeInput"),
  guestCount: document.querySelector("#guestCountInput"),
  table: document.querySelector("#tableInput"),
  occasion: document.querySelector("#occasionInput"),
  status: document.querySelector("#statusInput"),
  start: document.querySelector("#startInput"),
  end: document.querySelector("#endInput"),
  contact: document.querySelector("#contactInput"),
  notes: document.querySelector("#notesInput"),
};

const typePanels = {
  VIP: document.querySelector("#vipFields"),
  Kooperation: document.querySelector("#coopFields"),
  Bestellung: document.querySelector("#orderFields"),
  Reservierung: document.querySelector("#reservationFields"),
};

const packageInfo = document.querySelector("#packageInfo");
const recordsBody = document.querySelector("#recordsBody");
const rowTemplate = document.querySelector("#rowTemplate");
const searchInput = document.querySelector("#searchInput");
const filterInput = document.querySelector("#filterInput");
const resetButton = document.querySelector("#resetButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const cursorGlow = document.querySelector(".cursor-glow");
const tabButtons = document.querySelectorAll("[data-tab]");
const syncStatus = document.querySelector("#syncStatus");
const loginGate = document.querySelector("#loginGate");
const loginForm = document.querySelector("#loginForm");
const passwordInput = document.querySelector("#passwordInput");
const loginError = document.querySelector("#loginError");

let records = [];
let activeTab = "Heute";
const accessPassword = "ChinaSantiNRW";
const accessKey = "ct-control-access";
let supabaseClient = null;
let syncMode = "local";
let recordsLoaded = false;

function hasAccess() {
  return sessionStorage.getItem(accessKey) === "ok";
}

function unlockApp() {
  sessionStorage.setItem(accessKey, "ok");
  loginGate.hidden = true;
  document.body.classList.remove("is-locked");
}

function lockApp() {
  loginGate.hidden = false;
  document.body.classList.add("is-locked");
  passwordInput.focus();
}

function loadCachedRecords() {
  try {
    const current = localStorage.getItem(localCacheKey);
    const legacy = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
    return JSON.parse(current || legacy || "[]");
  } catch {
    return [];
  }
}

function saveCachedRecords() {
  localStorage.setItem(localCacheKey, JSON.stringify(records));
}

async function loadSupabaseConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Missing Supabase config");
  }

  const config = await response.json();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Incomplete Supabase config");
  }

  return config;
}

async function initDataLayer() {
  try {
    const config = await loadSupabaseConfig();
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    syncMode = "supabase";
    setSyncStatus("Sync: Live");
  } catch {
    supabaseClient = null;
    syncMode = "local";
    setSyncStatus("Sync: Local");
  }
}

function setSyncStatus(text) {
  if (syncStatus) {
    syncStatus.textContent = text;
  }
}

async function loadRecords() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("control_records")
        .select("id,data,updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      records = (data || []).map((row) => normalizeRecord({ ...(row.data || {}), id: row.id }));

      if (records.length === 0) {
        const fallbackRecords = loadCachedRecords().map(normalizeRecord);
        if (fallbackRecords.length > 0) {
          records = fallbackRecords;
          for (const record of records) {
            await persistRecord(record);
          }
        }
      }

      saveCachedRecords();
      return;
    } catch {
      setSyncStatus("Sync: Local");
      syncMode = "local";
      supabaseClient = null;
    }
  }

  records = loadCachedRecords().map(normalizeRecord);
}

async function persistRecord(record) {
  saveCachedRecords();

  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.from("control_records").upsert(
    [
      {
        id: record.id,
        data: record,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function deleteRemoteRecord(id) {
  saveCachedRecords();

  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.from("control_records").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

function todayIso() {
  const date = new Date();
  return toIsoDate(date);
}

function nowDateTimeLocal(minutesOffset = 0) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesOffset);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toIsoDate(date)}T${hours}:${minutes}`;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(startDate, days) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function addMonthIso(startDate) {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return toIsoDate(date);
}

function vipEndIso(startDate, months) {
  return addDaysIso(startDate, Math.max(1, Number(months) || 1) * 31);
}

function dateDiff(dateValue) {
  if (!dateValue) return 9999;
  const today = new Date(todayIso());
  const date = new Date(dateValue.slice(0, 10));
  return Math.ceil((date - today) / 86400000);
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeRecord(record) {
  const type = businessTypes.includes(record.type) ? record.type : "VIP";
  const start = record.start || todayIso();
  const months = Math.min(12, Math.max(1, Number(record.months) || 1));
  const end = record.end || defaultEndForType(type, start, months);

  return {
    id: record.id || createId(),
    type,
    name: record.name || "",
    packageName: record.packageName || "Silber",
    months,
    pickupDates: normalizePickupDates(record),
    codeWord: record.codeWord || "",
    advantages: record.advantages || record.benefit || "",
    reminder: record.reminder || (type === "Kooperation" ? addMonthIso(start) : ""),
    orderItems: record.orderItems || "",
    orderTime: record.orderTime || "",
    orderPrice: record.orderPrice || "",
    reservationTime: record.reservationTime || "",
    guestCount: Math.max(1, Number(record.guestCount) || 2),
    table: record.table || "",
    occasion: record.occasion || "",
    status: record.status || defaultStatus(type),
    start,
    end,
    contact: record.contact || "",
    notes: record.notes || "",
  };
}

function defaultEndForType(type, start, months) {
  if (type === "VIP") return vipEndIso(start, months);
  if (type === "Kooperation") return addMonthIso(start);
  return start;
}

function defaultStatus(type) {
  if (type === "VIP" || type === "Kooperation") return "Aktiv";
  return "Offen";
}

function normalizePickupDates(record) {
  if (record.type && record.type !== "VIP") return [];

  if (Array.isArray(record.pickupDates)) {
    return [0, 1, 2, 3].map((index) => record.pickupDates[index] || "");
  }

  if (Array.isArray(record.pickupWeeks)) {
    return [0, 1, 2, 3].map((index) => (record.pickupWeeks[index] ? todayIso() : ""));
  }

  return ["", "", "", ""];
}

function computedStatus(record) {
  if ((record.type === "VIP" || record.type === "Kooperation") && dateDiff(record.end) < 0) {
    return "Abgelaufen";
  }

  return record.status;
}

function needsReminder(record) {
  return record.type === "Kooperation" && record.reminder && dateDiff(record.reminder) <= 0;
}

function isOpenWork(record) {
  return ["Offen", "In Arbeit", "Bestaetigt", "Aktiv"].includes(computedStatus(record));
}

function isDoneStatus(status) {
  return ["Erledigt", "Fertig", "Abgeholt", "Erschienen", "No Show", "Storniert", "Abgelaufen"].includes(status);
}

function isArchived(record) {
  return isDoneStatus(computedStatus(record));
}

function isTodayRecord(record) {
  const today = todayIso();
  return (
    (record.type === "Bestellung" && record.orderTime?.slice(0, 10) === today && !isArchived(record)) ||
    (record.type === "Reservierung" && record.reservationTime?.slice(0, 10) === today && !isArchived(record))
  );
}

function isOrderOverdue(record) {
  if (record.type !== "Bestellung" || !record.orderTime) return false;
  if (["Fertig", "Abgeholt", "Erledigt", "Storniert"].includes(computedStatus(record))) return false;
  return new Date(record.orderTime) < new Date();
}

function warningText(record) {
  if (record.type === "VIP") {
    const days = dateDiff(record.end);
    if (days >= 0 && days <= 3) return `VIP laeuft in ${days} Tag${days === 1 ? "" : "en"} ab`;
  }

  if (needsReminder(record)) return "Kooperation Reminder faellig";
  if (isOrderOverdue(record)) return "Bestellung ueberfaellig";
  return "";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function getVipBenefit(packageName) {
  const data = vipPackages[packageName] || vipPackages.Silber;
  return `${data.food}x Essen, ${data.drinks}x Trinken, ${data.cookies}x Glueckskekse, ${data.discount}% Rabatt pro Woche`;
}

function renderPackageInfo() {
  const months = Math.max(1, Number(fields.months.value) || 1);
  packageInfo.textContent = `${getVipBenefit(fields.packageName.value)}. Laufzeit: ${months} Monat${months === 1 ? "" : "e"}. Abholung: 4 Sterne je Monat, mit Datum beim Absegnen.`;
}

function syncTypeFields() {
  const type = fields.type.value;

  Object.entries(typePanels).forEach(([panelType, panel]) => {
    panel.hidden = panelType !== type;
  });

  if (!fields.id.value) {
    fields.status.value = defaultStatus(type);
  }

  if (type === "VIP") {
    fields.end.value = vipEndIso(fields.start.value, fields.months.value);
    fields.reminder.value = "";
  }

  if (type === "Kooperation") {
    if (!fields.reminder.value) fields.reminder.value = addMonthIso(fields.start.value);
    if (!fields.id.value) fields.end.value = addMonthIso(fields.start.value);
  }

  if (type === "Bestellung") {
    fields.end.value = fields.start.value;
    if (!fields.orderTime.value) fields.orderTime.value = nowDateTimeLocal(30);
  }

  if (type === "Reservierung") {
    fields.end.value = fields.start.value;
    if (!fields.reservationTime.value) fields.reservationTime.value = nowDateTimeLocal(60);
  }

  renderPackageInfo();
}

function searchableText(record) {
  return [
    record.name,
    record.type,
    record.packageName,
    record.codeWord,
    record.advantages,
    record.orderItems,
    record.orderPrice,
    record.table,
    record.occasion,
    computedStatus(record),
    record.contact,
    record.notes,
  ]
    .join(" ")
    .toLowerCase();
}

function filteredRecords() {
  const search = searchInput.value.trim().toLowerCase();
  const filter = filterInput.value;

  return records
    .filter((record) => {
      const status = computedStatus(record);
      const days = dateDiff(record.end);
      const matchesTab =
        activeTab === "Heute"
          ? isTodayRecord(record)
          : activeTab === "Archiv"
            ? isArchived(record)
            : record.type === activeTab && !isArchived(record);
      const matchesFilter =
        filter === "Alle" ||
        record.type === filter ||
        status === filter ||
        (filter === "Bald" && days >= 0 && days <= 7) ||
        (filter === "Reminder" && needsReminder(record));

      return matchesTab && matchesFilter && searchableText(record).includes(search);
    })
    .sort((a, b) => new Date(displaySortDate(a)) - new Date(displaySortDate(b)));
}

function displaySortDate(record) {
  if (record.type === "Bestellung") return record.orderTime || record.start;
  if (record.type === "Reservierung") return record.reservationTime || record.start;
  return record.end || record.start;
}

function renderStats() {
  document.querySelector("#activeVipCount").textContent = records.filter(
    (record) => record.type === "VIP" && computedStatus(record) === "Aktiv",
  ).length;
  document.querySelector("#activePartnerCount").textContent = records.filter(
    (record) => record.type === "Kooperation" && computedStatus(record) === "Aktiv",
  ).length;
  document.querySelector("#orderCount").textContent = records.filter(
    (record) => record.type === "Bestellung" && isOpenWork(record),
  ).length;
  document.querySelector("#reservationCount").textContent = records.filter(
    (record) => record.type === "Reservierung" && isOpenWork(record),
  ).length;
}

function renderPickupButtons(container, record) {
  if (record.type === "Bestellung") {
    renderQuickStatus(container, record, ["Offen", "In Arbeit", "Fertig", "Abgeholt"]);
    return;
  }

  if (record.type === "Reservierung") {
    renderQuickStatus(container, record, ["Bestaetigt", "Erschienen", "No Show"]);
    return;
  }

  if (record.type !== "VIP") {
    const warning = warningText(record);
    container.innerHTML = warning ? `<span class="warning-badge">${warning}</span>` : "-";
    return;
  }

  const shell = document.createElement("div");
  shell.className = "vip-action-shell";
  const group = document.createElement("div");
  group.className = "pickup-group";

  record.pickupDates.forEach((pickupDate, index) => {
    const checked = Boolean(pickupDate);
    const item = document.createElement("div");
    item.className = "pickup-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = checked ? "pickup-button checked" : "pickup-button";
    button.textContent = "\u2605";
    button.title = checked
      ? `Woche ${index + 1} abgeholt am ${formatDate(pickupDate)}`
      : `Woche ${index + 1} offen`;
    button.setAttribute("aria-label", button.title);
    button.addEventListener("click", () => {
      const nextDates = record.pickupDates.slice();
      nextDates[index] = nextDates[index] ? "" : todayIso();
      void updateRecord(record.id, { pickupDates: nextDates });
    });

    const dateLabel = document.createElement("span");
    dateLabel.className = "pickup-date";
    dateLabel.textContent = formatShortDate(pickupDate) || "offen";

    item.append(button, dateLabel);
    group.append(item);
  });

  const tools = document.createElement("div");
  tools.className = "mini-actions";
  [
    ["+1M", () => extendVip(record, 1)],
    ["+3M", () => extendVip(record, 3)],
    ["Neuer Monat", () => resetVipMonth(record)],
  ].forEach(([label, handler]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = "mini-action-button";
    button.addEventListener("click", handler);
    tools.append(button);
  });

  const warning = warningText(record);
  if (warning) {
    const badge = document.createElement("span");
    badge.className = "warning-badge";
    badge.textContent = warning;
    tools.append(badge);
  }

  shell.append(group, tools);
  container.append(shell);
}

function renderQuickStatus(container, record, statuses) {
  const group = document.createElement("div");
  group.className = "quick-status-group";

  statuses.forEach((status) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = status === computedStatus(record) ? "quick-status active" : "quick-status";
    button.textContent = status;
    button.addEventListener("click", () => updateRecord(record.id, { status }));
    group.append(button);
  });

  const warning = warningText(record);
  if (warning) {
    const badge = document.createElement("span");
    badge.className = "warning-badge";
    badge.textContent = warning;
    group.append(badge);
  }

  container.append(group);
}

async function updateRecord(id, patch) {
  const current = records.find((record) => record.id === id) || {};
  const nextRecord = normalizeRecord({ ...current, ...patch, id });

  records = records.map((record) => (record.id === id ? nextRecord : record));

  try {
    await persistRecord(nextRecord);
  } catch {
    setSyncStatus("Sync: Error");
  }

  render();
}

function extendVip(record, months) {
  const nextMonths = Math.min(12, record.months + months);
  void updateRecord(record.id, {
    months: nextMonths,
    end: vipEndIso(record.start, nextMonths),
  });
}

function resetVipMonth(record) {
  void updateRecord(record.id, {
    pickupDates: ["", "", "", ""],
    start: todayIso(),
    end: vipEndIso(todayIso(), record.months),
  });
}

function getTypeLabel(record) {
  if (record.type === "VIP") return `${record.packageName}, ${record.months}M`;
  if (record.type === "Kooperation") return `Code: ${record.codeWord || "-"}`;
  if (record.type === "Bestellung") return "Bestellung";
  return `${record.guestCount} Personen`;
}

function getDateLabel(record) {
  if (record.type === "Kooperation") {
    return `Ablauf: ${formatDate(record.end)}<br>Reminder: ${formatDate(record.reminder)}`;
  }
  if (record.type === "Bestellung") return `Zeit: ${formatDateTime(record.orderTime)}`;
  if (record.type === "Reservierung") return `Reserviert: ${formatDateTime(record.reservationTime)}`;
  return `Ablauf: ${formatDate(record.end)}`;
}

function getDetailLabel(record) {
  if (record.type === "VIP") {
    return `${getVipBenefit(record.packageName)} (${record.months} Monat${record.months === 1 ? "" : "e"})`;
  }
  if (record.type === "Kooperation") return record.advantages || "-";
  if (record.type === "Bestellung") {
    return [record.orderItems, record.orderPrice ? `Betrag: ${record.orderPrice}` : ""].filter(Boolean).join(" | ") || "-";
  }
  return [record.table, record.occasion].filter(Boolean).join(" | ") || "-";
}

function renderRows() {
  const rows = filteredRecords();
  recordsBody.replaceChildren();
  document.body.classList.toggle("is-empty", rows.length === 0);

  rows.forEach((record) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const status = computedStatus(record);
    const days = dateDiff(record.end);

    row.querySelector(".name-button").textContent = record.name;
    row.querySelector("small").textContent = record.contact || "Kein Kontakt";
    row.querySelector(".tag").textContent = getTypeLabel(record);

    const statusPill = row.querySelector(".status-pill");
    statusPill.textContent = needsReminder(record)
      ? "Reminder"
      : days >= 0 && days <= 7 && status === "Aktiv"
        ? "Bald"
        : status;
    statusPill.classList.toggle("paused", ["Pausiert", "Offen", "Bestaetigt"].includes(status) || needsReminder(record));
    statusPill.classList.toggle("expired", ["Abgelaufen", "Storniert"].includes(status));

    row.querySelector(".date-cell").innerHTML = getDateLabel(record);
    row.querySelector(".benefit-cell").textContent = getDetailLabel(record);
    const warning = warningText(record);
    if (warning && record.type !== "VIP") {
      const badge = document.createElement("span");
      badge.className = "warning-badge inline";
      badge.textContent = warning;
      row.querySelector(".benefit-cell").append(" ", badge);
    }
    renderPickupButtons(row.querySelector(".pickup-cell"), record);

    row.querySelector(".name-button").addEventListener("click", () => fillForm(record));
    row.querySelector(".edit-button").addEventListener("click", () => fillForm(record));
    row.querySelector(".delete-button").addEventListener("click", () => deleteRecord(record.id));

    recordsBody.append(row);
  });
}

function render() {
  renderStats();
  renderRows();
}

function fillForm(record) {
  fields.id.value = record.id;
  fields.type.value = record.type;
  fields.name.value = record.name;
  fields.packageName.value = record.packageName;
  fields.months.value = record.months;
  fields.codeWord.value = record.codeWord;
  fields.advantages.value = record.advantages;
  fields.reminder.value = record.reminder;
  fields.orderItems.value = record.orderItems;
  fields.orderTime.value = record.orderTime;
  fields.orderPrice.value = record.orderPrice;
  fields.reservationTime.value = record.reservationTime;
  fields.guestCount.value = record.guestCount;
  fields.table.value = record.table;
  fields.occasion.value = record.occasion;
  fields.status.value = record.status;
  fields.start.value = record.start;
  fields.end.value = record.end;
  fields.contact.value = record.contact;
  fields.notes.value = record.notes;
  syncTypeFields();
  fields.name.focus();
}

function resetForm(type = "VIP") {
  form.reset();
  fields.id.value = "";
  fields.type.value = type;
  fields.packageName.value = "Silber";
  fields.months.value = 1;
  fields.guestCount.value = 2;
  fields.start.value = todayIso();
  fields.end.value = defaultEndForType(type, fields.start.value, fields.months.value);
  fields.reminder.value = type === "Kooperation" ? addMonthIso(fields.start.value) : "";
  fields.orderTime.value = type === "Bestellung" ? nowDateTimeLocal(30) : "";
  fields.reservationTime.value = type === "Reservierung" ? nowDateTimeLocal(60) : "";
  fields.status.value = defaultStatus(type);
  syncTypeFields();
}

async function deleteRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record || !confirm(`${record.name} loeschen?`)) return;

  records = records.filter((item) => item.id !== id);
  try {
    await deleteRemoteRecord(id);
  } catch {
    setSyncStatus("Sync: Error");
  }

  render();
  if (fields.id.value === id) resetForm();
}

function collectFormRecord() {
  const existing = records.find((record) => record.id === fields.id.value);
  const type = fields.type.value;
  const start = fields.start.value;
  const months = Math.min(12, Math.max(1, Number(fields.months.value) || 1));

  return normalizeRecord({
    id: fields.id.value || createId(),
    type,
    name: fields.name.value.trim(),
    packageName: fields.packageName.value,
    months,
    pickupDates: existing?.pickupDates || normalizePickupDates(existing || {}),
    codeWord: fields.codeWord.value.trim(),
    advantages: fields.advantages.value.trim(),
    reminder: type === "Kooperation" ? fields.reminder.value || addMonthIso(start) : "",
    orderItems: fields.orderItems.value.trim(),
    orderTime: fields.orderTime.value,
    orderPrice: fields.orderPrice.value.trim(),
    reservationTime: fields.reservationTime.value,
    guestCount: fields.guestCount.value,
    table: fields.table.value.trim(),
    occasion: fields.occasion.value.trim(),
    status: fields.status.value,
    start,
    end: type === "VIP" ? vipEndIso(start, months) : fields.end.value,
    contact: fields.contact.value.trim(),
    notes: fields.notes.value.trim(),
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nextRecord = collectFormRecord();
  records = records.some((record) => record.id === nextRecord.id)
    ? records.map((record) => (record.id === nextRecord.id ? nextRecord : record))
    : [...records, nextRecord];

  try {
    await persistRecord(nextRecord);
  } catch {
    setSyncStatus("Sync: Error");
  }

  resetForm(nextRecord.type);
  render();
});

fields.type.addEventListener("change", syncTypeFields);
fields.packageName.addEventListener("change", renderPackageInfo);
fields.months.addEventListener("input", () => {
  fields.end.value = vipEndIso(fields.start.value, fields.months.value);
  renderPackageInfo();
});
fields.start.addEventListener("change", syncTypeFields);
resetButton.addEventListener("click", () => resetForm(fields.type.value));
searchInput.addEventListener("input", renderRows);
filterInput.addEventListener("change", renderRows);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    tabButtons.forEach((item) => item.classList.toggle("active", item === button));
    filterInput.value = "Alle";
    renderRows();
  });
});

document.querySelectorAll("[data-type-jump]").forEach((link) => {
  link.addEventListener("click", () => {
    resetForm(link.dataset.typeJump);
  });
});

document.addEventListener("pointermove", (event) => {
  document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
  document.documentElement.style.setProperty("--my", `${event.clientY}px`);

  if (cursorGlow) {
    cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (passwordInput.value === accessPassword) {
    loginError.textContent = "";
    passwordInput.value = "";
    unlockApp();
    return;
  }

  loginError.textContent = "Falsches Passwort.";
  passwordInput.select();
});

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `china-town-control-${todayIso()}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async () => {
  const [file] = importInput.files;
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("Invalid data");

    records = imported.filter((record) => record.id && record.name && record.type).map(normalizeRecord);
    saveCachedRecords();
    if (supabaseClient) {
      const { data: existingRows } = await supabaseClient.from("control_records").select("id");
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        await supabaseClient.from("control_records").delete().in(
          "id",
          existingRows.map((row) => row.id),
        );
      }

      for (const record of records) {
        await persistRecord(record);
      }
    }
    resetForm();
    render();
  } catch {
    alert("Die Datei konnte nicht importiert werden.");
  } finally {
    importInput.value = "";
  }
});

async function boot() {
  await initDataLayer();
  await loadRecords();

  if (hasAccess()) {
    unlockApp();
  } else {
    lockApp();
  }

  resetForm();
  render();

  if (supabaseClient) {
    setInterval(() => {
      void loadRecords().then(() => render()).catch(() => {});
    }, 20000);
  }
}

void boot();
