const { Color } = require("./js/tools") as typeof import("../tools");

class Card extends HTMLElement {
  #animationDuration = (1 / 3) * 1000;

  #backgroundColor: string;
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
  ];
  #foldRatio = 0.075;
  #image: ikasiImage;

  #addImage: HTMLDivElement;
  #card: HTMLDivElement;
  #title: HTMLElement;
  #subtitle: HTMLElement;
  #content: HTMLDivElement;
  #img: HTMLImageElement;
  #controls: HTMLDivElement;
  #deleteCard: HTMLDivElement;
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
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif
				}

				::-webkit-scrollbar {
					width: 7.5px;
					height: 7.5px;
				}

				::-webkit-scrollbar-track {
					background-color: var(--bg-alpha5);
					border-radius: 3.25px;
				}

				::-webkit-scrollbar-thumb {
					background-color: var(--bg-alpha10);
					border-radius: 3.25px;
				}

				::-webkit-scrollbar-thumb:hover,
				::-webkit-scrollbar-thumb:focus {
					background-color: var(--bg-alpha25);
				}

				::-webkit-scrollbar-thumb:active {
					background-color: var(--bg-alpha50);
				}

				#card {
					background-color: var(--background-color);
					color: var(--color);
					display: flex;
					flex-direction: column;
					padding: 20px;
					position: relative;
					width: 100%;
					height: 100%;
				}
				#card::after {
					background: linear-gradient(to top right, var(--fold-color) 50%, var(--bg-shade1) 50%);
					content: '';
					height: ${this.#foldRatio * 100}%;
					position: absolute;
					right: 0;
					top: 0;
					width: ${this.#foldRatio * 100}%;
					transition: --fold-color ${this.#animationDuration}ms;
				}
				#card.animatable {
					transition:
						background-color ${this.#animationDuration}ms,
						color ${this.#animationDuration}ms,
						--fold-color ${this.#animationDuration}ms;
				}
				#card:is(:hover, :focus-within) > #bottom > #content {
					margin-bottom: 42.5px;
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
				
				#bottom, #content {
					height: 100%;
				}
				
				#bottom {
					overflow: hidden;
					display: flex;
					flex-direction: row;
				}
				
				#bottom > img {
					width: max-content;
					max-width: 32.5vw;
					height: max-content;
					max-height: 100%;
					margin: auto;
				}
				
				#content {
					overflow: auto;
					width: 100%;
					height: 100%;
					margin-right: 12.5px;
				}
				
				#controls {
					border-radius: 7.5px 7.5px 0 0;
					overflow: auto;
					padding: 10px;
					position: absolute;
					left: 0;
					top: 0;
					width: min-content;
					max-width: calc(75vw * (1 - ${this.#foldRatio}));
					transform: translateY(-100%);
					background-color: var(--background-color);
					transition: background-color ${this.#animationDuration}ms;
				}

				#controls-wrapper {
					display: grid;
					grid-auto-flow: column;
					gap: 10px;
				}
				
				#controls-wrapper > * {
					display: inline-block;
					border: solid .25px #0004;
					cursor: pointer;
					border-radius: 5px;
					flex: 0 0 auto;
				}

				#add-image-container,
				#delete-card-container,
				#controls .color {
					height: 27.5px;
					width: 27.5px;
				}

				#add-image-container,
				#delete-card-container {
					display: flex;
					place-items: center;
					justify-content: center;
				}
			</style>
			<div id="card">
				<h1 id="title" contenteditable>[{(title)}]</h1>
				<h3 id="subtitle" contenteditable>[{(subtitle)}]</h3>
				<div id="bottom">
					<div id="content" contenteditable>[{(content)}]</div>
					<img onload="this.style.display = 'block'" onerror="this.style.display = 'none'">
				</div>
				<div id="controls">
					<div id="controls-wrapper">
						<div id="delete-card-container" title="[{(delete-card)}]">
							<i class="fas fa-times"></i>
						</div>
						<div id="add-image-container" title="[{(add-image)}]">
							<i class="fas fa-image"></i>
						</div>
					</div>
				</div>
			</div>
		`;

    this.#card = this.shadowRoot.querySelector("#card");
    this.#controls = this.#card.querySelector("#controls-wrapper");

    this.#addImage = this.#controls.querySelector("#add-image-container");
    this.#content = this.#card.querySelector("#content");
    this.#deleteCard = this.#controls.querySelector("#delete-card-container");
    this.#img = this.#card.querySelector("img");
    this.#subtitle = this.#card.querySelector("#subtitle");
    this.#title = this.#card.querySelector("#title");

    this.#addImage.addEventListener("click", () => this.dispatchEvent(new CustomEvent("add-image")));
    this.#defaultColors.forEach(({ color, name }) => {
      const colorE = document.createElement("div");
      this.#controls.appendChild(colorE);
      colorE.classList.add("color");
      colorE.setAttribute("color", color);
      colorE.style.backgroundColor = color;
      colorE.title = `${name} (${color})`;
      colorE.addEventListener("click", () => {
        this.backgroundColor = colorE.getAttribute("color");
      });
    });
    this.#deleteCard.addEventListener("click", () => this.dispatchEvent(new CustomEvent("delete-card")));
    this.#img.addEventListener("click", () => this.dispatchEvent(new CustomEvent("remove-image")));

    this.backgroundColor = this.#defaultColors[Math.round(Math.random() * (this.#defaultColors.length - 1))].color;

    this.dispatchEvent(new CustomEvent("ready"));
    this.#card.classList.add("animatable");
  }

  get backgroundColor() {
    return this.#backgroundColor;
  }
  set backgroundColor(backgroundColor) {
    const textColor = Color.textColor(backgroundColor);
    this.#backgroundColor = backgroundColor;
    this.#card.style.setProperty("--background-color", backgroundColor);
    this.#card.style.setProperty("--fold-color", Color.brighten(backgroundColor, textColor === "#000000" ? -34 : 34));
    this.#card.style.setProperty("--color", textColor);
  }

  get image() {
    return this.#image;
  }
  set image(image: ikasiImage | null) {
    if (image) {
      this.#img.src = `data:image/${image.format.replace("jpg", "jpeg")};base64,${image.base64Image}`;
      this.#image = image;
    } else {
      this.#img.src = "";
      this.#image = null;
    }
  }

  get title() {
    return this.#title.innerText;
  }
  set title(title) {
    this.#title.innerText = title;
  }

  get subtitle() {
    return this.#subtitle.innerText;
  }
  set subtitle(subtitle) {
    this.#subtitle.innerText = subtitle;
  }

  get content() {
    return this.#content.innerText;
  }
  set content(content) {
    this.#content.innerText = content;
  }

  toJSON(): ICard {
    return {
      backgroundColor: this.backgroundColor,
      content: this.content,
      image: this.image,
      subtitle: this.subtitle,
      title: this.title
    };
  }
}
window.customElements.define("i-card", Card);
