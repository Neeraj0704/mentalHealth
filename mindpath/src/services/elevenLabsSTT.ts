/**
 * ElevenLabs Speech-to-Text (Scribe)
 * Records audio with expo-av, uploads to ElevenLabs STT, returns transcript.
 * Returns null if STT is unavailable — caller shows text fallback.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { stopSpeech } from './elevenLabsTTS';

const API_KEY = '6ded44660a946ccecacfd38dc72f2117ad08721ef3875ced2795041c9dd1ea4c';
const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

let _recording: Audio.Recording | null = null;

/** Returns true if a recording is in progress. */
export function isRecording(): boolean {
  return _recording !== null;
}

/** Start microphone recording. Stops any playing TTS first. */
export async function startRecording(): Promise<void> {
  await stopSpeech(); // can't record while playing

  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error('Microphone permission denied');

  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  _recording = recording;
}

/**
 * Stop recording and transcribe with ElevenLabs Scribe.
 * Returns the transcript string, or null if STT failed/unavailable.
 */
export async function stopAndTranscribe(): Promise<string | null> {
  if (!_recording) return null;

  await _recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

  const uri = _recording.getURI();
  _recording = null;
  if (!uri) return null;

  try {
    const formData = new FormData();
    formData.append('file', { uri, type: 'audio/m4a', name: 'speech.m4a' } as any);
    formData.append('model_id', 'scribe_v1');

    const res = await fetch(STT_URL, {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('ElevenLabs STT error:', res.status, body);
      return null;
    }

    const data = await res.json();
    return (data.text ?? '').trim() || null;
  } catch (e) {
    console.warn('ElevenLabs STT exception:', e);
    return null;
  } finally {
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}

/** Cancel recording without transcribing. */
export async function cancelRecording(): Promise<void> {
  if (!_recording) return;
  try { await _recording.stopAndUnloadAsync(); } catch {}
  const uri = _recording.getURI();
  _recording = null;
  if (uri) FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
}
