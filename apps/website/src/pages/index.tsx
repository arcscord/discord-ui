import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import { Arrow } from "../components/Arrow";
import { ConversationDemo } from "../components/ConversationDemo";
import { ExamplePreview } from "../components/ExamplePreview";
import { heroExamples, richExamples } from "../data/examples";

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
          <ExamplePreview examples={heroExamples} label="Bot examples" />
        </section>
        <section className="landing-section" aria-labelledby="components">
          <Heading as="h2" id="components">
            Built for the messages
            {" "}
            <span>your bot sends.</span>
          </Heading>
          <p className="section-intro">From a welcome message to a release announcement.</p>
          <ExamplePreview examples={richExamples} label="Rich content" />
          <div className="section-links">
            <Link to="/components">
              Explore every component
              <Arrow />
            </Link>
          </div>
        </section>
        <section className="landing-section" aria-labelledby="conversation-title">
          <h2 id="conversation-title">
            Give the conversation
            {" "}
            <span>room.</span>
          </h2>
          <p className="section-intro">Render a full channel. Open a thread. Keep the context.</p>
          <ConversationDemo />
          <div className="section-links">
            <span>Try sending a message or opening a thread. Messages stay in this demo.</span>
            <Link to="/playground?example=channel-view">
              Open this example in the playground
              <Arrow />
            </Link>
          </div>
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
