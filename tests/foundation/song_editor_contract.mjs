import assert from 'node:assert/strict';
import { publishedTitle, songtextExport, songtextFileName } from '../../src/ui/song-editor.mjs';

const song = {
  file_name: 'projekt_01',
  title: 'Arbeitstitel',
  alternate_title_enabled: false,
  alternate_title: 'Der letzte Zug',
  lyrics: '[INTRO]\nHallo!',
};
assert.equal(publishedTitle(song), 'Arbeitstitel');
assert.equal(songtextFileName(song), 'projekt_01.txt');
assert.match(songtextExport(song), /^Titel: Arbeitstitel\n\n\[INTRO\]/);
song.alternate_title_enabled = true;
assert.equal(publishedTitle(song), 'Der letzte Zug');
assert.equal(songtextFileName(song), 'projekt_01.txt');
assert.match(songtextExport(song), /^Titel: Der letzte Zug\n\n/);
song.alternate_title_enabled = false;
assert.equal(publishedTitle(song), 'Arbeitstitel');
assert.equal(song.alternate_title, 'Der letzte Zug');
song.file_name = 'backup_song.txt';
assert.equal(songtextFileName(song), 'backup_song.txt');
console.log('🟢 Songtext-Dateiname und Titelvertrag bestanden.');
