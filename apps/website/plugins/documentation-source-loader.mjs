/** Keep copyable documentation code identical to the rendered module. */
export default function documentationSource(source) {
  return `export default ${JSON.stringify(source)};`;
}
