import { Titlebar, Color } from 'custom-electron-titlebar';
import { ipcRenderer, remote } from 'electron';
import { readFile, writeJSON } from 'fs-extra';
import p from 'path';
import puppeteer from 'puppeteer';
import Swal from 'sweetalert2';
import * as uuid from 'uuid';

const { addRecentsEntry } = require('./js/tools') as typeof import('./tools');

ipcRenderer.on('close', async () => {
  if (
    (
      await Swal.fire({
        allowEscapeKey: false,
        cancelButtonText: '[{(no)}]',
        confirmButtonText: '[{(yes)}]',
        focusCancel: true,
        showCancelButton: true,
        text: '[{(are-you-sure-you-want-to-quit)}]'
      })
    ).isConfirmed
  ) {
    window.clearInterval(intervalID);
    localStorage.removeItem(localStorageID);
    remote.getCurrentWindow().destroy();
  }
});
ipcRenderer.on('go-home', async () => {
  if (
    (
      await Swal.fire({
        allowEscapeKey: false,
        cancelButtonText: '[{(no)}]',
        confirmButtonText: '[{(yes)}]',
        focusCancel: true,
        showCancelButton: true,
        text: '[{(are-you-sure-you-want-to-go-home)}]'
      })
    ).isConfirmed
  ) {
    window.clearInterval(intervalID);
    localStorage.removeItem(localStorageID);
    location.href = './index.html';
  }
});

const localStorageID = new URL(location.href).searchParams.get('localStorageID');
var data: MindMapData = {
  bubbles: [],
  links: [],
  settings: {
    backgroundColor: '#ffffff',
    borderColor: '#43f0a9',
    borderWidth: 2,
    bubbleColor: '#ffffff',
    bubblePaddingSize: 10,
    exportingMargin: 0,
    fontColor: '#000000',
    fontFamily: '-apple-system, Arial',
    fontSize: 16,
    lineColor: '#000000',
    lineWidth: 1
  },
  ...JSON.parse(localStorage.getItem(localStorageID))
};
let intervalID: number;

const titlebar = new Titlebar({
  backgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex('#000000') : Color.fromHex('#ffffff'),
  itemBackgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex('#333333') : Color.fromHex('#cccccc'),
  icon: '../img/logo_without_text.png',
  shadow: false
});
ipcRenderer.on('colors-changed', () => {
  const darkMode = remote.nativeTheme.shouldUseDarkColors;
  titlebar.updateBackground(darkMode ? Color.fromHex('#000000') : Color.fromHex('#ffffff'));
  titlebar.updateItemBGColor(darkMode ? Color.fromHex('#222222') : Color.fromHex('#dddddd'));
});
titlebar.updateMenu(
  remote.Menu.buildFromTemplate([
    {
      accelerator: 'esc',
      click: (_, w) => w.webContents.send('go-home'),
      label: '[{(go-home)}]'
    },
    {
      label: '[{(file)}]',
      submenu: [
        {
          accelerator: 'Ctrl + S',
          click: save,
          label: '[{(save)}]'
        },
        {
          accelerator: 'Ctrl + Shift + S',
          click: saveAs,
          label: '[{(save-as)}]'
        }
      ]
    },
    {
      label: '[{(export-as)}]',
      submenu: [
        {
          click: () => exportAs('png'),
          label: '[{(export-as-png)}]'
        },
        {
          click: () => exportAs('jpeg'),
          label: '[{(export-as-jpeg)}]'
        },
        {
          click: () => exportAs('pdf'),
          label: '[{(export-as-pdf)}]'
        }
      ]
    },
    {
      click: settings,
      label: '[{(settings)}]'
    }
  ])
);
function updateTitle() {
  const url = new URL(location.href);
  document.title = `${p.basename(url.searchParams.get('path') || '[{(untitled)}]')} - [{(product-name)}] Mind Map`;
  titlebar.updateTitle();
}

