// The Docusaurus plugin creates this module during dev/build. Keep standalone
// typechecking independent of generated files on a clean checkout.
declare module "@generated/local-documentation-search/default/search-index.json" {
  const documents: readonly import("@site/src/data/documentation-search").SearchDocument[];
  export default documents;
}
