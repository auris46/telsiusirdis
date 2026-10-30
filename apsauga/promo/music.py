"""Sugeneruoja foninę muziką ir garso efektus reklaminiam video (be autorinių teisių apribojimų).
Naudojimas: python3 music.py išvestis.wav"""
import sys
import numpy as np

SR = 44100
DUR = 30.0
n = int(SR * DUR)
t = np.arange(n) / SR
out = np.zeros(n)

def note(freq, start, length, amp, attack=0.02, release=0.3, harm=(1.0, 0.25, 0.08)):
    s, e = int(start * SR), min(n, int((start + length + release) * SR))
    if s >= n:
        return
    tt = np.arange(e - s) / SR
    wave = sum(a * np.sin(2 * np.pi * freq * (k + 1) * tt) for k, a in enumerate(harm))
    env = np.minimum(1, tt / attack)
    rel_start = length
    env = env * np.where(tt > rel_start, np.exp(-(tt - rel_start) / max(release, 1e-3) * 3), 1)
    out[s:e] += amp * wave * env

def pluck(freq, start, amp=0.10, decay=0.45):
    s = int(start * SR)
    e = min(n, s + int(SR * 1.6))
    tt = np.arange(e - s) / SR
    wave = np.sin(2 * np.pi * freq * tt) + 0.3 * np.sin(2 * np.pi * 2 * freq * tt)
    out[s:e] += amp * wave * np.exp(-tt / decay) * np.minimum(1, tt / 0.004)

def hz(name):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    return 440.0 * 2 ** ((names[name[:-1]] + 12 * (int(name[-1]) - 4)) / 12)

# Akordų seka pagal sceną
chords = [
    (0.0, 7.5, ['A2', 'E3', 'A3', 'C4']),       # įtampa: gauta žinutė
    (7.5, 4.5, ['F2', 'C3', 'F3', 'A3']),       # sprendimas: ekrano nuotrauka
    (12.0, 5.5, ['D2', 'A2', 'D3', 'F3']),      # įspėjimas
    (17.5, 2.15, ['C3', 'G3', 'C4', 'E4']),     # pakylėjimas: funkcijos
    (19.65, 2.15, ['G2', 'D3', 'G3', 'B3']),
    (21.8, 2.15, ['A2', 'E3', 'A3', 'C4']),
    (23.95, 2.35, ['F2', 'C3', 'F3', 'A3']),
    (26.3, 3.7, ['C3', 'G3', 'C4', 'E4', 'G4']),  # pabaiga
]
for start, length, notes in chords:
    for nm in notes:
        note(hz(nm), start, length, 0.045, attack=0.6, release=0.8, harm=(1.0, 0.18, 0.05))

# Arpedžio nuo 7,5 s (100 BPM aštuntinės)
step = 0.3
for start, length, notes in chords[1:]:
    seq = [notes[1], notes[2], notes[3] if len(notes) > 3 else notes[2], notes[2]]
    k = 0
    tt0 = start
    while tt0 < start + length - 0.05 and tt0 < 29.0:
        f = hz(seq[k % len(seq)]) * 2
        pluck(f, tt0, amp=0.055 if start < 17.5 else 0.075)
        tt0 += step
        k += 1

# Lengvas ritmas nuo 17,5 s
for i, b in enumerate(np.arange(17.5, 26.2, 0.6)):
    s = int(b * SR); e = min(n, s + int(0.18 * SR)); tt = np.arange(e - s) / SR
    out[s:e] += 0.18 * np.sin(2 * np.pi * (90 * np.exp(-tt * 18) + 45) * tt) * np.exp(-tt * 22)

# Garso efektai
def thud(at, amp=0.35):
    s = int(at * SR); e = s + int(0.35 * SR); tt = np.arange(e - s) / SR
    out[s:e] += amp * np.sin(2 * np.pi * (140 * np.exp(-tt * 9) + 50) * tt) * np.exp(-tt * 9)
def beep(at, f, length=0.12, amp=0.12):
    note(f, at, length, amp, attack=0.005, release=0.05, harm=(1.0, 0.3))
def shutter(at):
    rng = np.random.default_rng(7)
    for off in (0.0, 0.07):
        s = int((at + off) * SR); e = s + int(0.05 * SR); tt = np.arange(e - s) / SR
        out[s:e] += 0.22 * rng.standard_normal(e - s) * np.exp(-tt * 70)

beep(0.6, hz('E5'), 0.08, 0.10); beep(0.75, hz('A5'), 0.12, 0.10)   # SMS gauta
thud(5.35); beep(5.38, hz('A#4'), 0.25, 0.10)                       # STOP
shutter(8.0)                                                         # ekrano nuotrauka
beep(9.62, hz('C6'), 0.05, 0.06)                                     # mygtuko paspaudimas
for k in range(2): beep(12.05 + k * 0.22, hz('E5'), 0.13, 0.12)     # įspėjimas
for k, at in enumerate([13.0, 13.7, 14.4]): beep(at, hz('A4'), 0.05, 0.05)
beep(15.3, hz('C5'), 0.08, 0.07); beep(15.42, hz('G5'), 0.15, 0.07)  # „jūs saugūs“
for k, nm in enumerate(['C5', 'E5', 'G5', 'C6']): beep(26.3 + k * 0.09, hz(nm), 0.3, 0.07)

# Pradžios ir pabaigos išblukinimas, normalizavimas
out *= np.minimum(1, t / 0.3) * np.minimum(1, (DUR - t) / 1.2)
out = np.tanh(out * 1.6) / 1.6
out *= 0.6 / np.max(np.abs(out))
pcm = (out * 32767).astype('<i2')

import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('Sukurta', sys.argv[1])
