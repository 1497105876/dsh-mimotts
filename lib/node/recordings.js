/**
 * Host-side persistence for synthesized speech.
 *
 * Every spoken text becomes one recording node; each synthesis — first pass
 * or a later re-synthesis — appends a version with its own WAV file on disk.
 * A single `index.json` records the tree so the browser can list history
 * without scanning directories. The store lives under `~/.dsh`, outside the
 * plugin and any repository, so no recording leaks into version control.
 *
 * Re-synthesis never overwrites: it adds a new version, leaving earlier
 * takes intact so the user can compare voices side by side.
 * @module dsh-mimotts/recordings
 */
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
/** Directory holding the index and all WAV files. */
const RECORDINGS_DIR = join(homedir(), '.dsh', 'mimotts-recordings');
/** The single index file mapping texts to their version trees. */
const INDEX_FILE = join(RECORDINGS_DIR, 'index.json');
/** A recordings store with no entries yet. */
const EMPTY_INDEX = { entries: [] };
// `mkdir` is idempotent but we still memoize the in-flight promise so
// concurrent first writes don't race the directory creation.
let ensurePromise;
function ensureDir() {
    if (ensurePromise === undefined) {
        ensurePromise = mkdir(RECORDINGS_DIR, { recursive: true })
            .then(() => undefined)
            .catch((error) => {
            ensurePromise = undefined;
            throw error;
        });
    }
    return ensurePromise;
}
/**
 * Read the index, tolerating a missing or corrupt file.
 * @returns the parsed index, or an empty one when unreadable.
 */
async function readIndex() {
    try {
        const raw = await readFile(INDEX_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.entries) ? parsed : EMPTY_INDEX;
    }
    catch {
        return EMPTY_INDEX;
    }
}
/** Persist the index, creating the directory first. */
async function writeIndex(index) {
    await ensureDir();
    await writeFile(INDEX_FILE, JSON.stringify(index), 'utf8');
}
/** The on-disk file name for one version; ids are uuids, so no path tricks. */
function versionFileName(recId, verId) {
    return `${recId}-${verId}.wav`;
}
/** Absolute path of one version's WAV file. */
export function versionFilePath(recId, verId) {
    return join(RECORDINGS_DIR, versionFileName(recId, verId));
}
/**
 * Append a synthesized version to a text's recording history.
 *
 * Texts are de-duplicated: speaking the same text twice groups both takes
 * under one node. The new version is prepended so the list reads newest-first.
 * @param text - the spoken text (grouping key).
 * @param style - style phrase used, or undefined for neutral.
 * @param voice - preset voice used, or undefined for default.
 * @param model - model id used.
 * @param wav - the WAV bytes to persist.
 * @returns the recording node and the new version.
 */
export async function addVersion(text, style, voice, model, wav) {
    await ensureDir();
    const index = await readIndex();
    const version = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        style: style ?? null,
        voice: voice ?? null,
        model,
    };
    let recording = index.entries.find(entry => entry.text === text);
    if (recording === undefined) {
        recording = { id: randomUUID(), text, createdAt: version.createdAt, versions: [] };
        index.entries.unshift(recording);
    }
    recording.versions.unshift(version);
    await writeFile(versionFilePath(recording.id, version.id), Buffer.from(wav));
    await writeIndex(index);
    return { recording, version };
}
/** Return the current index (empty when none yet). */
export async function listRecordings() {
    return readIndex();
}
/**
 * Re-synthesize an existing recording's text with the engine's current
 * settings and append the result as a new version. Earlier versions stay
 * intact so the user can compare takes.
 * @param recId - the recording node id.
 * @param style - style phrase used, or undefined for neutral.
 * @param voice - preset voice used, or undefined for default.
 * @param model - model id used.
 * @param wav - the freshly synthesized WAV bytes.
 * @returns the recording and new version, or undefined when `recId` is unknown.
 */
export async function resynthesize(recId, style, voice, model, wav) {
    await ensureDir();
    const index = await readIndex();
    const recording = index.entries.find(entry => entry.id === recId);
    if (recording === undefined)
        return undefined;
    const version = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        style: style ?? null,
        voice: voice ?? null,
        model,
    };
    recording.versions.unshift(version);
    await writeFile(versionFilePath(recording.id, version.id), Buffer.from(wav));
    await writeIndex(index);
    return { recording, version };
}
/**
 * Delete one version's file and index entry. When a recording loses its last
 * version it is removed entirely.
 * @returns true when the version existed and was removed.
 */
export async function deleteVersion(recId, verId) {
    const index = await readIndex();
    const recording = index.entries.find(entry => entry.id === recId);
    if (recording === undefined)
        return false;
    const at = recording.versions.findIndex(version => version.id === verId);
    if (at === -1)
        return false;
    recording.versions.splice(at, 1);
    await unlink(versionFilePath(recId, verId)).catch(() => { });
    if (recording.versions.length === 0) {
        index.entries = index.entries.filter(entry => entry.id !== recId);
    }
    await writeIndex(index);
    return true;
}
/** Whether a recording/version pair exists (used to authorize file serving). */
export async function hasVersion(recId, verId) {
    const index = await readIndex();
    const recording = index.entries.find(entry => entry.id === recId);
    return recording !== undefined && recording.versions.some(version => version.id === verId);
}
//# sourceMappingURL=recordings.js.map