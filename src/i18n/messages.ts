import type { Locale } from "./config";
import { shellMessages } from "./messages/shell";
import { masterDataMessages } from "./messages/master-data";
export const messageNamespaces = { shell: shellMessages, masterData: masterDataMessages } as const;
export type Namespace = keyof typeof messageNamespaces;
export function translate<N extends Namespace>(
  locale: Locale,
  namespace: N,
  key: keyof (typeof messageNamespaces)[N],
) {
  const record = messageNamespaces[namespace][key] as Record<Locale, string> | undefined;
  return record?.[locale] ?? record?.["en-AU"] ?? `[${String(key)}]`;
}
export function translateUnknown(locale: Locale, key: string) {
  return key in shellMessages
    ? translate(locale, "shell", key as keyof typeof shellMessages)
    : `[${key}]`;
}
