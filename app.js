
const OVERRIDES_KEY = "minhaEscalaOverridesV1";
const SETTINGS_KEY = "minhaEscalaSettingsV1";
const NOTIFICATION_KEY = "minhaEscalaNotificationSettingsV1";
const TOKEN_KEY = "minhaEscalaApiTokenV1";

const API_URL = "https://minha-escala-notificacoes.brunobrant-araujo.workers.dev";

const DEFAULT_SETTINGS = {
  baseDate: "2026-10-15",
  workDays: 14,
  offDays: 14
};

const DEFAULT_NOTIFICATIONS = {
  embarkEnabled: true,
  embarkDays: 1,
  embarkTime: "19:00",
  offEnabled: true,
  offDays: 0,
  offTime: "07:00"
};

const $ = id => document.getElementById(id);

let year = new Date().getFullYear();
let selectedDate = null;

let overrides = loadOverrides();
let settings = loadSettings();
let notificationSettings = loadNotificationSettings();

function key(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayNumber(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

function validDateString(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = fromKey(s);
  return key(d) === s;
}

function validSettings(s) {
  return !!s &&
    validDateString(s.baseDate) &&
    Number.isInteger(s.workDays) &&
    s.workDays >= 1 &&
    s.workDays <= 365 &&
    Number.isInteger(s.offDays) &&
    s.offDays >= 1 &&
    s.offDays <= 365;
}

function loadOverrides() {
  try {
    const v = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function loadSettings() {
  try {
    const v = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    return validSettings(v) ? v : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function validNotificationSettings(s) {
  return !!s &&
    typeof s.embarkEnabled === "boolean" &&
    Number.isInteger(s.embarkDays) &&
    s.embarkDays >= 0 &&
    s.embarkDays <= 365 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(s.embarkTime) &&
    typeof s.offEnabled === "boolean" &&
    Number.isInteger(s.offDays) &&
    s.offDays >= 0 &&
    s.offDays <= 365 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(s.offTime);
}

function loadNotificationSettings() {
  try {
    const v = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "null");
    return validNotificationSettings(v)
      ? v
      : { ...DEFAULT_NOTIFICATIONS };
  } catch {
    return { ...DEFAULT_NOTIFICATIONS };
  }
}

function saveOverrides() {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

function saveSettingsStorage() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function saveNotificationStorage() {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationSettings));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function base(d) {
  const anchor = fromKey(settings.baseDate);
  const cycle = settings.workDays + settings.offDays;
  const offset = ((dayNumber(d) - dayNumber(anchor)) % cycle + cycle) % cycle;
  return offset < settings.workDays ? "service" : "off";
}

function type(d) {
  return overrides[key(d)]?.type || base(d);
}

function label(t) {
  return t === "service" ? "Serviço" :
    t === "off" ? "Folga" : "Outro compromisso";
}

function updateSettingsDisplay() {
  const date = fromKey(settings.baseDate).toLocaleDateString("pt-BR");
  const subtitle = `Ciclo ${settings.workDays} dias de serviço · ${settings.offDays} dias de folga`;

  $("cycleSubtitle").textContent = subtitle;
  $("footerSummary").textContent =
    `Data-base: ${date} · Primeiro dia de serviço · Ciclo ${settings.workDays}x${settings.offDays}`;

  $("scaleSummary").textContent =
    `Configuração ativa: ${date} como primeiro dia de serviço, ${settings.workDays} dia(s) de serviço e ${settings.offDays} dia(s) de folga.`;
}

function fillSettingsForm() {
  $("baseDate").value = settings.baseDate;
  $("workDays").value = settings.workDays;
  $("offDays").value = settings.offDays;
  updateSettingsDisplay();
}

function fillNotificationForm() {
  $("embarkEnabled").checked = notificationSettings.embarkEnabled;
  $("embarkDays").value = notificationSettings.embarkDays;
  $("embarkTime").value = notificationSettings.embarkTime;

  $("offEnabled").checked = notificationSettings.offEnabled;
  $("offNotificationDays").value = notificationSettings.offDays;
  $("offTime").value = notificationSettings.offTime;
}

function render() {
  $("yearLabel").textContent = year;

  const root = $("calendar");
  root.innerHTML = "";

  const names = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const week = ["D", "S", "T", "Q", "Q", "S", "S"];

  for (let m = 0; m < 12; m++) {
    const card = document.createElement("article");
    card.className = "month";

    const h = document.createElement("h3");
    h.textContent = names[m];
    card.append(h);

    const w = document.createElement("div");
    w.className = "week";

    week.forEach(x => {
      const s = document.createElement("span");
      s.textContent = x;
      w.append(s);
    });

    card.append(w);

    const days = document.createElement("div");
    days.className = "days";

    const first = new Date(year, m, 1).getDay();
    const count = new Date(year, m + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
      const b = document.createElement("span");
      b.className = "day empty";
      days.append(b);
    }

    for (let n = 1; n <= count; n++) {
      const d = new Date(year, m, n);
      const k = key(d);
      const o = overrides[k];
      const t = type(d);

      const b = document.createElement("button");
      b.type = "button";
      b.className = `day ${o ? "custom" : t}`;
      b.textContent = n;
      b.setAttribute("aria-label", `${n}/${m + 1}/${year}: ${label(t)}`);

      if (k === key(new Date())) b.classList.add("today");
      if (k === selectedDate) b.classList.add("selected");
      if (o?.note) b.classList.add("has-note");

      b.addEventListener("click", () => select(k));
      days.append(b);
    }

    card.append(days);
    root.append(card);
  }
}

function select(k) {
  selectedDate = k;

  const d = fromKey(k);
  const o = overrides[k];
  const t = o?.type || base(d);

  $("selectedTitle").textContent = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  $("selectedInfo").textContent = o
    ? `Alteração manual: ${label(t)}${o.note ? " · " + o.note : ""}. Ciclo original: ${label(base(d))}.`
    : `Ciclo original: ${label(t)}.`;

  $("editArea").hidden = false;
  $("dayType").value = t;
  $("note").value = o?.note || "";

  render();
}

async function apiRequest(path, method = "GET", body = null) {
  const token = getToken();

  if (!token) {
    throw new Error("Token de acesso não cadastrado neste aparelho.");
  }

  const headers = {
    "Authorization": `Bearer ${token}`
  };

  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const options = {
    method,
    headers
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, options);

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }

  return data;
}

async function syncSchedule() {
  if (!getToken()) return;

  try {
    await apiRequest("/sync", "POST", {
      settings,
      overrides
    });
  } catch (error) {
    console.warn("Sincronização da escala pendente:", error.message);
  }
}

function notificationPayload() {
  return {
    enabled: true,
    embark_enabled: notificationSettings.embarkEnabled,
    embark_days_before: notificationSettings.embarkDays,
    embark_time: notificationSettings.embarkTime,
    off_enabled: notificationSettings.offEnabled,
    off_days_before: notificationSettings.offDays,
    off_time: notificationSettings.offTime
  };
}

async function syncNotificationSettings() {
  if (!getToken()) return;

  await apiRequest(
    "/notification-settings",
    "POST",
    notificationPayload()
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este navegador não oferece suporte a notificações Push.");
  }

  if (!("Notification" in window)) {
    throw new Error("As notificações não estão disponíveis neste navegador.");
  }

  if (!getToken()) {
    throw new Error("Salve primeiro o token de acesso neste aparelho.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("A permissão para notificações não foi concedida.");
  }

  const registration = await navigator.serviceWorker.ready;

  const keyResponse = await fetch(`${API_URL}/vapid-public-key`);

  if (!keyResponse.ok) {
    throw new Error("Não foi possível obter a chave pública de notificações.");
  }

  const keyData = await keyResponse.json();

  if (!keyData.publicKey) {
    throw new Error("A chave pública VAPID não foi encontrada.");
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
    });
  }

  await apiRequest("/subscribe", "POST", {
    subscription: subscription.toJSON()
  });

  await syncSchedule();
  await syncNotificationSettings();

  return true;
}

$("saveSettings").onclick = async () => {
  const candidate = {
    baseDate: $("baseDate").value,
    workDays: Number($("workDays").value),
    offDays: Number($("offDays").value)
  };

  if (!validSettings(candidate)) {
    $("settingsStatus").textContent =
      "Confira os campos: informe uma data válida e quantidades inteiras entre 1 e 365 dias.";
    return;
  }

  settings = candidate;
  saveSettingsStorage();
  fillSettingsForm();
  render();

  if (selectedDate) select(selectedDate);

  $("settingsStatus").textContent =
    "Configuração salva. O calendário foi recalculado.";

  await syncSchedule();
};

$("restoreSettings").onclick = async () => {
  settings = { ...DEFAULT_SETTINGS };
  saveSettingsStorage();
  fillSettingsForm();
  render();

  if (selectedDate) select(selectedDate);

  $("settingsStatus").textContent = "Padrão 14x14 restaurado.";

  await syncSchedule();
};

$("saveDay").onclick = async () => {
  if (!selectedDate) return;

  const t = $("dayType").value;
  const n = $("note").value.trim();

  if (t === base(fromKey(selectedDate)) && !n) {
    delete overrides[selectedDate];
  } else {
    overrides[selectedDate] = { type: t, note: n };
  }

  saveOverrides();
  select(selectedDate);
  await syncSchedule();
};

$("resetDay").onclick = async () => {
  if (!selectedDate) return;

  delete overrides[selectedDate];
  saveOverrides();
  select(selectedDate);

  await syncSchedule();
};

$("prevYear").onclick = () => {
  year--;
  render();
};

$("nextYear").onclick = () => {
  year++;
  render();
};

$("saveNotificationSettings").onclick = async () => {
  const candidate = {
    embarkEnabled: $("embarkEnabled").checked,
    embarkDays: Number($("embarkDays").value),
    embarkTime: $("embarkTime").value,
    offEnabled: $("offEnabled").checked,
    offDays: Number($("offNotificationDays").value),
    offTime: $("offTime").value
  };

  if (!validNotificationSettings(candidate)) {
    $("notificationStatus").textContent =
      "Confira os horários e informe uma antecedência entre 0 e 365 dias.";
    return;
  }

  notificationSettings = candidate;
  saveNotificationStorage();

  try {
    await syncNotificationSettings();
    $("notificationStatus").textContent =
      "Preferências salvas neste aparelho e sincronizadas.";
  } catch (error) {
    $("notificationStatus").textContent =
      `Preferências salvas neste aparelho. Sincronização pendente: ${error.message}`;
  }
};

$("saveApiToken").onclick = async () => {
  const token = $("apiToken").value.trim();

  if (!token) {
    $("tokenStatus").textContent = "Cole o token de acesso antes de salvar.";
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  $("apiToken").value = "";

  try {
    await apiRequest("/sync", "POST", {
      settings,
      overrides
    });

    await syncNotificationSettings();

    $("tokenStatus").textContent =
      "Token salvo neste aparelho e conexão com o serviço confirmada.";
  } catch (error) {
    $("tokenStatus").textContent =
      `Token armazenado, mas a conexão não foi confirmada: ${error.message}`;
  }
};

$("enableNotifications").onclick = async () => {
  $("notificationStatus").textContent =
    "Solicitando permissão e cadastrando este aparelho...";

  try {
    await enablePushNotifications();

    $("notificationStatus").textContent =
      "Este aparelho foi inscrito para receber notificações Push. O envio agendado ainda precisa ser ativado no servidor.";
  } catch (error) {
    $("notificationStatus").textContent = error.message;
  }
};

$("exportBackup").onclick = () => {
  const blob = new Blob([
    JSON.stringify({
      app: "Minha Escala",
      version: 2,
      exportedAt: new Date().toISOString(),
      settings,
      overrides
    }, null, 2)
  ], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `minha-escala-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  $("backupStatus").textContent =
    "Backup exportado com configurações e alterações manuais.";
};

$("importBackup").onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;

  try {
    const data = JSON.parse(await f.text());

    if (
      !data ||
      !data.overrides ||
      typeof data.overrides !== "object" ||
      Array.isArray(data.overrides)
    ) {
      throw Error("backup");
    }

    for (const [k, v] of Object.entries(data.overrides)) {
      if (
        !validDateString(k) ||
        !v ||
        !["service", "off", "other"].includes(v.type) ||
        (v.note !== undefined && typeof v.note !== "string")
      ) {
        throw Error("override");
      }
    }

    if (data.settings !== undefined && !validSettings(data.settings)) {
      throw Error("settings");
    }

    if (!confirm(
      "Importar este backup e substituir as configurações e alterações atuais?"
    )) {
      return;
    }

    overrides = data.overrides;

    if (data.settings !== undefined) {
      settings = { ...data.settings };
    }

    saveOverrides();
    saveSettingsStorage();
    fillSettingsForm();
    render();

    if (selectedDate) select(selectedDate);

    $("backupStatus").textContent = "Backup importado com sucesso.";

    await syncSchedule();
  } catch {
    $("backupStatus").textContent =
      "Não foi possível importar: arquivo inválido.";
  }

  e.target.value = "";
};

$("resetAll").onclick = async () => {
  if (!confirm(
    "Apagar todas as alterações manuais? As configurações da escala serão mantidas."
  )) {
    return;
  }

  overrides = {};
  saveOverrides();

  selectedDate = null;
  $("editArea").hidden = true;
  $("selectedTitle").textContent = "Selecione uma data";
  $("selectedInfo").textContent =
    "Todas as alterações manuais foram removidas.";

  render();
  await syncSchedule();
};

fillSettingsForm();
fillNotificationForm();
render();

if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        if (getToken()) {
          syncSchedule();
          syncNotificationSettings().catch(error => {
            console.warn("Sincronização das preferências pendente:", error.message);
          });
        }
      })
      .catch(error => {
        console.error("Falha ao registrar Service Worker:", error);
      });
  });
}

addEventListener("online", () => {
  syncSchedule();

  if (getToken()) {
    syncNotificationSettings().catch(error => {
      console.warn("Sincronização das preferências pendente:", error.message);
    });
  }
});
