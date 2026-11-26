import { getAuradonMoveEffect } from './auradon-move-effects.a4bc9735e089.js';

const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (from, to, fraction) => from + (to - from) * fraction;
const tau = 2 * Math.PI;

function pixel(context, color, x, y, width, height = width) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  context.fillStyle = color;
  context.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}

function pixelLine(context, color, from, to, width) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, width * 0.72)));
  for (let step = 0; step <= steps; step += 1) {
    const at = step / steps;
    pixel(context, color, lerp(from.x, to.x, at), lerp(from.y, to.y, at), width);
  }
}

function glow(context, colors, x, y, size) {
  const [base, light, dark] = colors;
  pixel(context, dark, x, y, size, size * 1.5);
  pixel(context, dark, x, y, size * 1.5, size);
  pixel(context, base, x, y, size * 1.2, size * 0.65);
  pixel(context, base, x, y, size * 0.65, size * 1.15);
  pixel(context, light, x - size * 0.12, y - size * 0.16, size * 0.44);
}

function burst(context, { target, colors, progress, size, count }, start = 0.6) {
  if (progress < start) return;
  const at = clamp((progress - start) / (1 - start));
  const radius = size * (0.6 + 2 * at);
  for (let i = 0; i < count; i += 1) {
    const angle = i * tau / count + 0.32;
    const spread = radius * (0.62 + (i % 3) * 0.19);
    const x = target.x + Math.cos(angle) * spread;
    const y = target.y + Math.sin(angle) * spread * 0.85;
    pixel(context, colors[i % colors.length], x, y, Math.max(1, size * (0.35 - at * 0.21)));
  }
}

function orb(context, frame) {
  const { progress, origin, target, colors, size, count, variant } = frame;
  const flight = clamp(progress / 0.68);
  for (let i = count - 1; i >= 0; i -= 1) {
    const at = flight - i * 0.028;
    if (at < 0 || at > 0.98) continue;
    const drift = i ? Math.sin(i * 1.8 + flight * 8) * size * 0.34 : 0;
    const x = lerp(origin.x, target.x, at);
    const height = variant === 'ember' ? 5 : 9;
    const y = lerp(origin.y, target.y, at) - Math.sin(at * Math.PI) * height + drift;
    const width = size * (i ? (0.28 + 0.35 * (1 - i / count)) : 1);
    glow(context, colors, x, y, width);
    if (variant === 'shadow' && !i) pixel(context, colors[2], x, y, width * 0.52);
  }
  burst(context, frame);
}

function stream(context, frame) {
  const { progress, origin, target, colors, size, count, variant } = frame;
  const direction = Math.sign(target.x - origin.x);
  for (let i = 0; i < count; i += 1) {
    const at = progress * 1.65 - i * 0.075;
    if (at < 0 || at > 1) continue;
    const wing = Math.sin(i * 2.4 + at * 6) * size * (0.16 + at * 1.25);
    const x = lerp(origin.x, target.x, at);
    const y = lerp(origin.y, target.y, at) + wing;
    if (variant === 'wind') {
      pixelLine(context, colors[i % 2], { x: x - direction * size, y: y + 2 }, { x, y }, 2);
    } else {
      glow(context, colors, x, y, size * (0.38 + 0.55 * at));
    }
  }
  burst(context, frame, 0.58);
}

function wave(context, frame) {
  const { origin, target, progress, size, colors, variant, count } = frame;
  const direction = Math.sign(target.x - origin.x);
  const crests = variant === 'split' ? 2 : 1;
  for (let row = 0; row < crests; row += 1) {
    const at = progress * 1.48 - row * 0.19;
    if (at < 0 || at > 1) continue;
    for (let i = 0; i < count; i += 1) {
      const fraction = i / Math.max(1, count - 1);
      const distance = size * Math.sin(fraction * Math.PI);
      const x = lerp(origin.x, target.x, at) + distance * direction * 1.4;
      const y = lerp(origin.y, target.y, at) + (fraction - 0.5) * size * 3.4 + (row - (crests - 1) / 2) * size * 1.35;
      pixel(context, colors[2], x - direction * 2, y + 2, size * 0.9, size * 0.48);
      pixel(context, colors[0], x, y, size * 0.8, size * 0.4);
      pixel(context, colors[1], x + direction * 2, y - 1, size * (i % 2 ? 0.34 : 0.46), 2);
    }
  }
  burst(context, frame, 0.62);
}

