import { copy, emptyDir, ensureDir, mkdir, readFile, remove, writeFile } from "fs-extra"

import { directoryExists, recursive } from "./tools"
import { translateString } from "./translate"

export async function generateStaticFolder(inputDirectory: string, outputDirectory: string, language: string) {
	await ensureDir(inputDirectory)

	if (await directoryExists(outputDirectory)) await remove(outputDirectory)
	await mkdir(outputDirectory)

	await emptyDir(outputDirectory)
	await copy(inputDirectory, outputDirectory)
	recursive(outputDirectory, async path => {
		let content = await readFile(path, "utf8")
		await writeFile(path, await translateString(content, language))
	}, { useRelativePath: false })
}