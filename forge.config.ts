import os from "os";
import p from "path";

export default {
  packagerConfig: {
    icon: "./img/app_icon",
    ignore: (path: string) =>
      ["/.gitignore", "/.prettierignore", "/.prettierrc.json", "/tsconfig.json"].includes(path) ||
      ["/node_modules/.bin", "/node_modules/@types"].some(e => path.startsWith(e)) ||
      [".icns", ".ico", ".map", ".md", ".scss", ".ts"].some(e => path.endsWith(e))
  },
  electronWinstallerConfig: {
    authors: "ezarcel",
    description: "Open-source learning and planning toolkit",
    noMsi: true,
    iconUrl: `file://${os.platform() === "win32" ? "/" : ""}${p.resolve(__dirname, "./img/app_icon.ico")}`,
    setupIcon: "./img/app_icon.ico"
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: "ikasi"
      }
    }
    // {
    //   name: "@electron-forge/maker-zip",
    //   platforms: ["darwin", "linux"]
    // },
    // {
    //   name: "@electron-forge/maker-deb",
    //   platforms: ["linux"]
    // },
    // {
    //   name: "@electron-forge/maker-rpm",
    //   platforms: ["linux"]
    // }
  ]
};
