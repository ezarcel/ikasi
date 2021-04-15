<img src="https://github.com/ezarcel/ikasi/raw/main/img/logo_with_text.png" alt="ikasi logo" width="200">
<br>

Open-source learning and planning toolkit.

# Features

## Feature-rich mind map editor

ikasi bundles a stunningly easy-to-use and performant mind map editor, featuring a quick and efficient exporting experience in addition to incredibly deep customizability.

## Decks of cards

This app also includes a creator of colored cards, to equitatively distribute the information.

## Auto-sorted to-do lists

In addition to everything mentioned before, ikasi also features a to-do list which smartly auto-sorts itself.

## An overall polished experience

With the latest and greatest of web technologies, ikasi brings a fast and light experience for everyone.

# Using the app

Once the app is opened, choose one out of four options, "Open", "New mind map", "New deck of cards", "New to-do list".

## General

To save the project you are currently working on, click `File → Save` at the menubar.

## Mind maps

- Double click on an empty space to create an unlinked/parent bubble.
- Click on a bubble to show its controls and edit the text.
- Drag from any corner while editing to resize the bubble.
- Press Ctrl + Return or click the "+" icon while editing a bubble to create a child.
- Click the "×" icon to delete the selected bubble.

## Decks of cards

- The first card is created automatically, to create a new one, click the "+" icon in the bottom right corner of the screen.
- To scroll through the different cards, scroll with two fingers horizontally in your trackpad, use the arrows or scrollbar at the bottom.
- To change the color of a card, hover over it and select the color from the list at the top.
- To add an image to a card, hover over it and click the image icon at the top, then, pick a file.
- To delete a card, hover over it and click the "×" icon at the top.

## To-do list

- To create a to-do, click the "+" icon at the bottom right corner of the screen.
- To edit a to-do's title or description, click them and type what you want.
- To change a to-do's due date or time, click the calendar or clock icons and choose when is the to-do due.
- To delete a to-do, click the trash icon at the right of every to-do

# Download

## For everyone

Go to [the latest release](https://github.com/ezarcel/ikasi/releases/latest) and download the file that fits your computer best.

## For developers

### Prerequisites

- `git`
- `node`
- `npm`

### Cloning and preparing the repository

```zsh
$ git clone https://github.com/ezarcel/ikasi
$ cd ikasi
$ npm i
```

### Getting the app running

```zsh
$ npm start
```

### Developing comfortably

(Run these in parallel).

```zsh
$ npm run watch:client-ts
$ npm run watch:sass
$ npm run watch:server-ts
$ npm run start:dev
```

### Prettifying translations

```zsh
$ npm run compile:server-ts
$ node ./js/translate.js
```

### Building a .exe file

```zsh
$ npm run build:windows-x64
```
