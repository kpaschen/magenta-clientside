import * as tf from '@tensorflow/tfjs';

import * as mm from '@magenta/music';
import * as common from './common';

const MEL_CHECKPOINT = `${common.CHECKPOINTS_DIR}/music_rnn/basic_rnn`;
const DRUMS_CHECKPOINT = `${common.CHECKPOINTS_DIR}/music_rnn/drum_kit_rnn`;
const IMPROV_CHECKPOINT = `${common.CHECKPOINTS_DIR}/music_rnn/chord_pitches_improv`;

const MELODY_NS: mm.INoteSequence = {
  ticksPerQuarter: 220,
  totalTime: 1.5,
  timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
  tempos: [{ time: 0, qpm: 120 }],
  notes: [
    {
      instrument: 0,
      program: 0,
      startTime: 0,
      endTime: 0.5,
      pitch: 60,
      velocity: 100,
      isDrum: false
    },
    {
      instrument: 0,
      program: 0,
      startTime: 0.5,
      endTime: 1.0,
      pitch: 60,
      velocity: 100,
      isDrum: false
    },
    {
      instrument: 0,
      program: 0,
      startTime: 1.0,
      endTime: 1.5,
      pitch: 67,
      velocity: 100,
      isDrum: false
    },
    {
      instrument: 0,
      program: 0,
      startTime: 1.5,
      endTime: 2.0,
      pitch: 67,
      velocity: 100,
      isDrum: false
    }
  ]
};

const MELODY_2_NS: mm.INoteSequence = {
  ticksPerQuarter: 220,
  totalTime: 1.5,
  timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
  notes: [
    {
      startTime: 0,
      endTime: 0.5,
      pitch: 60,
      velocity: 100,
    },
    {
      startTime: 0.5,
      endTime: 1.0,
      pitch: 60,
      velocity: 100,
    },
    {
      startTime: 1.0,
      endTime: 1.5,
      pitch: 67,
      velocity: 100,
    },
    {
      startTime: 1.5,
      endTime: 2.0,
      pitch: 67,
      velocity: 100,
    }
  ]
};

class Melody {

  ready: Promise<void>;
  melodyRnn: mm.MusicRNN;
  melodyRnnSpec: any;

  constructor() {
    this.melodyRnn = new mm.MusicRNN(IMPROV_CHECKPOINT);
    this.ready = new Promise((resolve, reject) => {
      // This is just to get access to the min and max pitch values.
      fetch(`${IMPROV_CHECKPOINT}/config.json`).then((spec) => {
        return spec.json()
      }).then((json) => {
        console.log(JSON.stringify(json));
        this.melodyRnnSpec = json;
      });
      this.melodyRnn.initialize().then((result) => { resolve(undefined); }
      )
    });
  }

  disposeModels() {
    this.melodyRnn.dispose();
  }

  adjustPitches(seqs: mm.INoteSequence, minPitch, maxPitch) {
    let actualMinPitch = 100;
    let actualMaxPitch = 0;

    seqs.notes.forEach(n => {
      if (n.pitch < actualMinPitch) { actualMinPitch = n.pitch; }
      if (n.pitch > actualMaxPitch) { actualMaxPitch = n.pitch; }
    });

    // Have to fit the actual pitches into the spec pitches.
    // This maps them onto the whole range, which really distorts the
    // melody though.
    const ratio = (maxPitch - minPitch) / (actualMaxPitch - actualMinPitch);
    const newStart = minPitch - actualMinPitch;

    seqs.notes.forEach(n => {
      const dist = n.pitch - actualMinPitch;
      n.pitch = (n.pitch + newStart) + (dist * ratio);
      if (n.pitch > maxPitch) { n.pitch = maxPitch; }
      if (n.pitch < minPitch) { n.pitch = minPitch; }
    });
  }

  async runMelodyRnn(noteSequences) {
    // Display the input.
    let sequences = [];
    noteSequences.forEach(ns => {
      const qns = mm.sequences.quantizeNoteSequence(ns, 4);
      console.log('piece of original input: ');
      console.log(qns);
      this.adjustPitches(qns, this.melodyRnnSpec.dataConverter.args.minPitch,
        this.melodyRnnSpec.dataConverter.args.maxPitch);
      sequences = sequences.concat(qns);
    });
    console.log('adjusted input: ');
    console.log(sequences);

    common.writeNoteSeqs('melody-cont-inputs', sequences);
    // TODO: concatenate the note sequences.
    const continuation = await this.melodyRnn.continueSequence(sequences[0], 20, 1.0, ['C']);
    console.log('continuation; ');
    console.log(continuation);
    common.writeNoteSeqs('melody-cont-results', [continuation]);
  }
}

const melody = new Melody();
export = melody;
