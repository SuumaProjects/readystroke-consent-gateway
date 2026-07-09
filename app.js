const CONFIG = {
  demo: {
    analyticsId: "G-Y6GL8XFY1Q",
    destinationUrl: "https://demo.readystroke.com",
    privacyUrl: "https://readystroke.com/privacidad"
  }
};

const TEXTS = {
  es: {
    htmlLang: "es",
    pageTitle: "ReadyStroke | Consentimiento",
    title: "Privacidad y analítica",
    intro:
      "Utilizamos cookies o tecnologías similares para obtener estadísticas de uso de esta app y mejorar la experiencia del jugador.",
    choice:
      "Puedes aceptar o rechazar la analítica. Si rechazas, podrás seguir usando la app normalmente.",
    small:
      "No usamos estos datos para publicidad personalizada ni para identificarte individualmente.",
    accept: "Aceptar analítica",
    reject: "Rechazar",
    moreInfo: "Más información",
    saved: "Preferencia guardada. Accediendo a ReadyStroke...",
    entering: "Accediendo a ReadyStroke..."
  },
  en: {
    htmlLang: "en",
    pageTitle: "ReadyStroke | Consent",
    title: "Privacy and analytics",
    intro:
      "We use cookies or similar technologies to obtain usage statistics for this app and improve the player experience.",
    choice:
      "You can accept or reject analytics. If you reject, you can continue using the app normally.",
    small:
      "We do not use this data for personalized advertising or to identify you individually.",
    accept: "Accept analytics",
    reject: "Reject",
    moreInfo: "More information",
    saved: "Preference saved. Opening ReadyStroke...",
    entering: "Opening ReadyStroke..."
  }
};

const DEFAULT_CLUB = "demo";
const REDIRECT_DELAY_MS = 900;

const params = new URLSearchParams(window.location.search);
const club = params.get("club") || DEFAULT_CLUB;
const config = CONFIG[club] || CONFIG[DEFAULT_CLUB];

const browserLanguage = navigator.language || navigator.userLanguage || "en";
const language = browserLanguage.toLowerCase().startsWith("es") ? "es" : "en";
const t = TEXTS[language];

const consentKey = `readystroke_analytics_consent_${club}`;

const title = document.getElementById("title");
const introText = document.getElementById("introText");
const choiceText = document.getElementById("choiceText");
const smallText = document.getElementById("smallText");
const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");
const privacyLink = document.getElementById("privacyLink");
const statusMessage = document.getElementById("statusMessage");

function applyLanguage() {
  document.documentElement.lang = t.htmlLang;
  document.title = t.pageTitle;

  if (title) title.textContent = t.title;
  if (introText) introText.textContent = t.intro;
  if (choiceText) choiceText.textContent = t.choice;
  if (smallText) smallText.textContent = t.small;
  if (acceptBtn) acceptBtn.textContent = t.accept;
  if (rejectBtn) rejectBtn.textContent = t.reject;
  if (privacyLink) privacyLink.textContent = t.moreInfo;
}

if (privacyLink) {
  privacyLink.href = config.privacyUrl;
}

function getUtmParams() {
  const utm = {};

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
    }
  });

  return utm;
}

function buildDestinationUrl() {
  const destination = new URL(config.destinationUrl);
  const utm = getUtmParams();

  Object.entries(utm).forEach(([key, value]) => {
    destination.searchParams.set(key, value);
  });

  return destination.toString();
}

function loadGoogleAnalytics(callback) {
  if (!config.analyticsId) {
    callback();
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analyticsId}`;

  script.onload = () => {
    window.gtag("js", new Date());

    window.gtag("config", config.analyticsId, {
      send_page_view: false
    });

    callback();
  };

  script.onerror = callback;

  document.head.appendChild(script);
}

function trackEvent(eventName, eventParams = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    club,
    language,
    ...getUtmParams(),
    ...eventParams
  });
}

function redirectToApp() {
  window.location.href = buildDestinationUrl();
}

function setButtonsDisabled(disabled) {
  if (acceptBtn) acceptBtn.disabled = disabled;
  if (rejectBtn) rejectBtn.disabled = disabled;
}

function handleAccept() {
  setButtonsDisabled(true);

  localStorage.setItem(consentKey, "accepted");
  localStorage.setItem(`${consentKey}_date`, new Date().toISOString());
  localStorage.setItem(`${consentKey}_language`, language);

  if (statusMessage) {
    statusMessage.textContent = t.saved;
  }

  loadGoogleAnalytics(() => {
    trackEvent("consent_accepted", {
      consent_status: "accepted"
    });

    trackEvent("app_entry", {
      consent_status: "accepted"
    });

    setTimeout(redirectToApp, REDIRECT_DELAY_MS);
  });
}

function handleReject() {
  setButtonsDisabled(true);

  localStorage.setItem(consentKey, "rejected");
  localStorage.setItem(`${consentKey}_date`, new Date().toISOString());
  localStorage.setItem(`${consentKey}_language`, language);

  if (statusMessage) {
    statusMessage.textContent = t.saved;
  }

  setTimeout(redirectToApp, REDIRECT_DELAY_MS);
}

function init() {
  applyLanguage();

  const existingConsent = localStorage.getItem(consentKey);

  if (existingConsent === "accepted") {
    if (statusMessage) {
      statusMessage.textContent = t.entering;
    }

    loadGoogleAnalytics(() => {
      trackEvent("app_entry", {
        consent_status: "accepted_returning"
      });

      setTimeout(redirectToApp, REDIRECT_DELAY_MS);
    });

    return;
  }

  if (existingConsent === "rejected") {
    if (statusMessage) {
      statusMessage.textContent = t.entering;
    }

    setTimeout(redirectToApp, 300);
    return;
  }

  if (acceptBtn) {
    acceptBtn.addEventListener("click", handleAccept);
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", handleReject);
  }
}

init();
