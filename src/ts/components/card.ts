const { Color } = require("./js/tools") as typeof import("../tools")

class Card extends HTMLElement {
	#animationDuration = 1 / 3 * 1000

	#backgroundColor: string
	#defaultColors = [
		{ color: "#ff0088", name: "[{(color.fuchsia)}]" },
		{ color: "#ff3333", name: "[{(color.red)}]" },
		{ color: "#fc626a", name: "[{(color.coral)}]" },
		{ color: "#ff7700", name: "[{(color.orange)}]" },
		{ color: "#e0e022", name: "[{(color.yellow)}]" },
		{ color: "#33ee00", name: "[{(color.lime)}]" },
		{ color: "#00bb11", name: "[{(color.green)}]" },
		{ color: "#11eeee", name: "[{(color.aqua)}]" },
		{ color: "#00bbff", name: "[{(color.sky-blue)}]" },
		{ color: "#2244bb", name: "[{(color.sea-blue)}]" },
		{ color: "#7711ff", name: "[{(color.purple)}]" },
		{ color: "#ee55ee", name: "[{(color.pink)}]" }
	]
	#foldRatio = .075

	#card: HTMLDivElement
	#title: HTMLElement
	#subtitle: HTMLElement
	#content: HTMLDivElement
	#controls: HTMLDivElement
	#deleteCard: HTMLDivElement
	connectedCallback() {
		this.attachShadow({ mode: "open" }).innerHTML = `
			<link rel="stylesheet" href="https://kit-pro.fontawesome.com/releases/latest/css/pro.min.css">
			<style>
				* {
					box-sizing: border-box;
					outline: none;
					user-select: none;
				}
				:host {
					display: inline-block;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif
				}

				#card {
					background-color: var(--background-color);
					color: var(--color);
					clip-path: polygon(${100 - this.#foldRatio * 100}% 0, 100% ${this.#foldRatio * 100}%, 100% 100%, 0 100%, 0 0);
					display: flex;
					flex-direction: column;
					overflow: hidden;
					padding: 20px;
					position: relative;
					width: 100%;
					height: 100%;
				}
				#card::after {
					backdrop-filter: invert(1);
					opacity: .25;
					content: "";
					height: ${this.#foldRatio * 100}%;
					position: absolute;
					right: 0;
					top: 0;
					width: ${this.#foldRatio * 100}%;
					transition: background-color ${this.#animationDuration}ms;
				}
				#card.animatable {
					transition: background-color ${this.#animationDuration}ms, color ${this.#animationDuration}ms;
				}
				#card:not(:hover):not(:focus-within) #controls {
					display: none;
				}

				#title, #subtitle {
					margin: 0 0 12.5px 0;
				}
				
				#subtitle {
					font-style: italic;
					font-weight: normal;
				}

				#content {
					height: 100%;
					overflow: auto;
				}

				#controls {
					margin: 12.5px 0 0 0;
					display: flex;
					flex-direction: row;
				}

				#delete-card-container,
				#controls .color {
					height: 30px;
					width: 30px;
				}

				#delete-card-container {
					display: flex;
					place-items: center;
					justify-content: center;
				}

				#controls .color {
					border: solid .25px #0004;
				}

				#controls > * {
					cursor: pointer;
				}

				#controls > *:not(:last-child) {
					margin: 0 5px 0 0;
				}
			</style>
			<div id="card">
				<h1 id="title" contenteditable>[{(title)}]</h1>
				<h3 id="subtitle" contenteditable>[{(subtitle)}]</h3>
				<div id="content" contenteditable>[{(content)}]</div>
				<div id="controls">
					<div id="delete-card-container" title="[{(delete-card)}]">
						<i id="delete-card" class="fas fa-times"></i>
					</div>
				</div>
			</div>
		`

		this.#card = this.shadowRoot.querySelector("#card")
		this.#content = this.shadowRoot.querySelector("#content")
		this.#subtitle = this.shadowRoot.querySelector("#subtitle")
		this.#title = this.shadowRoot.querySelector("#title")
		this.#controls = this.shadowRoot.querySelector("#controls")
		this.#deleteCard = this.#controls.querySelector("#delete-card-container")

		this.#deleteCard.addEventListener("click", () => {
			this.dispatchEvent(new CustomEvent("delete-card"))
		})

		this.#defaultColors.forEach(({ color, name }) => {
			const colorE = document.createElement("div")
			this.#controls.appendChild(colorE)
			colorE.outerHTML += `<div class="color" color="${color}" style="background-color: ${color}" title="${name}"></div>`
		})

		this.#controls.querySelectorAll(".color").forEach(color => {
			color.addEventListener("click", () => {
				this.backgroundColor = color.getAttribute("color")
			})
		})

		this.backgroundColor = this.#defaultColors[ Math.round(Math.random() * (this.#defaultColors.length - 1)) ].color

		this.dispatchEvent(new CustomEvent("ready"))

		this.#card.classList.add("animatable")
	}

	get backgroundColor() { return this.#backgroundColor }
	set backgroundColor(backgroundColor) {
		this.#backgroundColor = backgroundColor
		this.#card.style.setProperty("--background-color", backgroundColor)
		this.#card.style.setProperty("--color", Color.textColor(backgroundColor))
	}

	get title() { return this.#title.innerText }
	set title(title) { this.#title.innerText = title }

	get subtitle() { return this.#subtitle.innerText }
	set subtitle(subtitle) { this.#subtitle.innerText = subtitle }

	get content() { return this.#content.innerText }
	set content(content) { this.#content.innerText = content }

	toJSON(): ICard {
		return {
			backgroundColor: this.backgroundColor,
			content: this.content,
			subtitle: this.subtitle,
			title: this.title
		}
	}
}
window.customElements.define("i-card", Card)