async function save() {
  const url = new URL(location.href);
  const path = url.searchParams.get('path');
  if (!path) return saveAs();
  await writeJSON(path, data);
  await addRecentsEntry({ filename: path, timestamp: Date.now() });
}
async function saveAs() {
  const { canceled, filePath } = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
    defaultPath: '[{(untitled)}].imm',
    filters: [
      {
        name: 'ikasi Mind Map',
        extensions: ['imm']
      }
    ]
  });
  if (canceled) return;

  const url = new URL(location.href);
  url.searchParams.set('path', filePath);
  history.pushState('', '', url.href);
  updateTitle();

  save();
}
async function exportAs(format: MindMapExportingFormat) {
  const clip: puppeteer.BoundingBox = { height: 0, width: 0, x: 0, y: 0 };
  const allBubbles = [...document.querySelectorAll('map-bubble')] as Bubble[];
  clip.x = Math.min(...allBubbles.map(b => b.x));
  clip.y = Math.min(...allBubbles.map(b => b.y));
  clip.width = Math.max(...allBubbles.map(b => b.width + b.x)) - clip.x + data.settings.exportingMargin * 2;
  clip.height = Math.max(...allBubbles.map(b => b.height + b.y)) - clip.y + data.settings.exportingMargin * 2;

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1.5 },
    dumpio: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins', '--disable-site-isolation-trials']
  });
  const page = await browser.newPage();
  await page.goto(
    location.pathname.slice(navigator.platform === 'Win32' ? 1 : 0, location.pathname.lastIndexOf('/')) +
      '/mind-map-exporter.html'
  );
  await page.evaluate(mm => localStorage.setItem('screenshot', mm), JSON.stringify(data));
  await page.reload();
  await page.waitForSelector('.finish-element');

  const out =
    format === 'pdf'
      ? await page.pdf({ format: 'a4', landscape: true })
      : ((await page.screenshot({
          clip,
          encoding: 'base64',
          type: format,
          ...(format === 'jpeg' ? { quality: 95 } : {})
        })) as string | Buffer);
  await browser.close();

  const a = document.createElement('a');
  a.download = `${p.basename(p.basename(new URL(location.href).searchParams.get('path') || '[{(untitled)}]'))}.${format}`;
  if (format === 'pdf') a.href = `data:application/pdf;base64,${out.toString('base64')}`;
  else a.href = `data:image/${format};base64,${out}`;
  a.click();
}
async function settings() {
  const $i = (selector: string) => document.querySelector('#settings-inner ' + selector) as HTMLInputElement;

  const $s = (selector: string) => document.querySelector('#settings-inner ' + selector) as HTMLSpanElement;

  const { isConfirmed, value } = await Swal.fire({
    html: `
			<div id="settings-inner">
				<fieldset id="background">
					<legend>[{(background)}]</legend>
					<div class="color">
						<span>[{(color)}]</span>
						<input type="color">
					</div>
				</fieldset>

				<fieldset id="border">
					<legend>[{(border)}]</legend>
					<div class="color">
						<span>[{(color)}]</span>
						<input type="color">
					</div>
					<div class="width">
						<span>[{(width)}]</span>
						<span class="range-value"></span>
						<input type="range" min=0 max=10 oninput="this.previousElementSibling.textContent = this.value + 'px'">
					</div>
				</fieldset>

				<fieldset id="bubble">
					<legend>[{(bubble)}]</legend>
					<div class="color">
						<span>[{(color)}]</span>
						<input type="color">
					</div>
					<div class="padding-size">
						<span>[{(padding-size)}]</span>
						<span class="range-value"></span>
						<input type="range" min=10 max=25 oninput="this.previousElementSibling.textContent = this.value + 'px'">
					</div>
				</fieldset>

				<fieldset id="exporting">
					<legend>[{(exporting)}]</legend>
					<div class="margin">
						<span>[{(margin)}]</span>
						<span class="range-value"></span>
						<input type="range" min=0 max=25 step=1 oninput="this.previousElementSibling.textContent = this.value + 'px'">
					</div>
				</fieldset>

				<fieldset id="font-and-text">
					<legend>[{(font-&-text)}]</legend>
					<div class="color">
						<span>[{(color)}]</span>
						<input type="color">
					</div>
					<div class="family">
						<span>[{(family)}]</span>
						<input type="text" placeholder="Arial, Calibri">
					</div>
					<div class="size">
						<span>[{(size)}]</span>
						<span class="range-value"></span>
						<input type="range" min=8 max=32 oninput="this.previousElementSibling.textContent = this.value + 'px'">
					</div>
				</fieldset>

				<fieldset id="line">
					<legend>[{(line)}]</legend>
					<div class="color">
						<span>[{(color)}]</span>
						<input type="color">
					</div>
					<div class="width">
						<span>[{(width)}]</span>
						<span class="range-value"></span>
						<input type="range" id="settings-border-size" min=1 max=15 oninput="this.previousElementSibling.textContent = this.value + 'px'">
					</div>
				</fieldset>
			</div>
		`,
    titleText: '[{(settings)}]',
    confirmButtonText: '[{(ok)}]',
    cancelButtonText: '[{(cancel)}]',
    showCancelButton: true,
    preConfirm: (): MindMapSettings => ({
      backgroundColor: $i('#background .color input').value,
      borderColor: $i('#border .color input').value,
      borderWidth: $i('#border .width input').valueAsNumber,
      bubbleColor: $i('#bubble .color input').value,
      bubblePaddingSize: $i('#bubble .padding-size input').valueAsNumber,
      exportingMargin: $i('#exporting .margin input').valueAsNumber,
      fontColor: $i('#font-and-text .color input').value,
      fontFamily: $i('#font-and-text .family input').value,
      fontSize: $i('#font-and-text .size input').valueAsNumber,
      lineColor: $i('#line .color input').value,
      lineWidth: $i('#line .width input').valueAsNumber
    }),
    didOpen: () => {
      $i('#background .color input').value = data.settings.backgroundColor;
      $i('#border .color input').value = data.settings.borderColor;

      $s('#border .width span.range-value').textContent = `${data.settings.borderWidth}px`;
      $i('#border .width input').valueAsNumber = data.settings.borderWidth;

      $s('#exporting .margin span.range-value').textContent = `${data.settings.exportingMargin}px`;
      $i('#exporting .margin input').valueAsNumber = data.settings.exportingMargin;

      $i('#bubble .color input').value = data.settings.bubbleColor;

      $s('#bubble .padding-size span.range-value').textContent = `${data.settings.bubblePaddingSize}px`;
      $i('#bubble .padding-size input').valueAsNumber = data.settings.bubblePaddingSize;

      $i('#font-and-text .color input').value = data.settings.fontColor;

      $i('#font-and-text .family input').value = data.settings.fontFamily;

      $s('#font-and-text .size span.range-value').textContent = `${data.settings.fontSize}px`;
      $i('#font-and-text .size input').valueAsNumber = data.settings.fontSize;

      $i('#line .color input').value = data.settings.lineColor;

      $s('#line .width span.range-value').textContent = `${data.settings.lineWidth}px`;
      $i('#line .width input').valueAsNumber = data.settings.lineWidth;
    }
  });
  if (isConfirmed) {
    data.settings = value;
    updateStyling();
  }
}

