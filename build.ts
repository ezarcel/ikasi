// FOR NPM SCRIPTS USE ONLY

import ePackager from 'electron-packager';
import { emptyDir, ensureDir, removeSync, unlink } from 'fs-extra';
import { unlinkSync } from 'node:fs';

const eWInstaller = require('electron-winstaller') as typeof import('electron-winstaller');

(async () => {
  switch (process.argv[2]) {
    case 'windows-x64': {
      await ensureDir('./tmp');
      await emptyDir('./tmp');
      await ePackager({
        arch: 'x64',
        dir: '.',
        icon: './img/app_icon.ico',
        ignore: path =>
          ['/.gitignore', '/.prettierignore', '/.prettierrc.json', '/tsconfig.json'].includes(path) ||
          ['/node_modules/.bin', '/node_modules/@types'].some(e => path.startsWith(e)) ||
          ['.icns', '.ico', '.map', '.md', '.scss', '.ts'].some(e => path.endsWith(e)),
        out: './tmp',
        platform: 'win32'
      });

      await ensureDir('./build');
      await emptyDir('./build');
      await eWInstaller.createWindowsInstaller({
        appDirectory: './tmp/ikasi-win32-x64',
        authors: 'ezarcel',
        description: 'Open-source learning and planning toolkit',
        noMsi: true,
        outputDirectory: './build/ikasi-win32-x64',
        setupExe: 'ikasi-setup.exe',
        setupIcon: './img/app_icon.ico'
      });

      removeSync('./tmp');
      break;
    }

    default:
      break;
  }
})();
