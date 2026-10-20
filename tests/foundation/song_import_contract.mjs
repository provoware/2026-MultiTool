import assert from 'node:assert/strict';
import {
  SONG_BACKUP_FORMAT,
  createSongBackup,
  parseSongBackup,
  parseTextSong,
  prepareSongImport,
  validateSong,
} from '../../src/ui/song-import.mjs';

const makeSong = (name, alt = false) => ({
  id: 98,
  file_name: name,
  title: 'Arbeitstitel',
  alternate_title_enabled: alt,
  alternate_title: alt ? 'Öffentlicher Titel' : '',
  lyrics: '[INTRO]\nDas ist ein Test.',
});
const file = (name, content) => {
  const bytes = new TextEncoder().encode(content);
  return { name, size:bytes.length, arrayBuffer:async () => bytes.buffer };
};

const plain = parseTextSong('projekt_09.txt', '\ufeffTitel: Der echte Titel\r\n\r\n[VERSE]\r\nEin Text.');
assert.equal(plain.file_name, 'projekt_09');
assert.equal(plain.title, 'Der echte Titel');
assert.equal(plain.lyrics, '[VERSE]\nEin Text.');
assert.equal(plain.alternate_title_enabled, false);
const md = parseTextSong('der-song.md', '# Überschrift\n\nText.');
assert.equal(md.title, 'Überschrift');
assert.equal(md.lyrics, 'Text.');
assert.equal(parseTextSong('arbeits_version.md', '[HOOK]').title, 'arbeits version');
assert.throws(() => parseTextSong('../foo.txt', 'Hallo'), /Dateiname/);
assert.throws(() => parseTextSong('foo.pdf', 'Hallo'), /Nur TXT/);

const backupText = createSongBackup([makeSong('interner_name', true)], new Date('2026-10-20T12:00:00.000Z'));
const decoded = JSON.parse(backupText);
assert.equal(decoded.format, SONG_BACKUP_FORMAT);
assert.equal(decoded.schema_version, 1);
assert.equal(decoded.songs[0].id, undefined, 'Datenbankkennung darf nie in Sicherung übernommen werden.');
assert.equal(decoded.songs[0].alternate_title, 'Öffentlicher Titel');
const restored = parseSongBackup(backupText);
assert.equal(restored.length, 1);
assert.equal(restored[0].id, null, 'Beim Wiederherstellen entsteht neue lokale Kennung.');
assert.equal(restored[0].file_name, 'interner_name');
assert.equal(restored[0].alternate_title_enabled, true);
assert.equal(restored[0].lyrics, makeSong('interner_name', true).lyrics);
assert.throws(() => parseSongBackup('{}'), /Unbekannte Sicherung/);
assert.throws(() => parseSongBackup('kein json'), /kein gültiges JSON/);
assert.throws(() => parseSongBackup(backupText.replace('"schema_version": 1', '"schema_version": 9')), /Version 1/);
assert.throws(() => validateSong({ ...makeSong('ok'), file_name:'../unsicher' }), /Dateiname/);
assert.throws(() => validateSong({ ...makeSong('ok'), alternate_title_enabled:true }), /Veröffentlichungstitel/);

const original = [makeSong('bereits_da')];
const preview = await prepareSongImport([
  file('bereits_da.txt', 'Alter Text'),
  file('neue_datei.txt', 'Titel: Neuer Titel\n\nText'),
  file('neue_datei.MD', '# Dublette'),
  file('backup.json', backupText),
], original);
assert.equal(preview.total, 4);
assert.deepEqual(preview.songs.map(s => s.file_name), ['neue_datei', 'interner_name']);
assert.equal(preview.skipped.length, 2);
assert.equal(original[0].lyrics, makeSong('bereits_da').lyrics, 'Bestehende Songs nicht ändern.');

const fromBackup = await prepareSongImport([file('restore.json', backupText)], []);
assert.equal(fromBackup.songs[0].alternate_title, 'Öffentlicher Titel');
assert.equal(fromBackup.songs[0].alternate_title_enabled, true);

await assert.rejects(() => prepareSongImport([file('bad.rtf', 'abc')], []), /Dateiformat/);
await assert.rejects(() => prepareSongImport([file('bad.json', '{"schema_version":0}')], []), /Unbekannte Sicherung/);
await assert.rejects(() => prepareSongImport(
  [{ name:'utf8.txt', size:1, arrayBuffer:async () => new Uint8Array([0xff]).buffer }],
  [],
), /nicht als UTF-8 lesbar/);
await assert.rejects(() => prepareSongImport([], []), /1 bis 50/);
await assert.rejects(() => prepareSongImport(
  [{ name:'zu-gross.txt', size:2_000_001, arrayBuffer:async () => new ArrayBuffer(0) }],
  [],
), /größer als 2 MB/);

console.log('🟢 Songtext-Import, Dublettenprüfung und verlustfreie JSON-Wiederherstellung bestanden.');