function fireImpact(context, frame, start) {
  const { progress, size, target, colors } = frame;
  if (progress < start) return;
  const at = (progress - start) / (1 - start);
  for (let i = 0; i < 5; i += 1) {
    const angle = i * tau / 5;
    const radius = size * (0.3 + at * 1.3);
    const x = target.x + Math.cos(angle) * radius;
    const y = target.y + Math.sin(angle) * radius * 0.85;
    glow(context, colors, x, y, size * (0.84 - at * 0.72));
  }
  if (at < 0.45) glow(context, colors, target.x, target.y, size * (1.45 - at));
  burst(context, { ...frame, size: size * 1.3 }, start);
}

function beam(context, frame) {
  const { origin, target, progress, colors, size, variant } = frame;
  const fire = variant === 'fire';
  const advance = fire ? clamp((progress - 0.05) / 0.33) : clamp((progress - 0.07) / 0.27);
  const end = { x: lerp(origin.x, target.x, advance), y: lerp(origin.y, target.y, advance) };
  const taper = fire ? clamp((0.56 - progress) / 0.12) : Math.min(1, (1 - progress) * 2.4);
  if (taper > 0) glow(context, colors, origin.x, origin.y, size * (0.4 + advance * 0.45) * (fire ? taper : 1));
  if (advance > 0.02 && taper > 0) {
    const width = size * taper;
    pixelLine(context, colors[2], origin, end, width + 3);
    pixelLine(context, colors[0], origin, end, width);
    pixelLine(context, colors[1], origin, end, Math.max(1, width * 0.35));
    if (variant === 'lightning') {
      const bend = { x: lerp(origin.x, end.x, 0.49), y: lerp(origin.y, end.y, 0.49) - width };
      pixelLine(context, colors[0], origin, bend, 2);
      pixelLine(context, colors[1], bend, end, 2);
    }
    if (fire) {
      for (let i = 0; i < frame.count; i += 1) {
        const at = (i + 0.5) / frame.count;
        const x = lerp(origin.x, end.x, at);
        const y = lerp(origin.y, end.y, at) + Math.sin(i * 2.4 + progress * 21) * width * 0.9;
        pixel(context, colors[i % 2], x, y, width * 0.65, width * 0.23);
      }
    }
  }
  if (fire) fireImpact(context, frame, 0.45);
  else burst(context, frame, 0.34);
}

function meteor(context, frame) {
  const { origin, target, progress, colors, size, count } = frame;
  const launch = 0.35;
  const impact = 0.72;
  if (progress < launch) {
    const charge = progress / launch;
    const floor = origin.floor ?? origin.y + size;
    for (let i = 0; i < count; i += 1) {
      const angle = i * tau / count + charge * 3.5;
      const rise = (charge * 1.1 + i / count) % 1;
      const radius = size * (0.8 + charge * 0.9);
      const x = origin.x + Math.cos(angle) * radius;
      const y = floor + Math.sin(angle) * size * 0.45 - rise * size * (1.1 + charge * 1.8);
      const flame = size * (0.15 + charge * 0.37) * (1 - rise * 0.55);
      glow(context, colors, x, y, flame);
    }
    return;
  }

  if (progress < impact) {
    const fall = (progress - launch) / (impact - launch);
    const direction = Math.sign(target.x - origin.x);
    const start = { x: target.x - direction * size * 3, y: 0 };
    for (let i = 7; i >= 0; i -= 1) {
      const at = clamp(fall - i * 0.036) ** 1.45;
      const x = lerp(start.x, target.x, at) + Math.sin(i * 2.4) * i * size * 0.025;
      const y = lerp(start.y, target.y, at);
      glow(context, colors, x, y, size * (1.45 - i * 0.16));
    }
    return;
  }

  fireImpact(context, frame, impact);
}

function bubbles(context, frame) {
  const { origin, target, progress, size, count, colors } = frame;
  for (let i = 0; i < count; i += 1) {
    const at = progress * 1.55 - i * 0.075;
    if (at < 0 || at > 1) continue;
    const x = lerp(origin.x, target.x, at);
    const y = lerp(origin.y, target.y, at) + Math.sin(i * 2.95 + at * 4) * (3 + at * size);
    const width = (0.7 + (i % 3) * 0.23) * size;
    pixel(context, colors[2], x, y, width + 2);
    pixel(context, colors[0], x, y, width);
    pixel(context, colors[2], x, y, width * 0.55);
    pixel(context, colors[1], x - width * 0.22, y - width * 0.22, 2);
  }
  burst(context, frame, 0.64);
}

