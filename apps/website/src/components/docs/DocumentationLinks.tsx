import Link from "@docusaurus/Link";
import { documentationLinks } from "../../data/component-docs";

export default function DocumentationLinks({ component }: { component: string }) {
  const links = documentationLinks(component);
  return (
    <nav className="documentation-links" aria-label="Example documentation">
      <Link to={links.guide}>Usage guide</Link>
      <Link to={links.reference}>API reference</Link>
      <Link to="/docs/playground">Playground help</Link>
    </nav>
  );
}
