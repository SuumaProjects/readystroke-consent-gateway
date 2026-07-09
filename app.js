const CONFIG = {
  demo: {
    analyticsId: "G-Y6GL8XFY1Q",
    destinationUrl: "https://ready-stroke-demo.glide.page",
    privacyUrl: "https://readystroke.com/privacy"
  }
};

const DEFAULT_CLUB = "demo";
const REDIRECT_DELAY_MS = 900;

const params = new URLSearchParams(window.location.search);
const club = params.get("club") || DEFAULT_CLUB;
const config = CONFIG[club] || CONFIG[DEFAULT_CLUB];

const consentKey = `readystroke_analytics_consent_${club}`;

const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");
const privacyLink = document.getElementById("privacyLink");
const statusMessage = document.getElementById("statusMessage");

privacyLink.href = config.privacyUrl;

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

  window.gtag("js", new Date());
  window.gtag("config", config.analyticsId, {
    anonymize_ip: true
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analyticsId}`;
  script.onload = callback;
  script.onerror = callback;

  document.head.appendChild(script);
}

function trackEvent(eventName, eventParams = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    club,
    ...getUtmParams(),
    ...eventParams
  });
}

function redirectToApp() {
  window.location.href = buildDestinationUrl();
}

function handleAccept() {
  localStorage.setItem(consentKey, "accepted");
  localStorage.setItem(`${consentKey}_date`, new Date().toISOString());

  statusMessage.textContent = "Preferencia guardada. Accediendo a ReadyStroke...";

  loadGoogleAnalytics(() => {
    trackEvent("consent_accepted");
    trackEvent("app_entry", { consent_status: "accepted" });

    setTimeout(redirectToApp, REDIRECT_DELAY_MS);
  });
}

function handleReject() {
  localStorage.setItem(consentKey, "rejected");
  localStorage.setItem(`${consentKey}_date`, new Date().toISOString());

  statusMessage.textContent = "Preferencia guardada. Accediendo a ReadyStroke...";

  setTimeout(redirectToApp, REDIRECT_DELAY_MS);
}

function init() {
  const existingConsent = localStorage.getItem(consentKey);

  if (existingConsent === "accepted") {
    loadGoogleAnalytics(() => {
      trackEvent("app_entry", { consent_status: "accepted_returning" });
      setTimeout(redirectToApp, REDIRECT_DELAY_MS);
    });
    return;
  }

  if (existingConsent === "rejected") {
    setTimeout(redirectToApp, 300);
    return;
  }

  acceptBtn.addEventListener("click", handleAccept);
  rejectBtn.addEventListener("click", handleReject);
}

init();
