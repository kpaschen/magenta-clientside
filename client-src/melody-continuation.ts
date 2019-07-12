import * as tf from '@tensorflow/tfjs';

import * as mm from '@magenta/music';
import * as common from './common';
import * as m2n from './miditonote';

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
      this.melodyRnn.initialize().then((result) => {
        // Update display
        common.removeStatusMessage('rnn-model-loading-status');
        resolve(undefined);
      }
      ).catch(failure => { alert(failure); })
    });
  }

  disposeModels() {
    this.melodyRnn.dispose();
  }

  async runMelodyRnn(noteSequence) {
    common.addStatusMessage('status-messages', 'composing', 'Composing');
    // Display the input.
    let qns = mm.sequences.quantizeNoteSequence(noteSequence, 4);
    qns = m2n.mapToPitchRange(qns, this.melodyRnnSpec.dataConverter.args.minPitch,
      this.melodyRnnSpec.dataConverter.args.maxPitch);
    qns = m2n.castTo12Tone(qns);
    // This will show the inputs modified for the rnn. A bit of a hack: remove previously
    // visualized inputs here (but not the composition results in melody-cont-results) since
    // the inputs won't change barring re-recording. It would be cleaner to avoid
    // transforming the inputs redundantly as well.
    const inpEl = document.getElementById('melody-cont-inputs');
    let details = inpEl.getElementsByTagName("details");
    while (details.length > 0) {
      inpEl.removeChild(details[0]);
    }
    common.writeNoteSeqs('melody-cont-inputs', qns, true);
    // Take a guess at a step to harmonize with.
    const hm = m2n.stepAndOctave(qns.notes[qns.notes.length - 1].pitch).step;
    const continuation = await this.melodyRnn.continueSequence(qns, 20, 1.0, [hm]);
    console.log('continuation; ');
    console.log(continuation);
    common.writeNoteSeqs('melody-cont-results', continuation, true);
    common.removeStatusMessage('composing');
  }
}

const melody = new Melody();
export = melody;
