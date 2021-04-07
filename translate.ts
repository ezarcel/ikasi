import { appPath } from "./tools"

import { readJSON, writeJSON } from "fs-extra"
import p from "path"

export async function importTranslations(): Promise<{ [ key: string ]: { [ key: string ]: string } }>
export async function importTranslations(language: string): Promise<{ [ key: string ]: string }>
export async function importTranslations(language?: string) {
	const path = p.join(appPath, "translations.json")
	const translations = language
		? (await readJSON(path))[ language ]
		: await readJSON(path)
	if (language) translations[ "lang-code" ] = language
	else Object.keys(translations).sort().forEach(language => translations[ language ][ "lang-code" ] = language)
	return translations
}

export async function translateString(str: string, language: string) {
	const translations = await importTranslations()
	if (!translations[ language ]) throw Error(`Unrecognized language "${language}"`)

	let _str = str.slice(0)
	Object.keys((translations ?? {})[ language ] ?? {}).forEach(translation =>
		_str = _str.split(`[{(${translation})}]`).join((translations[ language ] ?? {})[ translation ])
	)

	return _str
}

async function prettifyTranslations() {
	const translations = await importTranslations()
	const newTranslations: { [ key: string ]: { [ key: string ]: string } } = {}
	Object.keys(translations).sort().forEach(language => {
		newTranslations[ language ] = {
			"product-name": translations[ language ][ "product-name" ]
		}
		Object.keys(translations[ language ]).filter(e => e !== "lang-code").sort().forEach(translation =>
			newTranslations[ language ][ translation ] = translations[ language ][ translation ]
		)
	})
	writeJSON("translations.json", newTranslations, { spaces: 4 })
}
if (require?.main === module) prettifyTranslations()