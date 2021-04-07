// FOR NPM SCRIPTS USE ONLY

import ePackager from "electron-packager"
import { emptyDir, ensureDir, rmdir, unlink } from "fs-extra"
import p from "path"

const eWInstaller = require("electron-winstaller") as typeof import("electron-winstaller")

(async () => {
	await ensureDir("./tmp")
	await emptyDir("./tmp")
	await ensureDir("./build")
	await emptyDir("./build")

	switch (process.argv[ 2 ]) {
		case "windows-x64": {
			await ePackager({
				arch: "x64",
				dir: ".",
				icon: "./img/app_icon.ico",
				ignore: path =>
					[ "/recents.json", "/tsconfig.json" ].includes(path)
					|| [ ".scss", ".sass", ".ts" ].includes(p.extname(path))
					|| path.startsWith("/node_modules/.bin")
					|| path.startsWith("/node_modules/@types"),
				out: "./tmp",
				platform: "win32"
			})
			await eWInstaller.createWindowsInstaller({
				appDirectory: "./tmp/ikasi-win32-x64",
				authors: "ezarcel",
				description: "Open-source learning and planning toolkit",
				noMsi: true,
				outputDirectory: "./build/ikasi-win32-x64",
				setupExe: "ikasi-setup.exe",
				setupIcon: "./img/app_icon.ico",
			})
			break;
		}

		case "linux-x64-flatpak": {
			await ePackager({
				arch: "x64",
				dir: ".",
				icon: "./img/app_icon.icns",
				ignore: path =>
					[ "/recents.json", "/tsconfig.json" ].includes(path)
					|| [ ".scss", ".sass", ".ts" ].includes(p.extname(path))
					|| path.startsWith("/node_modules/.bin")
					|| path.startsWith("/node_modules/@types"),
				out: "./tmp",
				platform: "linux"
			})
			// await eWInstaller.createWindowsInstaller({
			// 	appDirectory: "./tmp/ikasi-win32-x64",
			// 	authors: "ezarcel",
			// 	description: "Open-source learning and planning toolkit",
			// 	noMsi: true,
			// 	outputDirectory: "./build/ikasi-win32-x64",
			// 	setupExe: "ikasi-setup.exe",
			// 	setupIcon: "./img/app_icon.ico",
			// })
			await emptyDir("./tmp")
			await unlink("./tmp")
			break;
		}

		default:
			break;
	}
})()