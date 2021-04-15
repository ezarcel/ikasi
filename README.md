<center>
  <img src="https://github.com/ezarcel/ikasi/raw/main/img/logo_with_text.png" alt="drawing" width="200">
</center>
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

# Download

## For everyone

Go to [the latest release](https://github.com/ezarcel/ikasi/releases/latest) and download the file that fits your computer best

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

(Run these in parallel)

```zsh
$ npm run watch:client-ts
$ npm run watch:sass
$ npm run watch:server-ts
```

### Prettifying translations

```zsh
$ npm run compile:server-ts
$ node ./js/translate.js
```