function fissure(context, frame) {
  const { origin, target, progress, size, count, colors } = frame;
  let previous = { x: origin.x, y: origin.floor ?? origin.y + size * 2 };
  const endY = target.floor ?? target.y + size * 2;
  for (let i = 1; i <= count; i += 1) {
    const at = i / count;
    if (at > progress * 1.8) break;
    const next = { x: lerp(origin.x, target.x, at), y: lerp(origin.floor ?? origin.y + size * 2, endY, at) + (i % 2 ? size * 0.68 : -size * 0.44) };
    pixelLine(context, colors[2], previous, next, size * 0.82);
    pixelLine(context, colors[i % 2], previous, next, 2);
    previous = next;
  }
  burst(context, { ...frame, target: { x: target.x, y: endY } }, 0.52);
}

function spikes(context, frame) {
  const { target, progress, size, count, colors } = frame;
  const floor = target.floor ?? target.y + size;
  for (let i = 0; i < count; i += 1) {
    const rise = clamp((progress - i * 0.027) / 0.29);
    if (!rise) continue;
    const x = target.x + (i - (count - 1) / 2) * size * 0.63;
    const height = rise * size * (1.4 + (i % 3) * 0.57);
    for (let step = 0; step < 4; step += 1) {
      const width = size * (0.9 - step * 0.2);
      const y = floor - height * (step / 4 + 0.125);
      pixel(context, colors[2], x, y, width + 2, height / 4 + 1);
      pixel(context, colors[0], x, y, width, height / 4 + 1);
      pixel(context, colors[1], x - width * 0.27, y, 2, height / 4 + 1);
    }
  }
  burst(context, frame, 0.45);
}

function slam(context, frame) {
  const { variant, progress, target, size, colors } = frame;
  const floor = target.floor ?? target.y;
  if (variant === 'weight' && progress < 0.48) {
    const y = floor - (1 - progress / 0.48) * size * 5.4;
    glow(context, colors, target.x, y, size * 1.6);
  }
  const start = variant === 'weight' ? 0.42 : 0.1;
  burst(context, { ...frame, target: { x: target.x, y: floor }, size: size * 1.55 }, start);
  if (progress < start) return;
  const at = (progress - start) / (1 - start);
  for (let i = 0; i < 2; i += 1) {
    const distance = size * (i + 1) * (1 + at * 1.7);
    pixel(context, colors[i], target.x, floor + i * 3, distance, 2);
    if (variant === 'stomp') {
      const trail = distance + size * 0.65;
      const y = floor - i * 5 - at * size * 0.85;
      pixel(context, colors[0], target.x - trail, y, size * 0.72, size * 0.37);
      pixel(context, colors[1], target.x + trail, y, size * 0.64, size * 0.29);
    }
  }
}

function slash(context, frame) {
  const { origin, target, progress, size, colors, variant } = frame;
  const direction = Math.sign(target.x - origin.x) || 1;
  const reach = clamp(progress / 0.53);
  const center = { x: lerp(origin.x, target.x, reach), y: lerp(origin.y, target.y, reach) };
  const passes = variant === 'claws' ? 3 : variant === 'cross' ? 2 : 1;
  for (let i = 0; i < passes; i += 1) {
    const shift = (i - (passes - 1) / 2) * (variant === 'claws' ? size * 0.68 : 0);
    const sign = variant === 'cross' && i ? -direction : direction;
    const width = size * (variant === 'crescent' ? 2.35 : 1.7);
    const start = { x: center.x - width * sign + shift, y: center.y - width };
    const middle = { x: center.x + shift + sign * (variant === 'crescent' ? size : size * 0.35), y: center.y + size * 0.12 };
    const end = { x: center.x + width * sign * (variant === 'crescent' ? 0.28 : 1) + shift, y: center.y + width };
    pixelLine(context, colors[2], start, middle, size * 0.67);
    pixelLine(context, colors[2], middle, end, size * 0.49);
    pixelLine(context, colors[0], start, middle, size * 0.44);
    pixelLine(context, colors[0], middle, end, size * 0.31);
    pixelLine(context, colors[1], start, middle, 2);
  }
  burst(context, frame, 0.49);
}

function spiral(context, frame) {
  const { origin, target, progress, size, count, colors, variant } = frame;
  const reach = clamp(progress / 0.67);
  const inward = variant === 'inward';
  const center = inward ? target : { x: lerp(origin.x, target.x, reach), y: lerp(origin.y, target.y, reach) };
  const spin = variant === 'vortex' || inward ? -1 : 1;
  const contraction = inward ? 1.65 - reach * 1.43 : 1;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count * tau * 1.65 + reach * 10) * spin;
    const radius = size * (0.5 + i / count * 2) * contraction;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * 0.68 - i * size * 0.14;
    pixel(context, colors[2], x, y + 1, size * 0.76, size * 0.4);
    pixel(context, colors[i % 2], x, y, size * 0.64, 2);
  }
  if (!inward) burst(context, frame);
}

