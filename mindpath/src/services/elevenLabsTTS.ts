/**
 * ElevenLabs TTS
 * - Probes a list of premade voice IDs to find one accessible on the free tier
 * - Returns a Promise that resolves when playback fully completes
 * - stopSpeech() interrupts and resolves any in-flight speak() Promise
 * - Falls back to expo-speech on API errors
 */

import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const API_KEY = '6ded44660a946ccecacfd38dc72f2117ad08721ef3875ced2795041c9dd1ea4c';
const EL_BASE = 'https://api.elevenlabs.io/v1';
const MODEL_ID = 'eleven_turbo_v2';

// ElevenLabs premade voices — free tier, NOT library/community voices.
// We probe each until one succeeds.
const PREMADE_VOICE_IDS = [
  'EXAVITQu4vr4xnSDxMaL', // Bella
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'MF3mGyEYCl7XYWbV9V6O', // Elli
  'TxGEqnHWrfWFTfGW9XjX', // Josh
  'pNInz6obpgDQGcFmaJgB', // Adam
];

let _resolvedVoiceId: string | null = null;
let _currentSound: Audio.Sound | null = null;
let _doneResolve: (() => void) | null = null;

async function _getVoiceId(): Promise<string> {
  if (_resolvedVoiceId) return _resolvedVoiceId;

  for (const id of PREMADE_VOICE_IDS) {
    const probe = await fetch(`${EL_BASE}/text-to-speech/${id}`, {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: ' ', model_id: MODEL_ID }),
    });
    if (probe.ok) {
      console.log('EL voice resolved:', id);
      _resolvedVoiceId = id;
      return id;
    }
    const body = await probe.text().catch(() => '');
    console.log(`EL voice ${id} → ${probe.status}:`, body.slice(0, 100));
  }
  throw new Error('No accessible ElevenLabs voice on this account');
}

/** Stop playback immediately and resolve any pending speak() Promise. */
export async function stopSpeech(): Promise<void> {
  Speech.stop();
  if (_doneResolve) { _doneResolve(); _doneResolve = null; }
  if (_currentSound) {
    try { await _currentSound.stopAsync(); await _currentSound.unloadAsync(); } catch {}
    _currentSound = null;
  }
}

/**
 * Speak text. Resolves when audio finishes OR stopSpeech() is called.
 * Falls back to expo-speech on any ElevenLabs error.
 */
export async function speak(text: string): Promise<void> {
  await stopSpeech();
  try {
    await _elevenLabsSpeak(text);
  } catch (err: any) {
    console.warn(`ElevenLabs TTS unavailable (${err?.message ?? err}), using device TTS`);
    await new Promise<void>((resolve) => {
      Speech.speak(text, { language: 'en-US', rate: 0.92, onDone: resolve, onError: () => resolve() });
    });
  }
}

async function _elevenLabsSpeak(text: string): Promise<void> {
  const voiceId = await _getVoiceId();

  const response = await fetch(`${EL_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn('ElevenLabs TTS error body:', body);
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = _uint8ToBase64(new Uint8Array(arrayBuffer));
  const tmpPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(tmpPath, base64, { encoding: FileSystem.EncodingType.Base64 });

  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });

  const { sound } = await Audio.Sound.createAsync({ uri: tmpPath }, { shouldPlay: true });
  _currentSound = sound;

  return new Promise<void>((resolve) => {
    _doneResolve = resolve;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
        if (_currentSound === sound) _currentSound = null;
        if (_doneResolve === resolve) { _doneResolve = null; resolve(); }
      }
    });
  });
}

const _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function _uint8ToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    result += _B64[b0 >> 2];
    result += _B64[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? _B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? _B64[b2 & 63] : '=';
  }
  return result;
}