function calcJoints(e1: HTMLElement, e2: HTMLElement): { width: number; height: number; innerHTML: string } {
  const [x1, y1] = [e1.offsetWidth / 2 + e1.offsetLeft, e1.offsetHeight / 2 + e1.offsetTop];
  const [x2, y2] = [e2.offsetWidth / 2 + e2.offsetLeft, e2.offsetHeight / 2 + e2.offsetTop];
  return {
    height: Math.max(y1, y2) + data.settings.lineWidth,
    width: Math.max(x1, x2) + data.settings.lineWidth,
    innerHTML: `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${data.settings.lineColor}" stroke-width="${data.settings.lineWidth}"></line>`
  };
}
function joinNew(id1: string, id2: string, i: number) {
  const [e1, e2] = [document.getElementById(id1), document.getElementById(id2)];
  const { width, height, innerHTML } = calcJoints(e1, e2);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('joining-line');
  svg.innerHTML = innerHTML;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.setAttribute('from', id1);
  svg.setAttribute('to', id2);
  svg.setAttribute('i', `${i}`);
  document.querySelector('#container').append(svg);
}
function joinAll() {
  const lines = document.querySelectorAll('.joining-line');
  let i: number;
  for (i = 0; i < lines.length; i++) {
    if (data.links.length === i) break;
    const link = data.links[i];
    const l = lines[i] as SVGElement;
    const joints = calcJoints(...(link.map(e => document.getElementById(e)) as [HTMLElement, HTMLElement]));
    l.style.width = `${joints.width}px`;
    l.style.height = `${joints.height}px`;
    l.innerHTML = joints.innerHTML;
    l.setAttribute('from', link[0]);
    l.setAttribute('to', link[1]);
    l.setAttribute('i', i.toString());
  }
  if (lines.length === data.links.length) return;
  else if (lines.length < data.links.length) for (i = i; i < data.links.length; i++) joinNew(...data.links[i], i);
  else for (i = i; i < lines.length; i++) lines[i].remove();
}
function rejoinAll() {
  document.querySelectorAll('svg.joining-line').forEach(e => e.remove());
  joinAll();
}
function rejoinMe(id: string) {
  let indexes = data.links.map((e, i) => (e.includes(id) ? i : -1)).filter(e => e !== -1);
  document.querySelectorAll(`svg.joining-line[from="${id}"], svg.joining-line[to="${id}"]`).forEach((l: HTMLElement) => {
    const i = parseInt(l.getAttribute('i'));
    const link = data.links[i];
    const joints = calcJoints(...(link.map(e => document.getElementById(e)) as [HTMLElement, HTMLElement]));
    l.innerHTML = joints.innerHTML;
    l.style.height = `${joints.height}px`;
    l.style.width = `${joints.width}px`;
    indexes = indexes.filter(e => e !== i);
  });
  indexes.forEach(i => joinNew(...data.links[i], i));
}
function newBubble({ clientX: mouseX, clientY: mouseY }: MouseEvent) {
  const bubbleE = document.createElement('map-bubble') as Bubble;
  addListeners(bubbleE);
  updateBubble(bubbleE);
  bubbleE.addEventListener('ready', () => {
    bubbleE.id = uuid.v4();
    bubbleE.x = mouseX - bubbleE.width / 2;
    bubbleE.y = mouseY - bubbleE.height / 2;
    bubbleE.dispatchEvent(new CustomEvent('update-data'));
    setTimeout(() => bubbleE.edit(), 0);
  });
  document.querySelector('#container').appendChild(bubbleE);
}
function addListeners(bubble: Bubble) {
  bubble.addEventListener('add-image', async () => {
    const { canceled, filePaths } = await remote.dialog.showOpenDialog({
      filters: [
        {
          name: '[{(file-format.images)}]',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif']
        }
      ]
    });
    if (!canceled)
      bubble.image = {
        base64Image: await readFile(filePaths[0], 'base64'),
        format: p.extname(filePaths[0]).slice(1) as MindMapImageFormat
      };
  });
  bubble.addEventListener('delete', async () => {
    if (
      (
        await Swal.fire({
          allowEscapeKey: false,
          cancelButtonText: '[{(no)}]',
          confirmButtonText: '[{(yes)}]',
          focusCancel: true,
          showCancelButton: true,
          text: '[{(are-you-sure-you-want-to-delete-this-bubble)}]'
        })
      ).isConfirmed
    )
      bubble.delete();
  });
  bubble.addEventListener('delete-me', () => {
    data.bubbles = data.bubbles.filter(e => e.id !== bubble.id);
    data.links = data.links.filter(e => !e.includes(bubble.id));
    joinAll();
  });
  bubble.addEventListener('new-child', () => {
    const child = document.createElement('map-bubble') as Bubble;
    addListeners(child);
    updateBubble(child);
    child.addEventListener('ready', () => {
      child.id = uuid.v4();
      child.x = bubble.x + bubble.width + 10;
      child.y = bubble.y;
      data.links.push([bubble.id, child.id]);
      child.dispatchEvent(new CustomEvent('update-data'));
      child.dispatchEvent(new CustomEvent('rejoin-me'));
      child.edit();
    });
    document.querySelector('#container').appendChild(child);
  });
  bubble.addEventListener('rejoin-me', () => rejoinMe(bubble.id));
  bubble.addEventListener('remove-image', async () => {
    if (
      (
        await Swal.fire({
          allowEscapeKey: false,
          cancelButtonText: '[{(no)}]',
          confirmButtonText: '[{(yes)}]',
          focusCancel: true,
          showCancelButton: true,
          text: "[{(are-you-sure-you-want-to-delete-this-bubble's-image)}]"
        })
      ).isConfirmed
    )
      bubble.image = null;
  });
  bubble.addEventListener('update-data', () => {
    if (data.bubbles.some(b => bubble.id === b.id))
      data.bubbles = data.bubbles.map(b => (bubble.id === b.id ? bubble.toJSON() : b));
    else data.bubbles.push(bubble.toJSON());
  });
}
function updateStyling() {
  updateAllBubbles();
  document.body.style.backgroundColor = data.settings.backgroundColor;
  rejoinAll();
}
const updateBubble = (bubble: Bubble) => bubble.update(data.settings as any);

const updateAllBubbles = () => ([...document.querySelectorAll('map-bubble')] as Bubble[]).forEach(updateBubble);

window.addEventListener('load', () => {
  updateTitle();
  data.bubbles.forEach(bubble => {
    const bubbleE = document.createElement('map-bubble') as Bubble;
    addListeners(bubbleE);
    document.querySelector('#container').appendChild(bubbleE);
    Object.assign(bubbleE, bubble);
  });
  updateStyling();

  intervalID = window.setInterval(() => localStorage.setItem(localStorageID, JSON.stringify(data)), 50);
});
window.addEventListener('dblclick', (e: MouseEvent) =>
  !e.composedPath().some(f => (f as Element).nodeName === 'MAP-BUBBLE') ? newBubble(e) : null
);
