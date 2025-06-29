import { useState } from "react";
import { useTranslation } from "react-i18next";
import viteLogo from "/vite.svg";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{t("game.title")}</h1>
      <div className="card">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          {t("game.score.title")}: {count}
        </button>
        <p>
          {t("ui.editFile")} <code>src/App.tsx</code> {t("ui.andSave")}
        </p>
        <div className="language-controls">
          <button type="button" onClick={toggleLanguage}>
            {t("settings.language")}: {t(`languages.${i18n.language}`)}
          </button>
          <p>
            {t("debug.currentLanguage")}: {i18n.language}
          </p>
        </div>
      </div>
      <div className="tetris-preview">
        <h2>{t("game.pieces.next")}</h2>
        <p>{t("game.score.lines")}: 0</p>
        <p>{t("game.score.level")}: 1</p>
        <p>{t("game.states.ready")}</p>
        <div className="debug-info">
          <h3>{t("debug.title")}:</h3>
          <p>
            {t("debug.initialized")}: {i18n.isInitialized ? "✅" : "❌"}
          </p>
          <p>
            {t("debug.currentLanguage")}: {i18n.language}
          </p>
          <p>
            {t("debug.availableLanguages")}: {i18n.languages.join(", ")}
          </p>
          <p>
            {t("debug.localStorageValue")}:{" "}
            {localStorage.getItem("tetris-language") || t("debug.none")}
          </p>
        </div>
      </div>
      <p className="read-the-docs">{t("ui.clickLogos")}</p>
    </>
  );
}

export default App;
