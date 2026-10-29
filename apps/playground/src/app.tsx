import { DiscordUI, Message } from "@arcscord/discord-ui";
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";
import { useState } from "react";
import { basicMessage, demoEntities, scenarios } from "../../../fixtures/messages";

export function App() {
  const [scenario, setScenario] = useState<keyof typeof scenarios>("basic");
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [width, setWidth] = useState(760);
  const [content, setContent] = useState(basicMessage.body.content);
  const [copyStatus, setCopyStatus] = useState("");
  const selected = scenarios[scenario].message;
  const message = {
    ...selected,
    body: { ...selected.body, content },
  };

  async function copyData(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(message, null, 2));
      setCopyStatus("Données copiées");
    }
    catch { setCopyStatus("Copie indisponible : sélectionnez les données ci-dessous."); }
  }

  return (
    <div className="playground">
      <header className="site-header">
        <a href="/" className="brand">
          Arcscord
          <span>Discord UI</span>
        </a>
        <a href="https://github.com/arcscord/discord-ui">GitHub ↗</a>
      </header>
      <main>
        <div className="intro">
          <h1>Playground</h1>
          <p>Composez un message. Inspectez le rendu.</p>
        </div>
        <div className="workbench">
          <aside className="controls" aria-label="Réglages du message">
            <h2>Message</h2>
            <label htmlFor="scenario">Scénario</label>
            <select
              id="scenario"
              value={scenario}
              onChange={(event) => {
                const next = event.target.value as keyof typeof scenarios;
                setScenario(next);
                setContent(scenarios[next].message.body.content);
                setCopyStatus("");
              }}
            >
              {Object.entries(scenarios).map(([id, entry]) => <option key={id} value={id}>{entry.label}</option>)}
            </select>
            <label htmlFor="theme">Thème</label>
            <select id="theme" value={theme} onChange={event => setTheme(event.target.value as "dark" | "light")}>
              <option value="dark">Sombre</option>
              <option value="light">Clair</option>
            </select>
            <label htmlFor="width">
              Largeur
              <span>
                {width}
                {" "}
                px
              </span>
            </label>
            <input id="width" type="range" min="320" max="960" step="20" value={width} onChange={event => setWidth(Number(event.target.value))} />
            <label htmlFor="content">Contenu</label>
            <textarea id="content" value={content} rows={8} onChange={event => setContent(event.target.value)} />
            <button
              type="button"
              onClick={() => {
                setContent(selected.body.content);
                setRevision(value => value + 1);
                setCopyStatus("");
              }}
            >
              Réinitialiser le message
            </button>
          </aside>
          <section className="preview-panel" aria-label="Aperçu du message">
            <div className="panel-heading">
              <h2>Aperçu</h2>
              <span>
                {theme === "dark"
                  ? "Sombre"
                  : "Clair"}
                {" "}
                · fr-FR · UTC
              </span>
            </div>
            <div className="preview-stage">
              <div className="preview-width" style={{ width, maxWidth: "100%" }}>
                <DiscordUI
                  theme={theme}
                  locale="fr-FR"
                  timeZone="UTC"
                  entities={demoEntities}
                  renderCode={renderHighlightedCode}
                  labels={{
                    spoiler: "Spoiler",
                    showSpoiler: "Afficher le spoiler",
                    hideSpoiler: "Masquer le spoiler",
                    mediaUnavailable: "Média indisponible",
                    invalidTimestamp: "Date invalide",
                  }}
                >
                  <Message key={`${scenario}-${revision}`} message={message} />
                </DiscordUI>
              </div>
            </div>
            <div className="data-heading">
              <h2>Données</h2>
              <button type="button" onClick={copyData}>Copier le JSON</button>
            </div>
            <p role="status" className="copy-status">{copyStatus}</p>
            <pre className="data-output"><code>{JSON.stringify(message, null, 2)}</code></pre>
          </section>
        </div>
      </main>
      <footer className="site-footer">
        React · TypeScript · CSS autonome
        <a href="/THIRD_PARTY_NOTICES.txt">Crédits et licences</a>
      </footer>
    </div>
  );
}
