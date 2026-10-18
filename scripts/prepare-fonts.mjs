import { mkdir, access, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Fetch official Satoshi webfonts for this app's own use. Font binaries are
// excluded from the source repository under Fontshare's redistribution terms.
const directory = fileURLToPath(new URL("../public/fonts/", import.meta.url));
const fonts = {
  400: "TTX2Z3BF3P6Y5BQT3IV2VNOK6FL22KUT/7QYRJOI3JIMYHGY6CH7SOIFRQLZOLNJ6/KFIAZD4RUMEZIYV6FQ3T3GP5PDBDB6JY",
  500: "P2LQKHE6KA6ZP4AAGN72KDWMHH6ZH3TA/ZC32TK2P7FPS5GFTL46EU6KQJA24ZYDB/7AHDUZ4A7LFLVFUIFSARGIWCRQJHISQP",
  700: "LAFFD4SDUCDVQEXFPDC7C53EQ4ZELWQI/PXCT3G6LO6ICM5I3NTYENYPWJAECAWDD/GHM6WVH6MILNYOOCXHXB5GTSGNTMGXZR",
  900: "NHPGVFYUXYXE33DZ75OIT4JFGHITX5PE/PSUTMASCDJTVPERDYJZPN23BVUFUCQIF/J64QX5IPOHK56I2KYUNBQ5M2XWZEYKYX",
};
await mkdir(directory, { recursive: true });
await Promise.all(
  Object.entries(fonts).map(async ([weight, path]) => {
    const destination = `${directory}satoshi-${weight}.woff2`;
    try {
      await access(destination);
      return;
    } catch {
      /* Download only missing assets. */
    }
    const response = await fetch(`https://cdn.fontshare.com/wf/${path}.woff2`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`Official Satoshi ${weight} font download failed (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (String.fromCharCode(...bytes.slice(0, 4)) !== "wOF2")
      throw new Error("Fontshare returned an invalid font file.");
    await writeFile(`${destination}.tmp`, bytes);
    await rename(`${destination}.tmp`, destination);
  }),
);
