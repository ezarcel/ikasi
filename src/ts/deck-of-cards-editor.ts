import { Titlebar, Color } from "custom-electron-titlebar";
import { ipcRenderer, remote } from "electron";
import { readFile, writeJSON } from "fs-extra";
import p from "path";
import Swal from "sweetalert2";

const { addRecentsEntry } = require("./js/tools") as typeof import("./tools");

ipcRenderer.on("save", () => save());
ipcRenderer.on("save-as", () => saveAs());
ipcRenderer.on("close", async () => {
  if (
    (
      await Swal.fire({
        allowEscapeKey: false,
        cancelButtonText: "[{(no)}]",
        confirmButtonText: "[{(yes)}]",
        focusCancel: true,
        showCancelButton: true,
        text: "[{(are-you-sure-you-want-to-quit)}]"
      })
    ).isConfirmed
  ) {
    window.clearInterval(intervalID);
    localStorage.removeItem(localStorageID);
    remote.getCurrentWindow().destroy();
  }
});
ipcRenderer.on("go-home", async () => {
  if (
    (
      await Swal.fire({
        allowEscapeKey: false,
        cancelButtonText: "[{(no)}]",
        confirmButtonText: "[{(yes)}]",
        focusCancel: true,
        showCancelButton: true,
        text: "[{(are-you-sure-you-want-to-go-home)}]"
      })
    ).isConfirmed
  ) {
    window.clearInterval(intervalID);
    localStorage.removeItem(localStorageID);
    location.href = "./index.html";
  }
});

const localStorageID = new URL(location.href).searchParams.get("localStorageID");
let data: DOCData = { cards: [] };
let intervalID: number;

const titlebar = new Titlebar({
  backgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex("#000000") : Color.fromHex("#ffffff"),
  itemBackgroundColor: remote.nativeTheme.shouldUseDarkColors ? Color.fromHex("#333333") : Color.fromHex("#cccccc"),
  icon: "../img/logo_without_text.png",
  shadow: false
});
ipcRenderer.on("colors-changed", () => {
  const darkMode = remote.nativeTheme.shouldUseDarkColors;
  titlebar.updateBackground(darkMode ? Color.fromHex("#000000") : Color.fromHex("#ffffff"));
  titlebar.updateItemBGColor(darkMode ? Color.fromHex("#222222") : Color.fromHex("#dddddd"));
});
titlebar.updateMenu(
  remote.Menu.buildFromTemplate([
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
  ])
);
function updateTitle() {
  const url = new URL(location.href);
  document.title = `${p.basename(url.searchParams.get("path") || "[{(untitled)}]")} - [{(product-name)}] Deck of cards`;
  titlebar.updateTitle();
}

async function save() {
  const url = new URL(location.href);
  const path = url.searchParams.get("path");
  if (!path) return saveAs();
  await writeJSON(path, data);
  await addRecentsEntry({ filename: path, timestamp: Date.now() });
}
async function saveAs() {
  const { canceled, filePath } = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
    defaultPath: "[{(untitled)}].idoc",
    filters: [
      {
        name: "ikasi Deck Of Cards",
        extensions: ["idoc"]
      }
    ]
  });
  if (canceled) return;

  const url = new URL(location.href);
  url.searchParams.set("path", filePath);
  history.pushState("", "", url.href);
  updateTitle();

  save();
}
function newCard() {
  const cardContainer = document.createElement("div");
  document.querySelector("#container").appendChild(cardContainer);
  cardContainer.classList.add("card-container");

  const card = document.createElement("i-card") as Card;
  addListeners(card);
  cardContainer.appendChild(card);

  card.scrollIntoView();
  updatePageIndicator();
}
function updatePageIndicator() {
  const pageIndicator = document.querySelector("#page-indicator");
  const cards = [...document.querySelectorAll(".card-container")];
  pageIndicator.textContent = `${cards.indexOf(getVisibleCard()) + 1} / ${cards.length}`;
}
function getVisibleCard() {
  const cards = [...document.querySelectorAll(".card-container")] as Card[];
  const diffs = cards.map(e => Math.abs(e.getBoundingClientRect().left));
  const minimum = Math.min(...diffs);
  return cards[diffs.indexOf(minimum)];
}
function addListeners(card: Card) {
  card.addEventListener("add-image", async () => {
    const { canceled, filePaths } = await remote.dialog.showOpenDialog({
      filters: [
        {
          name: "[{(file-format.images)}]",
          extensions: ["png", "jpg", "jpeg", "gif", "webp", "avif"]
        }
      ]
    });
    if (!canceled)
      card.image = {
        base64Image: await readFile(filePaths[0], "base64"),
        format: p.extname(filePaths[0]).slice(1) as MindMapImageFormat
      };
  });
  card.addEventListener("delete-card", async () => {
    if (
      (
        await Swal.fire({
          allowEscapeKey: false,
          cancelButtonText: "[{(no)}]",
          confirmButtonText: "[{(yes)}]",
          focusCancel: true,
          showCancelButton: true,
          text: "[{(are-you-sure-you-want-to-delete-this-card)}]"
        })
      ).isConfirmed
    ) {
      card.closest(".card-container").remove();
      updatePageIndicator();
    }
  });
}

window.addEventListener("load", () => {
  if (localStorage.getItem(localStorageID) !== null) data = JSON.parse(localStorage.getItem(localStorageID));

  updateTitle();

  if (data.cards.length === 0) newCard();
  else
    data.cards.forEach(({ backgroundColor, content, image, subtitle, title }) => {
      const cardContainer = document.createElement("div");
      document.querySelector("#container").appendChild(cardContainer);
      cardContainer.classList.add("card-container");

      const card = document.createElement("i-card") as Card;
      addListeners(card);
      card.addEventListener("ready", () => {
        card.backgroundColor = backgroundColor;
        card.content = content;
        card.image = image;
        card.subtitle = subtitle;
        card.title = title;
      });
      cardContainer.appendChild(card);

      updatePageIndicator();
    });

  document.querySelector("#container").addEventListener("scroll", updatePageIndicator);

  document.querySelector("#page-left").addEventListener("click", () => {
    getVisibleCard()?.previousElementSibling?.scrollIntoView?.();
  });
  document.querySelector("#page-right").addEventListener("click", () => {
    getVisibleCard()?.nextElementSibling?.scrollIntoView?.();
  });

  document.querySelector("#new-card").addEventListener("click", () => {
    newCard();
  });

  intervalID = window.setInterval(() => {
    data = {
      ...data,
      cards: ([...document.querySelectorAll("i-card")] as Card[]).map(e => e.toJSON())
    };
    localStorage.setItem(localStorageID, JSON.stringify(data));
  }, 10);
});
