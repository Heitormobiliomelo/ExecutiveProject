/* i18n.js — language detection, persistence, and DOM translation */

const SUPPORTED_LANGS = ["en", "pt", "es"];
const LANG_FLAGS = { en: "🇺🇸", pt: "🇧🇷", es: "🇪🇸" };
const STORAGE_KEY = "ece_lang";
const dictCache = {};

function detectInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  const navLang = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(navLang)) return navLang;

  return "en";
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function loadDict(lang) {
  if (dictCache[lang]) return dictCache[lang];
  const res = await fetch(`assets/i18n/${lang}.json`);
  const dict = await res.json();
  dictCache[lang] = dict;
  return dict;
}

function applyTranslations(dict) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = getPath(dict, el.getAttribute("data-i18n"));
    if (value !== undefined) el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr")
      .split(",")
      .forEach((pair) => {
        const [attr, path] = pair.split(":").map((s) => s.trim());
        const value = getPath(dict, path);
        if (value !== undefined) el.setAttribute(attr, value);
      });
  });

  document.documentElement.lang = dict.meta?.htmlLang || "en";
}

function updateLangSwitcherUI(lang) {
  document.querySelectorAll(".lang-switcher__option").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
  });
  const currentLabel = document.querySelector(".lang-switcher__button-label");
  if (currentLabel) currentLabel.textContent = lang.toUpperCase();
  const currentFlag = document.querySelector(".lang-switcher__button-flag");
  if (currentFlag) currentFlag.textContent = LANG_FLAGS[lang] || "🌐";
}

async function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = "en";
  localStorage.setItem(STORAGE_KEY, lang);
  const dict = await loadDict(lang);
  applyTranslations(dict);
  updateLangSwitcherUI(lang);
  document.dispatchEvent(new CustomEvent("ece:langchange", { detail: { lang, dict } }));
}

function initLangSwitcher() {
  const toggle = document.querySelector(".lang-switcher__button");
  const menu = document.querySelector(".lang-switcher__menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("is-open");
  });

  document.addEventListener("click", () => menu.classList.remove("is-open"));

  menu.querySelectorAll(".lang-switcher__option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosen = btn.getAttribute("data-lang");
      setLang(chosen);
      if (typeof gtag === "function") gtag("event", "language_change", { language: chosen });
      menu.classList.remove("is-open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLangSwitcher();
  setLang(detectInitialLang());
});
