/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — a .zip archive written by hand (Zip).
   The reproducible package of Block 10 is an ordinary ZIP file (written
   after the public specification of the format) with its files stored without
   compression: text and SVG weigh little, and storing keeps the code short and
   easy to check. Each file carries its CRC-32 (the polynomial 0xEDB88320) and
   its name in UTF-8 (bit 11 of the flags). `read` lists a stored archive back,
   for the tests. */
(function () {
  'use strict';
  const TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  const utf8 = s => new TextEncoder().encode(s);
  const bytesOf = d => (d instanceof Uint8Array ? d : typeof d === 'string' ? utf8(d) : new Uint8Array(d));
  function dos(d) {
    const date = d || new Date();
    return { time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate() };
  }
  /* files: [{ name, data: string | Uint8Array | ArrayBuffer }] → Uint8Array */
  function build(files, when) {
    const T = dos(when), parts = [], central = [];
    let offset = 0;
    files.forEach(f => {
      const name = utf8(f.name.replace(/\\/g, '/')), data = bytesOf(f.data), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, T.time, true); h.setUint16(12, T.date, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, T.time, true); c.setUint16(14, T.date, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
      c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true); c.setUint32(38, 0, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(4, 0, true); e.setUint16(6, 0, true);
    e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, offset, true); e.setUint16(20, 0, true);
    const all = parts.concat(central, [new Uint8Array(e.buffer)]);
    const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
    let k = 0;
    all.forEach(p => { out.set(p, k); k += p.length; });
    return out;
  }
  const make = (files, when) => new Blob([build(files, when)], { type: 'application/zip' });
  /* the files of a stored archive, from its central directory, with a check of each CRC */
  function read(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let e = u8.length - 22;
    while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('not a zip');
    const n = v.getUint16(e + 10, true);
    let p = v.getUint32(e + 16, true);
    const dec = new TextDecoder(), out = [];
    for (let i = 0; i < n; i++) {
      if (v.getUint32(p, true) !== 0x02014b50) throw new Error('central directory');
      const method = v.getUint16(p + 10, true), crc = v.getUint32(p + 16, true), size = v.getUint32(p + 24, true);
      const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      const lnl = v.getUint16(off + 26, true), lxl = v.getUint16(off + 28, true);
      const data = u8.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + size);
      out.push({ name, method, size, crc, ok: crc32(data) === crc, data });
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  window.Zip = { crc32, build, make, read, utf8 };
})();
