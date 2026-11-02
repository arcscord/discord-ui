import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import { Arrow } from "../components/Arrow";
import { HeroDemo, SlashCommandDemo, TranscriptDemo } from "../components/LandingDemos";

export default function Home() {
  return (
    <Layout title="Discord messages. Without screenshots." description="Create dynamic Discord message examples with React. Explore real messages, Markdown, embeds, Components V2, channels and threads.">
      <main className="landing">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Discord messages.
              <br />
              <span>Without screenshots.</span>
            </h1>
            <p>Create dynamic Discord message examples with React.</p>
            <div className="hero-actions">
              <Link className="site-button primary" to="/components">
                Explore components
                <Arrow />
              </Link>
              <Link className="site-button" to="/playground">Open playground</Link>
              <Link className="text-action" to="/docs/installation">
                Get started
                <Arrow />
              </Link>
            </div>
          </div>
          <HeroDemo />
        </section>
        <section className="landing-section" aria-labelledby="transcript-title">
          <h2 id="transcript-title">
            Every conversation.
            {" "}
            <span>All the context.</span>
          </h2>
          <p className="section-intro">Turn a resolved ticket into a readable transcript. Replies, files and threads included.</p>
          <TranscriptDemo />
        </section>
        <section className="landing-section" aria-labelledby="arcade-title">
          <h2 id="arcade-title">
            Less watching.
            {" "}
            <span>More playing.</span>
          </h2>
          <p className="section-intro">Roll a die. Take a quiz. Ask the eight ball. Three commands, real UI interactions.</p>
          <SlashCommandDemo />
        </section>
        <section className="closing" aria-labelledby="closing-title">
          <h2 id="closing-title">
            Your next example starts
            {" "}
            <span>here.</span>
          </h2>
          <p>Add Discord UI to your React project.</p>
          <div className="hero-actions">
            <Link className="site-button primary" to="/docs/installation">Get started</Link>
            <Link className="site-button" to="/docs/introduction">Read the docs</Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
