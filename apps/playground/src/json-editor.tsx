export type JsonEditorProps = {
  draft: string;
  error: string | null;
  copyStatus: string;
  onChange: (draft: string) => void;
  onFormat: () => void;
  onCopy: () => Promise<void>;
};

export function JsonEditor({ draft, error, copyStatus, onChange, onFormat, onCopy }: JsonEditorProps) {
  return (
    <section className="json-editor" aria-label="Éditeur JSON">
      <div className="data-heading">
        <h2><label htmlFor="message-json">Données JSON</label></h2>
        <div className="data-actions">
          <button type="button" onClick={onFormat} disabled={Boolean(error)}>Formater</button>
          <button type="button" onClick={onCopy}>Copier le JSON</button>
        </div>
      </div>
      <p id="json-help" className="json-help">Modifiez le modèle du message : l’aperçu suit les modifications valides.</p>
      <p role="status" className="copy-status">{copyStatus}</p>
      {error
        ? (
            <p id="json-error" className="json-error" role="alert">
              {error}
              {" "}
              L’aperçu conserve le dernier message valide.
            </p>
          )
        : null}
      <textarea id="message-json" aria-label="JSON du message" aria-invalid={Boolean(error)} aria-describedby={error ? "json-help json-error" : "json-help"} className="data-editor" value={draft} onChange={event => onChange(event.target.value)} rows={16} spellCheck={false} wrap="off" />
    </section>
  );
}
