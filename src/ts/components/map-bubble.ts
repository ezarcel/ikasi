class Bubble extends HTMLElement {
	#bound_onClick = this.onClick.bind(this)
	#bound_onKeyDown = this.onKeyDown.bind(this)
	#bound_onMouseMove = this.onMouseMove.bind(this)
	#bound_onMouseUp = this.onMouseUp.bind(this)
	#dragMode: BubbleDragMode
	#intervalID: number
	#image: MindMapImage
	#isMouseDown = false
	#oldHeight: number
	#oldWidth: number
	#oldX: number
	#oldY: number
	#ready = false
	#resizeDirection: BubbleResizeDirection
	#settings: MindMapSettings
	#status: BubbleStatus

	#bubble: HTMLDivElement
	#content: HTMLSpanElement
	#controls: HTMLDivElement
	#addImage: HTMLDivElement
	#deleteBubble: HTMLDivElement
	#img: HTMLImageElement
	#newChildBubble: HTMLDivElement
	#resizers: HTMLDivElement[]
	constructor() {
		super()
		this.attachShadow({ mode: "open" }).innerHTML = `
			<link rel="stylesheet" href="https://kit-pro.fontawesome.com/releases/latest/css/pro.min.css">
			<style>
				* {
					outline: none;
					user-select: none;
					box-sizing: border-box;
				}
				:host {
					display: inline-block;
					min-width: min-content;
				}

				div#bubble {
					border-radius: 10px;
					overflow: hidden;
					background-color: var(--settings-bubble-color);
					border: solid var(--settings-border-width) var(--settings-border-color);
					width: 100%; height: 100%;
					min-width: min-content; min-height: min-content;
					display: flex;
					flex-direction: column;
					place-items: center;
					justify-content: center;
					padding: var(--settings-bubble-padding-size);
				}
				:host([status="normal"]) div#bubble {
					cursor: pointer;
				}
				:host([status="expanded"]) div#bubble {
					cursor: move;
				}
				:host([status="expanded"]) span#content {
					cursor: text;
				}

				span#content:empty:before {
					content: "\\200b";
				}
				span#content {
					text-align: center;
					display: block;
					color: var(--settings-font-color);
					font-family: var(--settings-font-family);
					font-size: var(--settings-font-size);
				}

				:host([status="normal"]) .hide-while-not-expanded {
					display: none;
				}
				.controls {
					position: absolute;
					display: flex;
					flex-direction: row;
					left: 50%;
					bottom: -2.5px;
					transform: translate(-50%, 100%);
					z-index: 99;
					height: fit-content;
				}
				.controls > * {
					cursor: pointer;
					font-size: 14px;
					border-radius: 99px;
					background-color: var(--settings-border-color);
					width: 25px; 
					height: 25px;
					display: flex;
					place-items: center;
					justify-content: center;
				}
				.controls > *:not(:last-child) { margin-right: 5px; }

				.resizer {
					position: absolute;
					height: 20px;
					width: 20px;
				}
				#resizer-tl,
				#resizer-br { cursor: nw-resize; }
				#resizer-tr,
				#resizer-bl { cursor: ne-resize; }
				#resizer-tl { top: 0; left: 0; transform: translate(-50%, -50%); }
				#resizer-tr { top: 0; right: 0; transform: translate(50%, -50%); }
				#resizer-bl { bottom: 0; left: 0; transform: translate(-50%, 50%); }
				#resizer-br { bottom: 0; right: 0; transform: translate(50%, 50%); }

				img {
					max-width: 100%;
					margin-bottom: var(--settings-bubble-padding-size);
				}
				img:not([src]) { display: none; }
			</style>
			<div id="bubble">
				<img onload="this.style.display = 'block'" onerror="this.style.display = 'none'">
				<span id="content">${this.innerText}</span>
				<div class="controls">
					<div class="hide-while-not-expanded new-child-bubble">
						<i title="[Ctrl + Enter] [{(new-child-bubble)}]" class="far fa-plus fa-fw"></i>
					</div>
					<div class="hide-while-not-expanded delete-bubble">
						<i title="[{(delete-bubble)}]" class="far fa-times fa-fw"></i>
					</div>
					<div class="hide-while-not-expanded add-image">
						<i title="[{(add-image)}]" class="far fa-image fa-fw"></i>
					</div>
				</div>
				<div class="resizer" direction="tl" id="resizer-tl"></div>
				<div class="resizer" direction="tr" id="resizer-tr"></div>
				<div class="resizer" direction="bl" id="resizer-bl"></div>
				<div class="resizer" direction="br" id="resizer-br"></div>
			</div>
		`

		this.#bubble = this.shadowRoot.querySelector(":scope > div#bubble")
		this.#content = this.#bubble.querySelector(":scope > span")
		this.#controls = this.#bubble.querySelector(":scope > .controls")
		this.#addImage = this.#bubble.querySelector(":scope > .controls > .add-image")
		this.#deleteBubble = this.#bubble.querySelector(":scope > .controls > .delete-bubble")
		this.#img = this.#bubble.querySelector(":scope > img")
		this.#newChildBubble = this.#bubble.querySelector(":scope > .controls > .new-child-bubble")
		this.#resizers = [ ...this.#bubble.querySelectorAll(":scope > .resizer") ] as HTMLDivElement[]

		window.addEventListener("click", this.#bound_onClick)
		this.addEventListener("dblclick", this.onDblClick)
		this.#addImage.addEventListener("click", () => this.dispatchEvent(new CustomEvent("add-image")))
		this.#deleteBubble.addEventListener("click", () => this.dispatchEvent(new CustomEvent("delete")))
		this.#img.addEventListener("click", () => this.dispatchEvent(new CustomEvent("remove-image")))
		this.#newChildBubble.addEventListener("click", this.newChild.bind(this))

		this.#intervalID = window.setInterval(() => {
			if (this.#status === "expanded") this.relocate()
			const minHeight = [ ...this.#bubble.children ].map(e =>
				[ "static", "relative" ].includes(getComputedStyle(e).position)
					? e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginTop.slice(0, -2)) + parseFloat(getComputedStyle(e).marginBottom.slice(0, -2))
					: 0
			).reduce((acc, e) => acc + e, 0) + (this.#settings?.borderWidth || 0) * 2 + (this.#settings?.bubblePaddingSize || 0) * 2
			if (!this.style?.minHeight.startsWith(minHeight.toString())) {
				this.style.minHeight = `${minHeight}px`
				this.dispatchEvent(new CustomEvent("rejoin-me"))
			}
		}, 0)

	}
	connectedCallback() {
		this.status = this.status || "normal"

		if (!this.#ready) {
			this.#ready = true
			this.dispatchEvent(new CustomEvent("ready"))
		}
	}

	onClick(e: MouseEvent) {
		this.status = e.composedPath().includes(this.#bubble)
			? "expanded"
			: "normal"
	}
	onDblClick(e: MouseEvent) {
		e.preventDefault()
		this.edit()
	}
	onKeyDown(e: KeyboardEvent) {
		this.relocate()
		if (this.status === "expanded" && e.key === "Enter" && e.ctrlKey) {
			e.preventDefault()
			this.newChild()
		} else this.dispatchEvent(new CustomEvent("rejoin-me"))
	}
	onKey() {
		this.dispatchEvent(new CustomEvent("rejoin-me"))
		this.relocate()
		this.dispatchEvent(new CustomEvent("rejoin-me"))

		setTimeout(() => {
			this.relocate()
			this.dispatchEvent(new CustomEvent("rejoin-me"))
		}, 0)
	}
	onMouseDown(e: MouseEvent) {
		if (e.composedPath().includes(this.#content)) return;
		this.#isMouseDown = true
		this.#oldX = e.clientX
		this.#oldY = e.clientY

		const resizer = e.composedPath().find((e: HTMLDivElement) => this.#resizers.includes(e)) as HTMLDivElement
		if (resizer) {
			this.#dragMode = "resize"
			this.#resizeDirection = resizer.getAttribute("direction") as BubbleResizeDirection
		} else
			this.#dragMode = "move"
	}
	onMouseMove(e: MouseEvent) {
		if (this.status === "expanded" && this.#isMouseDown) {
			e.preventDefault()
			let diffX = e.clientX - this.#oldX
			let diffY = e.clientY - this.#oldY

			if (this.#dragMode === "resize") {
				diffX *= this.#resizeDirection === "tl" || this.#resizeDirection === "bl" ? -1 : 1
				diffY *= this.#resizeDirection === "tl" || this.#resizeDirection === "tr" ? -1 : 1

				this.width += diffX * 2
				this.height += diffY * 2
				this.relocate()
			} else if (this.#dragMode === "move") {
				this.x += diffX
				this.y += diffY
			}

			this.#oldX = e.clientX
			this.#oldY = e.clientY
			this.dispatchEvent(new CustomEvent("rejoin-me"))
		}
	}
	onMouseUp() { this.#isMouseDown = false }

	delete() {
		clearInterval(this.#intervalID)
		window.removeEventListener("keydown", this.#bound_onKeyDown)
		window.removeEventListener("mouseup", this.#bound_onMouseUp)
		window.removeEventListener("mousemove", this.#bound_onMouseMove)
		window.removeEventListener("click", this.#bound_onClick)
		this.dispatchEvent(new CustomEvent("delete-me"))
		this.remove()
	}
	edit() {
		setTimeout(() => {
			this.status = "expanded"
			this.#content.focus()
		}, 0)
	}
	newChild() { this.dispatchEvent(new CustomEvent("new-child")) }
	relocate() {
		if (this.width !== this.#oldWidth) this.x -= (this.width - this.#oldWidth) / 2
		if (this.height !== this.#oldHeight) this.y -= (this.height - this.#oldHeight) / 2
		this.#oldHeight = this.height
		this.#oldWidth = this.width

		this.dispatchEvent(new CustomEvent("update-data"))
	}
	update(settings: MindMapSettings & { [ key: string ]: string | number }) {
		this.#settings = settings

		this.#bubble.style.setProperty("--settings-border-color", settings.borderColor)
		this.#bubble.style.setProperty("--settings-border-width", `${settings.borderWidth}px`)
		this.#bubble.style.setProperty("--settings-bubble-color", settings.bubbleColor)
		this.#bubble.style.setProperty("--settings-bubble-padding-size", `${settings.bubblePaddingSize}px`)
		this.#bubble.style.setProperty("--settings-font-color", settings.fontColor)
		this.#bubble.style.setProperty("--settings-font-family", settings.fontFamily)
		this.#bubble.style.setProperty("--settings-font-size", `${settings.fontSize}px`)
		this.#bubble.style.minWidth = `${(this.#controls.children.length * 25) + ((this.#controls.children.length - 1) * 5) + (settings.bubblePaddingSize * 2)}px`

		if (window.require) {
			const { Color } = window.require("./js/tools") as typeof import("../tools")
			this.#controls.style.color = Color.textColor(settings.borderColor)
		}
	}

	get height(): number { return this.offsetHeight }
	set height(height: number) { this.style.height = `${height}px` }

	get image() { return this.#image }
	set image(image: MindMapImage | null) {
		if (image) {
			this.#img.src = `data:image/${image.format.replace("jpg", "jpeg")};base64,${image.base64Image}`
			this.#image = image
		} else {
			this.#img.src = ''
			this.#image = null
		}
	}

	get status() { return this.#status }
	set status(status) {
		if (this.#status === status) return;
		this.setAttribute("status", status)
		if (status === "expanded") {
			document.querySelectorAll("map-bubble").forEach(e => (e as Bubble).status = "normal")
			window.addEventListener("keydown", this.#bound_onKeyDown)
			this.addEventListener("keydown", this.onKey)
			this.addEventListener("keypress", this.onKey)
			this.addEventListener("keyup", this.onKey)
			window.addEventListener("mouseup", this.#bound_onMouseUp)
			window.addEventListener("mousemove", this.#bound_onMouseMove)
			this.addEventListener("mousedown", this.onMouseDown)
			this.#content.contentEditable = "true"
		} else if (status === "normal") {
			window.removeEventListener("keydown", this.#bound_onKeyDown)
			this.removeEventListener("keydown", this.onKey)
			this.removeEventListener("keypress", this.onKey)
			this.removeEventListener("keyup", this.onKey)
			window.removeEventListener("mouseup", this.#bound_onMouseUp)
			window.removeEventListener("mousemove", this.#bound_onMouseMove)
			this.removeEventListener("mousedown", this.onMouseDown)
			this.#content.contentEditable = "false"
		}
		this.#status = status
	}

	get text(): string { return this.#content.textContent }
	set text(text: string) { this.#content.textContent = text }

	get width(): number { return this.offsetWidth }
	set width(width: number) { this.style.width = `${width}px` }

	get x(): number { return this.offsetLeft }
	set x(x: number) { this.style.left = `${x < 0 ? 0 : x}px` }

	get y(): number { return this.offsetTop }
	set y(y: number) { this.style.top = `${y < 0 ? 0 : y}px` }

	toJSON(): IBubble {
		return {
			height: this.height,
			id: this.id,
			image: this.image,
			text: this.text,
			width: this.width,
			x: this.x,
			y: this.y
		}
	}
}
window.customElements.define("map-bubble", Bubble)