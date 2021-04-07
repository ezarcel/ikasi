import { Titlebar, Color } from "custom-electron-titlebar"
import { ipcRenderer, remote } from "electron"
import { writeJSON } from "fs-extra"
import p from "path"
import Swal from "sweetalert2"

const { addRecentsEntry } = require("./js/tools") as typeof import("./tools")

ipcRenderer.on("save", () => save())
ipcRenderer.on("save-as", () => saveAs())
ipcRenderer.on("close", async () => {
	if ((await Swal.fire({
		allowEscapeKey: false,
		cancelButtonText: "[{(no)}]",
		confirmButtonText: "[{(yes)}]",
		focusCancel: true,
		showCancelButton: true,
		text: "[{(are-you-sure-you-want-to-quit)}]",
	})).isConfirmed) {
		window.clearInterval(intervalID)
		localStorage.removeItem(localStorageID)
		remote.getCurrentWindow().destroy()
	}
})
ipcRenderer.on("go-home", async () => {
	if ((await Swal.fire({
		allowEscapeKey: false,
		cancelButtonText: "[{(no)}]",
		confirmButtonText: "[{(yes)}]",
		focusCancel: true,
		showCancelButton: true,
		text: "[{(are-you-sure-you-want-to-go-home)}]",
	})).isConfirmed) {
		window.clearInterval(intervalID)
		localStorage.removeItem(localStorageID)
		location.href = "./index.html"
	}
})

const localStorageID = new URL(location.href).searchParams.get("localStorageID")
let data: ToDoData = { todos: [] }
let intervalID: number

const titlebar = new Titlebar({
	backgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex("#000000") : Color.fromHex("#ffffff"),
	itemBackgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex("#333333") : Color.fromHex("#cccccc"),
	icon: "../img/logo_without_text.png",
	shadow: false
})
ipcRenderer.on("colors-changed", () => {
	const darkMode = remote.nativeTheme.shouldUseDarkColors
	titlebar.updateBackground(darkMode ? Color.fromHex("#000000") : Color.fromHex("#ffffff"))
	titlebar.updateItemBGColor(darkMode ? Color.fromHex("#222222") : Color.fromHex("#dddddd"))
})
titlebar.updateMenu(remote.Menu.buildFromTemplate([
	{
		accelerator: "esc",
		click: (_, w) => w.webContents.send("go-home"),
		label: "[{(go-home)}]"
	},
	{
		label: "[{(file)}]",
		submenu: [
			{
				accelerator: "Ctrl + S",
				click: (_, w) => w.webContents.send("save"),
				label: "[{(save)}]"
			},
			{
				accelerator: "Ctrl + Shift + S",
				click: (_, w) => w.webContents.send("save-as"),
				label: "[{(save-as)}]"
			}
		]
	}
]))
function updateTitle() {
	const url = new URL(location.href)
	document.title = `${p.basename(url.searchParams.get("path") || "[{(untitled)}]")} - [{(product-name)}] To-do`
	titlebar.updateTitle()
}

async function save() {
	const url = new URL(location.href)
	const path = url.searchParams.get("path")
	if (!path) return saveAs()
	await writeJSON(path, data)
	await addRecentsEntry({ filename: path, timestamp: Date.now() })
}
async function saveAs() {
	const { canceled, filePath } = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
		defaultPath: "[{(untitled)}].itl",
		filters: [ {
			name: "ikasi To-do List",
			extensions: [ "itl" ]
		} ]
	})
	if (canceled) return;

	const url = new URL(location.href)
	url.searchParams.set("path", filePath)
	history.pushState("", "", url.href)
	updateTitle()

	save()
}
function sortToDos() {
	([ ...document.querySelectorAll("to-do") ] as ToDo[])
		.sort((a, b) => {
			const _a = a.toJSON()
			const _b = b.toJSON()
			if (_a.done && !_b.done) return 1
			else if (!_a.done && _b.done) return -1
			else if (_a.dueDate + _a.dueTime > _b.dueDate + _b.dueTime) return 1
			else if (_a.dueDate + _a.dueTime < _b.dueDate + _b.dueTime) return -1
			else if (_a.title > _b.title) return 1
			else if (_a.title < _b.title) return -1
			else if (_a.description > _b.description) return 1
			else if (_a.description < _b.description) return -1
			return 0
		})
		.forEach(e => document.querySelector("#wrapper").appendChild(e))
}
function addListeners(toDo: ToDo) {
	toDo.addEventListener("edited", () => {
		setTimeout(() => {
			sortToDos()
			data.todos = ([ ...document.querySelectorAll("to-do") ] as ToDo[]).map(e => e.toJSON())
		}, 0)
	})
	toDo.addEventListener("delete", async () => {
		if ((await Swal.fire({
			allowEscapeKey: false,
			cancelButtonText: "[{(no)}]",
			confirmButtonText: "[{(yes)}]",
			focusCancel: true,
			showCancelButton: true,
			text: "[{(are-you-sure-you-want-to-delete-this-to-do)}]",
		})).isConfirmed)
			toDo.remove()
	})
}

window.addEventListener("load", () => {
	if (localStorage.getItem(localStorageID) !== null)
		data = JSON.parse(localStorage.getItem(localStorageID))

	updateTitle()

	document.querySelector("#new-to-do").addEventListener("click", () => {
		const todoE = document.createElement("to-do") as ToDo
		addListeners(todoE)
		document.querySelector("#wrapper").appendChild(todoE)
	})

	data.todos.forEach(todo => {
		const todoE = document.createElement("to-do") as ToDo
		todoE.addEventListener("ready", () => {
			todoE.description = todo.description
			todoE.done = todo.done
			todoE.dueDate = todo.dueDate
			todoE.dueTime = todo.dueTime
			todoE.title = todo.title
		})
		addListeners(todoE)
		document.querySelector("#wrapper").appendChild(todoE)
	})
	sortToDos()

	intervalID = window.setInterval(() => {
		localStorage.setItem(localStorageID, JSON.stringify(data))
	}, 10)
})