function bolt(context, frame) {
  const { origin, target, progress, size, count, colors, variant } = frame;
  const strikes = variant === 'storm' ? 3 : 1;
  for (let strike = 0; strike < strikes; strike += 1) {
    const at = clamp((progress - strike * 0.1) / 0.6);
    if (!at) continue;
    const shift = (strike - (strikes - 1) / 2) * size * 1.6;
    const start = variant === 'storm' ? { x: target.x + shift, y: target.y - size * 5 } : origin;
    const end = { x: target.x + shift / 2, y: target.y };
    let previous = start;
    for (let i = 1; i <= count; i += 1) {
      const part = (i / count) * Math.min(1, at * 3.8);
      const zig = i === count ? 0 : (i % 2 ? size : -size * 0.7);
      const point = { x: lerp(start.x, end.x, part) + zig * (variant === 'storm' ? 1 : 0.3), y: lerp(start.y, end.y, part) + (variant === 'storm' ? 0 : zig) };
      pixelLine(context, colors[2], previous, point, size * 0.62);
      pixelLine(context, colors[0], previous, point, size * 0.42);
      pixelLine(context, colors[1], previous, point, 2);
      previous = point;
    }
  }
  burst(context, frame, 0.24);
}

function shower(context, frame) {
  const { target, progress, size, count, colors, variant } = frame;
  for (let i = 0; i < count; i += 1) {
    const at = progress * 2.05 - i * 0.075;
    if (at < 0 || at > 1) continue;
    const fall = (1 - at) * size * 5.3;
    const x = target.x + Math.sin(i * 2.4) * size * 2.15 + (variant === 'meteors' ? fall * 0.62 : Math.sin(at * 5 + i) * size * 0.43);
    const y = target.y - fall + Math.cos(i * 2) * size;
    if (variant === 'rocks') {
      const width = size * (0.65 + i % 3 * 0.2);
      pixel(context, colors[2], x, y, width + 2, width);
      pixel(context, colors[0], x, y, width, width * 0.68);
      pixel(context, colors[1], x - width * 0.15, y - width * 0.25, width * 0.55, 2);
    } else if (variant === 'leaves' || variant === 'steel') {
      pixelLine(context, colors[2], { x, y }, { x: x + size * 0.7, y: y - size * 0.7 }, size * 0.43);
      pixelLine(context, colors[i % 2], { x, y }, { x: x + size * 0.7, y: y - size * 0.7 }, 2);
    } else {
      glow(context, colors, x, y, size * (0.53 + i % 3 * 0.17));
      if (variant === 'meteors') pixelLine(context, colors[0], { x, y }, { x: x + size * 0.9, y: y - size * 1.4 }, 2);
      if (variant === 'stars') pixel(context, colors[1], x, y, size * 0.75, 2);
    }
  }
  burst(context, frame, 0.49);
}

function ring(context, frame) {
  const { target, progress, size, count, colors, variant } = frame;
  const radius = size * (1.2 + progress * 1.6);
  const points = Math.max(8, count * 2);
  if (variant === 'eclipse') {
    const diskRadius = Math.round(radius * Math.min(0.82, progress * 2.9));
    for (let row = -diskRadius; row <= diskRadius; row += 2) {
      const halfWidth = Math.sqrt(diskRadius ** 2 - row ** 2);
      pixel(context, colors[2], target.x, target.y + row * 0.9, halfWidth * 2, 2);
    }
  }
  for (let i = 0; i < points; i += 1) {
    const angle = i * tau / points + progress * 2;
    const x = target.x + Math.cos(angle) * radius;
    const y = target.y + Math.sin(angle) * radius * (variant === 'eclipse' ? 0.87 : 0.66);
    pixel(context, colors[2], x, y, size * 0.49);
    pixel(context, colors[0], x, y, size * 0.34);
    if (i % 3 === 0) pixel(context, colors[1], x - 1, y - 1, Math.max(1, size * 0.2));
    if (variant === 'armor' && i % 4 === 0) pixel(context, colors[0], x, y + size * 0.7, size * 0.57, 2);
    if (variant === 'spark' && i % 4 === 0) glow(context, colors, x, y, size * 0.65);
  }
  if (variant === 'guard') {
    const y = target.y - size * 1.3 * progress;
    pixel(context, colors[1], target.x, y, size * 0.23, size * 0.95);
    pixel(context, colors[1], target.x, y, size * 0.95, size * 0.23);
  }
}

