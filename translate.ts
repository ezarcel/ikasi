import { appPath } from "./tools";

import { readJSON, writeJSON } from "fs-extra";
import p from "path";

export async function importTranslations(): Promise<{
  [key: string]: { [key: string]: string };
}>;
export async function importTranslations(language: string): Promise<{ [key: string]: string }>;
export async function importTranslations(language?: string) {
  const path = p.join(appPath, "translations.json");
  const translations = language ? (await readJSON(path))[language] : await readJSON(path);
  if (language) translations["lang-code"] = language;
  else
    Object.keys(translations)
      .sort()
      .forEach(language => (translations[language]["lang-code"] = language));
  return translations;
}

export async function translateString(string: string, language: string) {
  const translations = await importTranslations();
  if (!translations[language]) throw Error(`Unrecognized language "${language}"`);

  return Object.keys((translations ?? {})[language] ?? {}).reduce(
    (acc, key) => acc.split(`[{(${key})}]`).join((translations[language] ?? {})[key]),
    string
  );
}

async function prettifyTranslations() {
  const translations = await importTranslations();
  const newTranslations: { [key: string]: { [key: string]: string } } = {};
  Object.keys(translations)
    .sort()
    .forEach(language => {
      newTranslations[language] = {
        "product-name": translations[language]["product-name"]
      };
      Object.keys(translations[language])
        .filter(e => e !== "lang-code")
        .sort()
        .forEach(translation => (newTranslations[language][translation] = translations[language][translation]));
    });
  writeJSON("translations.json", newTranslations, { spaces: 2 });
}
if (require?.main === module) prettifyTranslations();
