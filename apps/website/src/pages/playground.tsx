import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import { lazy, Suspense } from "react";

const PlaygroundEditor = lazy(() => import("../components/playground/PlaygroundEditor"));

export default function Playground() {
  const loading = <p className="editor-loading" role="status">Loading the React editor…</p>;
  return (
    <Layout title="Playground" description="Edit React examples and explore live Discord messages, channels and threads.">
      <main className="playground-page">
        <h1>Playground</h1>
        <p className="section-intro">Edit a React example and explore the result.</p>
        <p className="scope-note"><Link to="/docs/vue#examples">Browse interactive Vue examples</Link></p>
        <BrowserOnly fallback={loading}>{() => <Suspense fallback={loading}><PlaygroundEditor /></Suspense>}</BrowserOnly>
      </main>
    </Layout>
  );
}
