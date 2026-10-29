export function Mention({ name, kind = "user", color }: { name: string; kind?: "user" | "role" | "channel" | "command"; color?: string | undefined }) {
  const safeColor = /^#[a-f\d]{6}$/iu.test(color ?? "")
    ? color
    : undefined;
  return (
    <span
      className="dui-mention"
      style={safeColor
        ? { color: safeColor }
        : undefined}
    >
      {kind === "channel"
        ? "#"
        : kind === "command"
          ? "/"
          : "@"}
      {name}
    </span>
  );
}
