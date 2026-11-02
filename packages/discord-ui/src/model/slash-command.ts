/** Command names may contain spaces for subcommands, e.g. "config show". */
export type SlashCommand = {
  name: string;
  description: string;
  application?: string;
  arguments?: readonly SlashCommandArgument[];
};

export type SlashCommandArgument = {
  name: string;
  description: string;
  required?: boolean;
  /** Omit choices to accept a free text value. */
  choices?: readonly { name: string; value: string }[];
};

export type SlashCommandInvocation = {
  command: SlashCommand;
  arguments: Record<string, string>;
};

export type SlashCommandHandler = (invocation: SlashCommandInvocation) => void;
