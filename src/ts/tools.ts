import { existsSync, readFile, writeJSON } from "fs-extra";

export async function addRecentsEntry(entry: RecentsEntry) {
  await writeJSON("./recents.json", [
    entry,
    ...(existsSync("./recents.json")
      ? (JSON.parse((await readFile("./recents.json", "utf8")) || "[]") as RecentsEntry[])
      : []
    ).filter(e => e.filename !== entry.filename)
  ]);
}

export class Color {
  static RGBAToHex(rgbaColor: RGBAColor) {
    let { red, green, blue, alpha = 255 } = rgbaColor;
    red = Math.round(red);
    green = Math.round(green);
    blue = Math.round(blue);
    alpha = Math.round(alpha);
    const hexRed = red < 16 ? `0${red.toString(16)}` : red.toString(16);
    const hexGreen = green < 16 ? `0${green.toString(16)}` : green.toString(16);
    const hexBlue = blue < 16 ? `0${blue.toString(16)}` : blue.toString(16);
    const hexAlpha = alpha < 16 ? `0${alpha.toString(16)}` : alpha.toString(16);

    return "#" + hexRed + hexGreen + hexBlue + hexAlpha;
  }

  static hexToRGBA(hexColor: string): RGBAColor {
    let _hexColor = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;
    _hexColor =
      _hexColor.length === 3
        ? `${hexColor[0]}${hexColor[0]}${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3] || "f"}${
            hexColor[3] || "f"
          }`
        : _hexColor;

    return {
      red: parseInt(_hexColor.slice(0, 2), 16),
      green: parseInt(_hexColor.slice(2, 4), 16),
      blue: parseInt(_hexColor.slice(4, 6), 16),
      alpha: parseInt(_hexColor.slice(6) || "ff", 16)
    };
  }

  static colorType(rgbaColor: RGBAColor): "rgba";
  static colorType(rgbaColor: string): "hex";
  static colorType(rgbaColor: RGBAColor | string): "rgba" | "hex";
  static colorType(rgbaColor: RGBAColor | string): "rgba" | "hex" {
    return (rgbaColor as RGBAColor).red && (rgbaColor as RGBAColor).green && (rgbaColor as RGBAColor).blue ? "rgba" : "hex";
  }

  static brighten(color: RGBAColor, brightness: number): RGBAColor;
  static brighten(color: string, brightness: number): string;
  static brighten(color: RGBAColor | string, brightness: number): RGBAColor | string;
  static brighten(color: RGBAColor | string, brightness: number): RGBAColor | string {
    const { red, green, blue, alpha } =
      this.colorType(color) === "hex" ? this.hexToRGBA(color as string) : (color as RGBAColor);
    const result: RGBAColor = {
      red: Math.min(Math.max(red + brightness, 0), 255),
      green: Math.min(Math.max(green + brightness, 0), 255),
      blue: Math.min(Math.max(blue + brightness, 0), 255),
      alpha: Math.min(Math.max(alpha + brightness, 0), 255)
    };

    return this.colorType(color) === "hex" ? this.RGBAToHex(result) : result;
  }

  static textColor(color: RGBAColor | string) {
    const { red, green, blue } = this.colorType(color) === "hex" ? this.hexToRGBA(color as string) : (color as RGBAColor);
    return red * 0.299 + green * 0.587 + blue * 0.114 > 160 // 186
      ? "#000000"
      : "#ffffff";
  }
}
