import { app } from "electron"
import { readdir, stat } from "fs-extra"
import p from "path"

export const exists = (path: string) => stat(path).then(() => true).catch(() => false)
export const fileExists = (path: string) => stat(path).then(r => r.isFile()).catch(() => false)
export const directoryExists = (path: string) => stat(path).then(r => r.isDirectory()).catch(() => false)

export async function filterAsync(array: any[], predicate: (value: any, index: number, array: any[]) => Promise<boolean>) {
	const results = await Promise.all(array.map(predicate))
	return array.filter((_, i) => results[ i ])
}
export async function mapAsync(array: any[], predicate: (value: any, index: number, array: any[]) => Promise<any>) {
	return await Promise.all(array.map(predicate))
}

export async function recursive(startPath: string, callback: (fullPath: string) => void,
	{ deepness: maxDeepness = -1, hideWarnings = false, parseDirectories = true, parseFiles = true, useRelativePath = true }:
		{ deepness?: number; hideWarnings?: boolean; parseDirectories?: boolean; parseFiles?: boolean; useRelativePath?: boolean } = {}
) {
	const _startPath = p.normalize(startPath)
	const startDeepness = _startPath.split("/").length - 2
	const enableDeepness = maxDeepness >= 0

	async function doIt(parent: string, deepness: number) {
		try {
			const contents = await readdir(parent)
			if (parseDirectories && ((enableDeepness && deepness < maxDeepness) || !enableDeepness)) (await filterAsync(contents, async (child) => await directoryExists(p.join(parent, child)))).forEach(dir => doIt(p.join(parent, dir), deepness + 1))
			if (parseFiles) (await filterAsync(contents, async (child) => await fileExists(p.join(parent, child)))).forEach(file => {
				if (!callback) return;
				const fFile = p.join(parent, file)
				callback(useRelativePath ? fFile.split("/").slice(startDeepness).join("/") : fFile)
			})
		} catch (e) {
			if (!hideWarnings && (e as any).code === "EPERM") console.warn(`[WARNING] Lacking permissions to read ${parent}`)
		}
	}
	doIt(_startPath, 0)
}

export const appPath = app?.isPackaged ? p.join(process.resourcesPath, "app") : process.cwd()