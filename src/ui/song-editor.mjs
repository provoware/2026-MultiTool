export function publishedTitle(song) {
  const other = (song.alternate_title ?? '').trim();
  return song.alternate_title_enabled && other ? other : (song.title ?? '').trim();
}

export function songtextExport(song) {
  return 'Titel: ' + publishedTitle(song) + '\n\n' + (song.lyrics ?? '');
}

export function songtextFileName(song) {
  return (song.file_name ?? '').trim().replace(/\.txt$/i, '') + '.txt';
}

export function setupSongEditor(invokeRuntime) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('songEditorDialog');
  const fields = {
    file_name: $('songFileName'),
    title: $('songTitle'),
    alternate_title_enabled: $('songAltEnabled'),
    alternate_title: $('songAltTitle'),
    lyrics: $('songLyrics'),
  };
  let songs = [];
  let activeId = null;
  let dirty = false;
  let busy = false;

  function status(message, isError = false) {
    $('songStatus').textContent = message;
    $('songStatus').classList.toggle('status-bad', isError);
    $('songStatus').classList.toggle('status-ok', !isError);
  }

  function current() {
    return {
      id: activeId,
      file_name: fields.file_name.value,
      title: fields.title.value,
      alternate_title_enabled: fields.alternate_title_enabled.checked,
      alternate_title: fields.alternate_title.value,
      lyrics: fields.lyrics.value,
    };
  }

  function refreshPreview() {
    $('songPublishedPreview').textContent = publishedTitle(current()) || 'Noch kein Titel';
    $('songLyricsCount').textContent = fields.lyrics.value.length.toLocaleString('de-DE') + ' Zeichen';
    $('songAltContainer').hidden = !fields.alternate_title_enabled.checked;
    $('songExportBtn').disabled = dirty || busy || activeId === null;
    $('songCopyBtn').disabled = dirty || busy || activeId === null;
  }

  function changed() {
    dirty = true;
    status('Ungespeicherte Änderungen – bitte speichern.');
    refreshPreview();
  }

  function fill(song) {
    activeId = song?.id ?? null;
    fields.file_name.value = song?.file_name ?? '';
    fields.title.value = song?.title ?? '';
    fields.alternate_title_enabled.checked = song?.alternate_title_enabled ?? false;
    fields.alternate_title.value = song?.alternate_title ?? '';
    fields.lyrics.value = song?.lyrics ?? '';
    dirty = false;
    $('songList').value = activeId === null ? '' : String(activeId);
    refreshPreview();
    status(activeId === null ? 'Neuer Song – Dateiname und Titel eingeben.' : 'Song geladen · lokal gespeichert.');
  }

  function canDiscard() {
    return !dirty || window.confirm('Es gibt ungespeicherte Änderungen. Wirklich verwerfen?');
  }

  async function load(selectedId = activeId) {
    songs = await invokeRuntime()('list_songtexts');
    const list = $('songList');
    list.replaceChildren();
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Neuen Song erstellen';
    list.append(blank);
    for (const item of songs) {
      const option = document.createElement('option');
      option.value = String(item.id);
      option.textContent = item.file_name + ' · ' + publishedTitle(item);
      list.append(option);
    }
    fill(songs.find((item) => item.id === selectedId) ?? null);
  }

  $('songEditorOpenBtn').addEventListener('click', async () => {
    if (busy) return;
    try {
      await load();
      dialog.showModal();
      fields.file_name.focus();
    } catch (error) {
      status('Laden fehlgeschlagen: ' + (error?.message ?? error), true);
      dialog.showModal();
    }
  });

  for (const field of Object.values(fields)) {
    field.addEventListener('input', changed);
    field.addEventListener('change', changed);
  }

  $('songList').addEventListener('change', (event) => {
    const id = Number(event.target.value);
    if (!canDiscard()) {
      event.target.value = activeId === null ? '' : String(activeId);
      return;
    }
    fill(songs.find((item) => item.id === id) ?? null);
  });

  $('songNewBtn').addEventListener('click', () => {
    if (canDiscard()) fill(null);
    fields.file_name.focus();
  });

  $('songCloseBtn').addEventListener('click', () => {
    if (canDiscard()) dialog.close();
  });

  dialog.addEventListener('cancel', (event) => {
    if (!canDiscard()) event.preventDefault();
  });

  $('songForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    $('songSaveBtn').disabled = true;
    try {
      const saved = await invokeRuntime()('save_songtext', { song: current() });
      dirty = false;
      await load(saved.id);
      status('🟢 Lokal gespeichert. Veröffentlichungstitel und Dateiname bleiben getrennt.');
    } catch (error) {
      status('🔴 Speichern fehlgeschlagen: ' + (error?.message ?? error), true);
    } finally {
      busy = false;
      $('songSaveBtn').disabled = false;
      refreshPreview();
    }
  });

  $('songExportBtn').addEventListener('click', () => {
    if (dirty || activeId === null) return;
    const song = current();
    const url = URL.createObjectURL(new Blob([songtextExport(song)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = songtextFileName(song);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('TXT mit unverändertem Dateinamen und gewähltem Veröffentlichungstitel erstellt.');
  });

  $('songCopyBtn').addEventListener('click', async () => {
    if (dirty || activeId === null) return;
    try {
      await navigator.clipboard.writeText(publishedTitle(current()));
      status('Veröffentlichungstitel kopiert.');
    } catch {
      status('Kopieren nicht möglich. Titel bitte manuell auswählen.', true);
    }
  });

  refreshPreview();
}