function roots(context, frame) {
  const { origin, target, progress, size, count, colors } = frame;
  const near = clamp(progress * 1.75);
  const floor = target.floor ?? target.y + size;
  for (let i = 0; i < count; i += 1) {
    const spread = (i - (count - 1) / 2) * size * 0.71;
    const start = { x: lerp(origin.x, target.x + spread * 1.5, near), y: lerp(origin.floor ?? origin.y + size, floor, near) };
    const rise = size * (0.8 + i % 3 * 0.54) * near;
    const turn = { x: start.x - spread * 0.47, y: start.y - rise * 0.58 };
    const tip = { x: turn.x + (i % 2 ? size * 0.55 : -size * 0.55), y: turn.y - rise };
    pixelLine(context, colors[2], start, turn, size * 0.58);
    pixelLine(context, colors[0], start, turn, size * 0.37);
    pixelLine(context, colors[0], turn, tip, size * 0.32);
    pixel(context, colors[1], tip.x, tip.y, size * 0.51, size * 0.34);
  }
  burst(context, frame, 0.55);
}

const shapes = { orb, stream, wave, beam, meteor, bubbles, fissure, spikes, slam, slash, spiral, bolt, shower, ring, roots };

export function drawAuradonMoveFrame(context, { effect, progress, origin, target }) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  const draw = shapes[effect.shape];
  if (!draw || progress >= 1) return;
  context.save();
  context.globalAlpha = Math.min(1, (1 - progress) * 5);
  draw(context, { ...effect, progress: clamp(progress), origin, target: effect.self ? origin : target });
  context.restore();
}

function battleAnchor(arena, rect, canvas, side) {
  const combatant = arena.querySelector(`.auradon-battle-combatant[data-side="${side}"]`);
  const sprite = combatant?.querySelector('img') || combatant;
  const bounds = sprite?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return null;

  const height = canvas.height / rect.height;
  return {
    x: (bounds.left + bounds.width / 2 - rect.left) / rect.width * canvas.width,
    y: (bounds.top + bounds.height * 0.6 - rect.top) * height,
    floor: (bounds.top + bounds.height * 0.92 - rect.top) * height,
  };
}

function noEffect() {
  return { finished: Promise.resolve(), cancel() {} };
}

export function playAuradonMoveEffect({ arena, moveId, casterIndex } = {}) {
  const effect = getAuradonMoveEffect(moveId);
  const view = arena?.ownerDocument?.defaultView;
  if (!effect || !view?.requestAnimationFrame || view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return noEffect();

  const rect = arena.getBoundingClientRect();
  if (!rect.width || !rect.height) return noEffect();
  const canvas = arena.ownerDocument.createElement('canvas');
  canvas.width = Math.max(1, Math.round((arena.clientWidth || rect.width) / 2));
  canvas.height = Math.max(1, Math.round((arena.clientHeight || rect.height) / 2));
  const origin = battleAnchor(arena, rect, canvas, casterIndex);
  const target = effect.self ? origin : battleAnchor(arena, rect, canvas, 1 - casterIndex);
  if (!origin || !target) return noEffect();

  let context;
  try {
    context = canvas.getContext('2d');
  } catch {
    return noEffect();
  }
  if (!context) return noEffect();
  context.imageSmoothingEnabled = false;
  canvas.dataset.battleEffect = '';
  canvas.dataset.moveId = moveId;
  canvas.dataset.casterIndex = casterIndex;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block',
    imageRendering: 'pixelated', pointerEvents: 'none', zIndex: '1',
  });

  let resolveFinished;
  const finished = new Promise(resolve => { resolveFinished = resolve; });
  let frameId;
  let timeoutId;
  let stopped = false;
  const cancel = () => {
    if (stopped) return;
    stopped = true;
    view.cancelAnimationFrame(frameId);
    view.clearTimeout(timeoutId);
    canvas.remove();
    resolveFinished();
  };
  const start = view.performance.now();
  const draw = time => {
    const progress = (time - start) / effect.duration;
    if (progress >= 1 || !canvas.isConnected) {
      cancel();
      return;
    }
    drawAuradonMoveFrame(context, { effect, progress, origin, target });
    frameId = view.requestAnimationFrame(draw);
  };

  arena.append(canvas);
  draw(start);
  if (!stopped) timeoutId = view.setTimeout(cancel, effect.duration + 60);
  return { finished, cancel };
}
