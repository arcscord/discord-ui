import type { ThemeName } from "@arcscord/discord-ui";
import { ChannelView, DiscordUI, Message, themes } from "@arcscord/discord-ui";
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";
import { useState } from "react";
import { demoChannel } from "../../../fixtures/channel";
import { basicMessage, demoEntities, editableContent, scenarios } from "../../../fixtures/messages";
import { JsonEditor } from "./json-editor";
import { createChannelEditor, createMessageEditor, parseChannelJson, parseMessageJson, serializeChannel, serializeMessage } from "./message-json";

type ScenarioName = keyof typeof scenarios | "channel";

const themeLabels: Record<ThemeName, string> = { light: "Clair", ash: "Ash", dark: "Sombre" };

export function App() {
  const [scenario, setScenario] = useState<ScenarioName>("basic");
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [width, setWidth] = useState(760);
  const [editor, setEditor] = useState(() => createMessageEditor(basicMessage));
  const [channelEditor, setChannelEditor] = useState(() => createChannelEditor(demoChannel));
  const [copyStatus, setCopyStatus] = useState("");
  const isChannel = scenario === "channel";
  const activeEditor = isChannel ? channelEditor : editor;
  const selected = isChannel ? basicMessage : scenarios[scenario].message;
  const message = editor.message;
  const content = editableContent(message);

  function changeJson(draft: string): void {
    if (isChannel) {
      const result = parseChannelJson(draft);
      setChannelEditor(previous => result.ok
        ? { channel: result.channel, draft, error: null }
        : { ...previous, draft, error: result.error });
      setCopyStatus("");
      return;
    }
    const result = parseMessageJson(draft);
    setEditor(previous => result.ok
      ? { message: result.message, draft, error: null }
      : { ...previous, draft, error: result.error });
    setCopyStatus("");
  }

  function changeContent(content: string): void {
    if (message.body.kind === "components-v2")
      return;
    setEditor(createMessageEditor({
      ...message,
      body: { ...message.body, content },
    }));
    setCopyStatus("");
  }

  function sendDemoMessage(content: string): void {
    setChannelEditor(previous => createChannelEditor({
      ...previous.channel,
      messages: [
        ...previous.channel.messages,
        {
          id: crypto.randomUUID(),
          author: { id: "you", displayName: "Vous" },
          timestamp: new Date().toISOString(),
          body: { kind: "markdown", content },
        },
      ],
    }));
    setCopyStatus("");
  }

  function formatJson(): void {
    if (isChannel) {
      setChannelEditor(previous => ({
        ...previous,
        draft: serializeChannel(previous.channel),
      }));
    }
    else {
      setEditor(previous => ({
        ...previous,
        draft: serializeMessage(previous.message),
      }));
    }
  }

  async function copyData(): Promise<void> {
    try {
      await navigator.clipboard.writeText(activeEditor.draft);
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
            <h2>{isChannel ? "Salon" : "Message"}</h2>
            <label htmlFor="scenario">Scénario</label>
            <select
              id="scenario"
              value={scenario}
              onChange={(event) => {
                const next = event.target.value as ScenarioName;
                setScenario(next);
                if (next === "channel")
                  setChannelEditor(createChannelEditor(demoChannel));
                else setEditor(createMessageEditor(scenarios[next].message));
                setRevision(value => value + 1);
                setCopyStatus("");
              }}
            >
              {Object.entries(scenarios).map(([id, entry]) => <option key={id} value={id}>{entry.label}</option>)}
              <option value="channel">Salon — plusieurs messages</option>
            </select>
            <label htmlFor="theme">Thème</label>
            <select id="theme" value={theme} onChange={event => setTheme(event.target.value as ThemeName)}>
              {Object.keys(themes).map(name => <option key={name} value={name}>{themeLabels[name as ThemeName]}</option>)}
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
            {isChannel
              ? <p className="scenario-note">Le JSON pilote le salon. La saisie ajoute des messages à cette démo.</p>
              : message.body.kind === "components-v2"
                ? <p className="scenario-note">Modifiez les composants V2 dans l’éditeur JSON.</p>
                : (
                    <>
                      <label htmlFor="content">Contenu</label>
                      <textarea id="content" value={content} rows={8} disabled={Boolean(editor.error)} onChange={event => changeContent(event.target.value)} />
                    </>
                  )}

            <button
              type="button"
              onClick={() => {
                if (isChannel)
                  setChannelEditor(createChannelEditor(demoChannel));
                else setEditor(createMessageEditor(selected));
                setRevision(value => value + 1);
                setCopyStatus("");
              }}
            >
              {isChannel ? "Réinitialiser le salon" : "Réinitialiser le message"}
            </button>
          </aside>
          <section className="preview-panel" aria-label={isChannel ? "Aperçu du salon" : "Aperçu du message"}>
            <div className="panel-heading">
              <h2>Aperçu</h2>
              <span>
                {themeLabels[theme]}
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
                    messages: "Messages",
                    emptyChannel: "Aucun message dans ce salon.",
                    messagePlaceholder: "Message #{channel}",
                    sendMessage: "Envoyer le message",
                    spoiler: "Spoiler",
                    showSpoiler: "Afficher le spoiler",
                    hideSpoiler: "Masquer le spoiler",
                    mediaUnavailable: "Média indisponible",
                    invalidTimestamp: "Date invalide",
                  }}
                >
                  {isChannel
                    ? <ChannelView key={`channel-${revision}`} channel={channelEditor.channel} height={620} onSend={sendDemoMessage} composerDisabled={Boolean(channelEditor.error)} />
                    : <Message key={`${scenario}-${revision}`} message={message} />}

                </DiscordUI>
              </div>
            </div>
            <JsonEditor
              documentType={isChannel ? "channel" : "message"}
              draft={activeEditor.draft}
              error={activeEditor.error}
              copyStatus={copyStatus}
              onChange={changeJson}
              onCopy={copyData}
              onFormat={formatJson}
            />
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
