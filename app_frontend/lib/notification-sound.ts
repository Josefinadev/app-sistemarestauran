/* ═══════════════════════════════════════════════════════════
   Notification Sound — Web Audio API
   Genera un chime agradable sin necesidad de archivos de audio.
   Tres tonos ascendentes tipo "campanita de restaurante".
   ═══════════════════════════════════════════════════════════ */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      console.warn("Web Audio API no disponible");
      return null;
    }
  }
  return audioCtx;
}

/**
 * Toca un tono suave a una frecuencia dada.
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);

  // Envelope suave: ramp up → sustain → ramp down
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
  gain.gain.setValueAtTime(volume, startTime + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * 🔔 Sonido de notificación principal — campanita de restaurante
 * Tres tonos ascendentes suaves y agradables.
 */
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Reanudar contexto si fue suspendido (política de autoplay)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Tres notas ascendentes: Do5 - Mi5 - Sol5 (acorde mayor)
  playTone(ctx, 523.25, now, 0.18, 0.12);        // C5
  playTone(ctx, 659.25, now + 0.12, 0.18, 0.12);  // E5
  playTone(ctx, 783.99, now + 0.24, 0.30, 0.14);  // G5 (más largo y brillante)
}

/**
 * 🍽️ Sonido para "plato listo" — tono más enfático
 * Acorde completo con resonancia.
 */
export function playPlatoListoSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Acorde ascendente con quinta: Do5 - Mi5 - Sol5 - Do6
  playTone(ctx, 523.25, now, 0.15, 0.10);          // C5
  playTone(ctx, 659.25, now + 0.10, 0.15, 0.12);   // E5
  playTone(ctx, 783.99, now + 0.20, 0.20, 0.14);   // G5
  playTone(ctx, 1046.50, now + 0.32, 0.40, 0.16);  // C6 (octava, más fuerte y largo)
}

/**
 * ✅ Sonido de "entregado" — dos tonos de confirmación
 */
export function playEntregadoSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Dos tonos de confirmación
  playTone(ctx, 880, now, 0.12, 0.08);       // A5
  playTone(ctx, 1318.5, now + 0.10, 0.25, 0.10); // E6
}

/**
 * 🆕 Sonido para nuevo pedido — alerta más prominente
 */
export function playNuevoPedidoSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Patrón de "alerta" con repetición: ding-ding
  playTone(ctx, 880, now, 0.15, 0.14);
  playTone(ctx, 1108.73, now + 0.12, 0.15, 0.14);
  playTone(ctx, 880, now + 0.35, 0.15, 0.14);
  playTone(ctx, 1108.73, now + 0.47, 0.25, 0.16);
}
