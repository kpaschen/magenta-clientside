import * as mm from '@magenta/music';
import { round } from '@tensorflow/tfjs';

export function stepAndOctave(inPitch) {
    if (inPitch <= 20) { return { 'step': "C", 'octave': 0 }; }
    let octave = 0;
    if (inPitch >= 120) {
        octave = 9;
    }
    else if (inPitch >= 108) { octave = 8; }
    else if (inPitch >= 96) { octave = 7; }
    else if (inPitch >= 84) { octave = 6; }
    else if (inPitch >= 72) { octave = 5; }
    else if (inPitch >= 60) { octave = 4; }
    else if (inPitch >= 48) { octave = 3; }
    else if (inPitch >= 36) { octave = 2; }
    else if (inPitch >= 24) { octave = 1; }
    else { octave = 0; }

    const steps = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    let step = steps[(inPitch % 12)];

    return { 'step': step, 'octave': octave };
}

export function castTo12Tone(seqIn: mm.INoteSequence): mm.NoteSequence {
    let ret: mm.NoteSequence = mm.sequences.clone(seqIn);
    ret.notes.map((n) => { n.pitch = Math.round(n.pitch); });
    return ret;
}

export function mapToPitchRange(seqIn: mm.INoteSequence, minPitch, maxPitch): mm.NoteSequence {
    let ret: mm.NoteSequence = mm.sequences.clone(seqIn);
    let actualMinPitch = maxPitch;
    let actualMaxPitch = minPitch;
    ret.notes.forEach((n) => {
        if (n.pitch >= actualMaxPitch) { actualMaxPitch = n.pitch; }
        if (n.pitch <= actualMinPitch) { actualMinPitch = n.pitch; }
    });

    if (actualMinPitch >= minPitch && actualMaxPitch <= maxPitch) {
        // Nothing to do, we're within the right pitch range already.
        return ret;
    }
    const actualRange = actualMaxPitch - actualMinPitch;
    const targetRange = maxPitch - minPitch;
    if (actualRange <= targetRange) {
        // Just need to shift.
        if (actualMinPitch < minPitch) {
            const shiftBy = minPitch - actualMinPitch;
            ret.notes.map((n) => { n.pitch += shiftBy; });
            return ret;
        }
        // actualMaxPitch > maxPitch
        const shiftBy = actualMaxPitch - maxPitch;
        ret.notes.map((n) => { n.pitch -= shiftBy; });
        return ret;
    }
    // Have to shrink.
    const ratio = (maxPitch - minPitch) / (actualMaxPitch - actualMinPitch);
    const newStart = minPitch - actualMinPitch;

    ret.notes.forEach(n => {
        const dist = n.pitch - actualMinPitch;
        n.pitch = (n.pitch + newStart) + (dist * ratio);
        if (n.pitch > maxPitch) { n.pitch = maxPitch; }
        if (n.pitch < minPitch) { n.pitch = minPitch; }
    });
    return ret;
}