import type { ThemeName } from "@arcscord/discord-ui";
import Link from "@docusaurus/Link";
import CodeBlock from "@theme/CodeBlock";
import { useState } from "react";
import { playgroundUrl } from "../data/example-links";
import { scenarioExamples } from "../data/scenarios";
import { AnnouncementPreview, ArcadePreview, TranscriptPreview } from "../generated/examples/landing";
import { exportCode } from "./playground/export-code";

function DemoTheme({ value, onChange, label }: { value: ThemeName; onChange: (theme: ThemeName) => void; label: string }) {
  return (
    <label className="demo-theme">
      <span>{label}</span>
      <select aria-label={`${label} theme`} value={value} onChange={event => onChange(event.target.value as ThemeName)}>
        <option value="dark">Dark</option>
        <option value="ash">Ash</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
}

export function HeroDemo() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const example = scenarioExamples.find(example => example.id === "announcement")!;
  return (
    <div className="example-frame hero-demo">
      <div className="example-grid">
        <div className="example-code">
          <div className="example-bar">
            announcement.jsx
            <span>Components V2</span>
          </div>
          <div className="example-source"><CodeBlock language="jsx">{exportCode(example.code, theme)}</CodeBlock></div>
        </div>
        <div className="example-output">
          <div className="example-bar">
            <span>One message. Many possibilities.</span>
            <DemoTheme value={theme} onChange={setTheme} label="Announcement" />
          </div>
          <div className="message-preview"><AnnouncementPreview theme={theme} /></div>
          <div className="example-caption">
            <span>Rendered with the real React components.</span>
            <Link to={playgroundUrl("announcement", theme)}>Edit this announcement →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TranscriptDemo() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  return (
    <div className="example-frame transcript-demo">
      <div className="example-bar">
        <span className="demo-status">● Resolved ticket · 6 messages</span>
        <DemoTheme value={theme} onChange={setTheme} label="Transcript" />
      </div>
      <TranscriptPreview theme={theme} />
      <div className="example-caption">
        <span>A saved conversation. Open “Permission check” to see the thread.</span>
        <Link to={playgroundUrl("transcript", theme)}>Edit this transcript →</Link>
      </div>
    </div>
  );
}

export function SlashCommandDemo() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [session, setSession] = useState(0);
  return (
    <div className="example-frame arcade-demo">
      <div className="example-bar">
        <span>Type / to start playing</span>
        <div className="demo-tools">
          <button className="demo-reset" type="button" onClick={() => setSession(value => value + 1)}>Reset demo</button>
          <DemoTheme value={theme} onChange={setTheme} label="Arcade" />
        </div>
      </div>
      <ArcadePreview key={session} theme={theme} />
      <div className="example-caption">
        <span>Simulated in your browser. No Discord connection required.</span>
        <Link to={playgroundUrl("arcade", theme)}>Edit this arcade →</Link>
      </div>
    </div>
  );
}
