/* Sonido notificación */

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

let notificationSound: Audio.Sound | null = null;

/* Generar WAV */
function generateToneWav(
  frequency: number,
  durationMs: number,
  volume: number = 1,
  sampleRate: number = 44100
): string {
  const numSamples = Math.floor(sampleRate * (durationMs / 1000));
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, fileSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;

    let envelope = 1;

    if (progress < 0.02) {
      envelope = progress / 0.02;
    } else {
      envelope = Math.exp(-3 * progress);
    }

    const wave =
      Math.sin(2 * Math.PI * frequency * t) +
      0.4 * Math.sin(2 * Math.PI * frequency * 2 * t) +
      0.2 * Math.sin(2 * Math.PI * frequency * 3 * t);

    const sample = wave * volume * envelope;
    const clamped = Math.max(-1, Math.min(1, sample));

    view.setInt16(headerSize + i * blockAlign, clamped * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

/* Tono fuerte */
const ALERT_TONE = generateToneWav(2200, 180, 1);

/* Reproducir */
export async function playNotificationSound() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    if (notificationSound) {
      await notificationSound.unloadAsync();
      notificationSound = null;
    }

    // 3 sonidos
    for (let i = 0; i < 3; i++) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: ALERT_TONE },
        {
          shouldPlay: true,
          volume: 1,
        }
      );

      notificationSound = sound;

      setTimeout(() => {
        sound.unloadAsync();
      }, 300);

      await new Promise((r) => setTimeout(r, 220));
    }

    // Vibrar
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (error) {
    console.warn("Error sonido:", error);

    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch { }
    }
  }
}

/* Limpiar */
export async function cleanupSound() {
  if (notificationSound) {
    await notificationSound.unloadAsync();
    notificationSound = null;
  }
}