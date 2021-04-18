class ToDo extends HTMLElement implements IToDo {
  #ready: boolean = false;

  #toDo: HTMLDivElement;
  #title: HTMLElement;
  #description: HTMLElement;
  #checkbox: HTMLInputElement;
  #delete: HTMLInputElement;
  #date: HTMLInputElement;
  #time: HTMLInputElement;
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `
			<link rel="stylesheet" href="https://kit-pro.fontawesome.com/releases/latest/css/pro.min.css">
			<style>
				* {
					box-sizing: border-box;
					outline: none;
					user-select: none;
				}
				:host {
					display: block;
				}
				
				:host, input {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif
				}

				#checkbox {
					display: none;
				}

				#to-do {
					display: flex;
					flex-direction: row;
					background-color: var(--bg-shade2);
					color: var(--bg-alt);
					border-radius: 7.5px;
					overflow: hidden;
				}
				#to-do:hover {
					background-color: var(--bg-shade3);
				}
				#to-do:focus,
				#to-do:active {
					background-color: var(--bg-shade3);
				}
				#to-do.animatable {
					transition: background-color .1s;
				}
				
				#info {
					display: flex;
					flex-direction: column;
					place-items: center;
					justify-content: center;
					padding: 7.5px 7.5px 7.5px 0;
				}

				#info,
				#info > * {
					width: 100%;
				}
				
				#checkbox-label,
				#delete {
					width: 55px;
					height: 55px;
					flex: 0 0 auto;
					position: relative;
				}

				#description {
					font-size: 14px;
					color: var(--bg-alt-shade5);
  					text-decoration-color: red;
				}

				#circle,
				#check,
				#delete i {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%)
				}

				#check {
					font-size: 12px;
					color: var(--bg-shade2);
				}
				#to-do:hover #check {
					color: var(--bg-shade3);
				}
				:is(#to-do:focus, #to-do:active) #check {
					color: var(--bg-shade4);
				}

				#checkbox:checked + #checkbox-label > #circle > circle {
					fill: var(--bg-alt);
				}
				#checkbox:not(:checked) + #checkbox-label > #check {
					display: none;
				}

				#checkbox:checked + #checkbox-label + #info {
					text-decoration: line-through;
				}

				#datetime {
					display: flex;
					flex-direction: column;
					place-content: center;
				}
				#datetime input {
					background: none;
					border: 0;
					padding: 0;
					font-size: 14px;
					text-align: right;
					color: var(--bg-alt);
				}

				@media (prefers-color-scheme: dark) {
					::-webkit-calendar-picker-indicator {
						filter: invert(1);
					}
				}
				::-webkit-calendar-picker-indicator {
					margin: 0;
					padding: 0 0 0 5px;
				}
				#time::-webkit-calendar-picker-indicator {
					font-size: 16px;
				}

				#delete {
					cursor: pointer;
				}
			</style>
			<div id="to-do">
				<input type="checkbox" id="checkbox">
				<label id="checkbox-label" for="checkbox">
					<svg id="circle" height="22.5" width="22.5">
						<circle cx="50%" cy="50%" r="45%" stroke="var(--bg-alt)" stroke-width="2" fill="transparent"></circle>
					</svg>
					<i id="check" class="fas fa-check"></i>
				</label>
				<div id="info">
					<b id="title" contenteditable>[{(title)}]</b>
					<span id="description" contenteditable>[{(description)}]</span>
				</div>
				<div id="datetime">
					<input type="date" id="date">
					<input type="time" id="time">
				</div>
				<div id="delete" title="[{(delete-to-do)}]">
					<i class="fas fa-trash"></i>
				</div>
			</div>
		`;

    this.#toDo = this.shadowRoot.querySelector("#to-do");
    this.#title = this.shadowRoot.querySelector("#title");
    this.#description = this.shadowRoot.querySelector("#description");
    this.#checkbox = this.shadowRoot.querySelector("#checkbox");
    this.#delete = this.shadowRoot.querySelector("#delete");
    this.#date = this.shadowRoot.querySelector("#date");
    this.#time = this.shadowRoot.querySelector("#time");

    this.addEventListener("blur", () => {
      this.dispatchEvent(new CustomEvent("edited"));
    });
    this.#checkbox.addEventListener("input", () => {
      this.dispatchEvent(new CustomEvent("edited"));
    });

    this.#delete.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("delete"));
    });
  }
  connectedCallback() {
    if (!this.#ready) {
      this.#ready = true;
      this.dispatchEvent(new CustomEvent("ready"));
    }

    this.#toDo.classList.add("animatable");
  }

  get description() {
    return this.#description.innerText;
  }
  set description(description) {
    this.#description.innerText = description;
  }

  get done() {
    return this.#checkbox.checked;
  }
  set done(done) {
    this.#checkbox.checked = done;
  }

  get dueDate() {
    return this.#date.valueAsNumber || null;
  }
  set dueDate(dueDate) {
    this.#date.valueAsNumber = dueDate;
  }

  get dueTime() {
    return this.#time.valueAsNumber || null;
  }
  set dueTime(dueDate) {
    this.#time.valueAsNumber = dueDate;
  }

  get title() {
    return this.#title.innerText;
  }
  set title(title) {
    this.#title.innerText = title;
  }

  toJSON(): IToDo {
    return {
      description: this.description,
      dueDate: this.dueDate,
      dueTime: this.dueTime,
      done: this.done,
      title: this.title
    };
  }
}
window.customElements.define("to-do", ToDo);
