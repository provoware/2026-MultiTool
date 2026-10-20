// Fachlogik für TXT/Markdown und versionierte Songtext-Sicherungen.
// Keine DOM-Zugriffe und keine direkten Schreibvorgänge auf Benutzerdaten.
export const SONG_BACKUP_FORMAT = 'provoware.songtexts';
export const MAX_IMPORT_FILES = 50;
export const MAX_ARCHIVE_SONGS = 1000;
export const MAX_SONG_BYTES = 2_000_000;
export const MAX_IMPORT_BYTES = 32_000_000;

const isTextFile = (name) => /\.(txt|md)$/i.test(name);
const isBackupFile = (name) => /\.json$/i.test(name);
const canonicalName = (name) => name.toLocaleLowerCase('de-DE');
const encoder = new TextEncoder();

export function validateSong(song) {
  if (!song || typeof song !== 'object' || Array.isArray(song)) {
    throw new Error('Ungültiger Song-Datensatz.');
  }
  const { file_name: name, title, alternate_title: alternate, lyrics } = song;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120
    || name.trim().startsWith('.') || name.trim().endsWith('.')
    || /[<>:"/\\|?*\x00-\x1f\x7f]/.test(name)) {
    throw new Error('Ungültiger Dateiname. Bitte Dateinamen ohne Pfadangaben verwenden.');
  }
  if (typeof title !== 'string' || !title.trim() || [...title.trim()].length > 200) {
    throw new Error('Der Songtitel muss 1 bis 200 Zeichen enthalten.');
  }
  if (typeof alternate !== 'string' || [...alternate.trim()].length > 200
      || typeof song.alternate_title_enabled !== 'boolean'
      || (song.alternate_title_enabled && !alternate.trim())) {
    throw new Error('Die Angaben zum Veröffentlichungstitel sind ungültig.');
  }
  if (typeof lyrics !== 'string' || encoder.encode(lyrics).byteLength > MAX_SONG_BYTES) {
    throw new Error('Der Songtext ist ungültig oder größer als 2 MB.');
  }
  return {
    id: null,
    file_name: name.trim(),
    title: title.trim(),
    alternate_title_enabled: song.alternate_title_enabled,
    alternate_title: alternate.trim(),
    lyrics,
  };
}

export function parseTextSong(filename, input) {
  if (!isTextFile(filename)) throw new Error('Nur TXT- und Markdown-Dateien sind erlaubt.');
  const stem = filename.replace(/\.(txt|md)$/i, '');
  if (typeof input !== 'string') throw new Error('Songtext ist kein Text.');
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  let title = stem.replace(/[_-]+/g, ' ').trim();
  let lyrics = normalized;

  const titleLine = normalized.match(/^(?:Titel|Title):[ \t]*(.+?)[ \t]*(?:\n|$)/i);
  const heading = normalized.match(/^#[ \t]+(.+?)[ \t]*(?:\n|$)/);
  const found = titleLine ?? heading;
  if (found) {
    title = found[1].trim();
    lyrics = normalized.slice(found[0].length).replace(/^\n+/, '');
  }

  return validateSong({
    file_name: stem,
    title,
    alternate_title_enabled: false,
    alternate_title: '',
    lyrics,
  });
}

export function parseSongBackup(content) {
  let backup;
  try {
    backup = JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('Die Sicherungsdatei enthält kein gültiges JSON.');
  }
  if (!backup || backup.format !== SONG_BACKUP_FORMAT || backup.schema_version !== 1
      || !Array.isArray(backup.songs)) {
    throw new Error('Unbekannte Sicherung: PROVOWARE-Songtextformat Version 1 benötigt.');
  }
  if (backup.songs.length === 0 || backup.songs.length > MAX_ARCHIVE_SONGS) {
    throw new Error('Eine Sicherung muss 1 bis 1000 Songtexte enthalten.');
  }
  return backup.songs.map(validateSong);
}

export function createSongBackup(songs, now = new Date()) {
  if (!Array.isArray(songs) || songs.length === 0 || songs.length > MAX_ARCHIVE_SONGS) {
    throw new Error('Eine Sicherung unterstützt 1 bis 1000 Songtexte.');
  }
  const content = JSON.stringify({
    format: SONG_BACKUP_FORMAT,
    schema_version: 1,
    exported_at: now.toISOString(),
    songs: songs.map(validateSong).map(({ id: _id, ...data }) => data),
  }, null, 2) + '\n';
  if (encoder.encode(content).byteLength > MAX_IMPORT_BYTES) {
    throw new Error('Die Sicherung überschreitet 32 MB. Kleinere Archive sind erforderlich.');
  }
  return content;
}

export async function prepareSongImport(files, existingSongs = []) {
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_IMPORT_FILES) {
    throw new Error('Bitte 1 bis 50 Dateien je Import auswählen.');
  }
  if (!Array.isArray(existingSongs)) throw new Error('Songliste ist ungültig.');

  let totalBytes = 0;
  const candidates = [];
  const decode = new TextDecoder('utf-8', { fatal: true });

  for (const file of files) {
    if (!file || typeof file.name !== 'string' || !Number.isFinite(file.size)
        || file.size < 0 || typeof file.arrayBuffer !== 'function') {
      throw new Error('Eine Importdatei ist beschädigt oder nicht lesbar.');
    }
    if (!isTextFile(file.name) && !isBackupFile(file.name)) {
      throw new Error('Unerlaubtes Dateiformat: ' + file.name + '. Erlaubt: TXT, MD, JSON-Sicherung.');
    }
    if (isTextFile(file.name) && file.size > MAX_SONG_BYTES) {
      throw new Error('Datei ist größer als 2 MB: ' + file.name);
    }
    totalBytes += file.size;
    if (totalBytes > MAX_IMPORT_BYTES) {
      throw new Error('Die ausgewählten Dateien sind insgesamt größer als 32 MB.');
    }
    let text;
    try {
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > MAX_IMPORT_BYTES) throw new Error('Datei zu groß.');
      text = decode.decode(bytes);
    } catch (error) {
      throw new Error('Datei nicht als UTF-8 lesbar: ' + file.name + ' (' + error.message + ')');
    }
    candidates.push(...(isBackupFile(file.name)
      ? parseSongBackup(text)
      : [parseTextSong(file.name, text)]));
    if (candidates.length > MAX_ARCHIVE_SONGS) {
      throw new Error('Je Import sind höchstens 1000 Songtexte zulässig.');
    }
  }

  const known = new Set(existingSongs.map((s) => canonicalName(s.file_name)));
  const pending = new Set();
  const songs = [];
  const skipped = [];
  for (const song of candidates) {
    const key = canonicalName(song.file_name);
    if (known.has(key) || pending.has(key)) {
      skipped.push(song.file_name);
    } else {
      pending.add(key);
      songs.push(song);
    }
  }
  return { songs, skipped, total: candidates.length };
}

export function downloadSongFile(name, content, mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
