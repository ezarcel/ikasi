import { Titlebar, Color } from 'custom-electron-titlebar';
import { ipcRenderer, remote } from 'electron';
import { existsSync, readFile, readJSON, writeJSON } from 'fs-extra';
import moment from 'moment';
import Swal from 'sweetalert2';
import p from 'path';
import { v4 } from 'uuid';

const { addRecentsEntry } = require('./js/tools') as typeof import('./tools');

ipcRenderer.on('close', () => remote.getCurrentWindow().destroy());

const titlebar = new Titlebar({
  backgroundColor: remote.nativeTheme.shouldUseDarkColors
    ? Color.fromHex('#000000')
    : Color.fromHex('#ffffff'),
  itemBackgroundColor: remote.nativeTheme.shouldUseDarkColors
    ? Color.fromHex('#333333')
    : Color.fromHex('#cccccc'),
  icon: '../img/logo_without_text.png',
  shadow: false
});
ipcRenderer.on('colors-changed', () => {
  const darkMode = remote.nativeTheme.shouldUseDarkColors;
  titlebar.updateBackground(
    darkMode ? Color.fromHex('#000000') : Color.fromHex('#ffffff')
  );
  titlebar.updateItemBGColor(
    darkMode ? Color.fromHex('#222222') : Color.fromHex('#dddddd')
  );
});
titlebar.updateMenu(remote.Menu.buildFromTemplate([]));

async function openFile(path: string): Promise<void> {
  if (!existsSync(path))
    return void Swal.fire({
      confirmButtonText: '[{(ok)}]',
      icon: 'error',
      text: '[{(that-file-no-longer-exists)}]'
    });

  await addRecentsEntry({
    filename: path,
    timestamp: Date.now()
  });

  const contents = await readFile(path, 'utf8');

  const id = v4();
  localStorage.setItem(id, contents);

  switch (p.extname(path)) {
    case '.imm':
      location.href = `./mind-map-editor.html?localStorageID=${id}&path=${path}`;
      break;

    case '.idoc':
      location.href = `./deck-of-cards-editor.html?localStorageID=${id}&path=${path}`;
      break;

    case '.itl':
      location.href = `./to-do-list-editor.html?localStorageID=${id}&path=${path}`;
      break;

    default:
      break;
  }
}

window.addEventListener('load', async () => {
  if (
    !existsSync('./recents.json') ||
    (await readFile('./recents.json', 'utf8')) === ''
  )
    writeJSON('./recents.json', []);

  const fileListE = document.querySelector('#file-list') as HTMLDivElement;
  const recents = (await readJSON('./recents.json')) as RecentsEntry[];

  const fileTypes: { [key: string]: string } = {
    '.imm': '[{(mind-map)}]',
    '.idoc': '[{(deck-of-cards)}]',
    '.itl': '[{(to-do-list)}]'
  };
  const fileIcons: { [key: string]: string } = {
    '.imm': 'mind_map',
    '.idoc': 'deck_of_cards',
    '.itl': 'to-do_list'
  };

  fileListE.innerHTML = '';
  recents.forEach(({ filename, timestamp }) => {
    fileListE.innerHTML += `
			<div class="file" title="${filename}">
				<img src="../img/icons/${
          fileIcons[p.extname(filename)] || 'unknown'
        }_file.png" alt="file icon">
				<div class="info">
					<span class="name">${p.parse(filename).base}</span>
					<span class="description">${moment(timestamp)
            .locale(navigator.language)
            .fromNow()} | ${
      fileTypes[p.extname(filename)] || '[{(unknown)}]'
    }</span>
				</div>
			</div>`;
  });

  fileListE.addEventListener('click', e => {
    const file = (e.composedPath() as HTMLElement[]).find(e =>
      e?.classList?.contains('file')
    );
    if (!file) return;
    openFile(file.getAttribute('title'));
  });

  document.querySelector('.option.open').addEventListener('click', async () => {
    const { canceled, filePaths } = await remote.dialog.showOpenDialog({
      filters: [
        {
          name: '[{(file-format.all-ikasi-files)}]',
          extensions: ['imm', 'idoc', 'itl']
        },
        {
          name: '[{(file-format.ikasi-mind-map)}]',
          extensions: ['imm']
        },
        {
          name: '[{(file-format.ikasi-deck-of-cards)}]',
          extensions: ['idoc']
        },
        {
          name: '[{(file-format.ikasi-to-do-list)}]',
          extensions: ['itl']
        }
      ]
    });
    if (!canceled) openFile(filePaths[0]);
  });
  document
    .querySelector('.option.new.new-mind-map')
    .addEventListener('click', () => {
      const id = v4();
      localStorage.setItem(id, JSON.stringify({}));
      location.href = `./mind-map-editor.html?localStorageID=${id}`;
    });
  document
    .querySelector('.option.new.new-deck-of-cards')
    .addEventListener('click', () => {
      const id = v4();
      localStorage.setItem(id, JSON.stringify({ cards: [] } as DOCData));
      location.href = `./deck-of-cards-editor.html?localStorageID=${id}`;
    });
  document
    .querySelector('.option.new.new-to-do-list')
    .addEventListener('click', () => {
      const id = v4();
      localStorage.setItem(id, JSON.stringify({ todos: [] } as ToDoData));
      location.href = `./to-do-list-editor.html?localStorageID=${id}`;
    });
});
