import * as tf from '@tensorflow/tfjs';

import * as mm from '@magenta/music/es6';
import * as common from './common';
import * as m2n from './miditonote';

class Melody {

  ready: Promise<void>;
  models = {
    'Basic': {
      path: `${common.CHECKPOINTS_DIR}/music_rnn/basic_rnn`,
      spec: undefined, model: undefined,
      supportChords: false,
    },
    'Melody': {
      path: `${common.CHECKPOINTS_DIR}/music_rnn/melody_rnn`,
      spec: undefined, model: undefined,
      supportChords: false,
    },
    'Chords': {
      path: `${common.CHECKPOINTS_DIR}/music_rnn/chord_pitches_improv`,
      spec: undefined, model: undefined,
      supportChords: true
    }
  };

  constructor() {

    this.models.Melody.model = new mm.MusicRNN(this.models.Melody.path);
    this.models.Chords.model = new mm.MusicRNN(this.models.Chords.path);
    this.models.Basic.model = new mm.MusicRNN(this.models.Basic.path);

    common.statusMessages().addStatusMessage('compose', 'Loading Composition Models');
    this.ready = new Promise((resolve, reject) => {
      // This is just to get access to the min and max pitch values.
      fetch(`${this.models.Melody.path}/config.json`).then((spec) => {
        spec.json().then((json) => {
          console.log(JSON.stringify(json));
          this.models.Melody.spec = json;
        });
      });
      fetch(`${this.models.Chords.path}/config.json`).then((spec) => {
        spec.json().then((json) => {
          console.log(JSON.stringify(json));
          this.models.Chords.spec = json;
        });
      });
      fetch(`${this.models.Basic.path}/config.json`).then((spec) => {
        spec.json().then((json) => {
          console.log(JSON.stringify(json));
          this.models.Basic.spec = json;
        });
      });
      this.models.Melody.model.initialize().then((result) => {
        this.models.Chords.model.initialize().then((result) => {
          this.models.Basic.model.initialize().then((results) => {
            // Update display
            common.statusMessages().removeStatusMessage('compose', 'Loading Composition Models');
            resolve(undefined);
          })
        })
      }).catch(failure => { alert(failure); })
    });
  }

  disposeModels() {
    this.models.Melody.model.dispose();
    this.models.Chords.model.dispose();
    this.models.Basic.model.dispose();
  }

  async runMusicRnn(noteSequence, generatorType) {
    common.statusMessages().addStatusMessage('compose', 'Composing');
    // Display the input.
    let qns = mm.sequences.quantizeNoteSequence(noteSequence, 4);
    let modelType = this.models[generatorType];
    qns = m2n.mapToPitchRange(qns, modelType.spec.dataConverter.args.minPitch,
      modelType.spec.dataConverter.args.maxPitch);
    qns = m2n.castTo12Tone(qns);
    // This will show the inputs modified for the rnn. A bit of a hack: remove previously
    // visualized inputs here (but not the composition results in melody-cont-results) since
    // the inputs won't change barring re-recording. It would be cleaner to avoid
    // transforming the inputs redundantly as well.
    const inpEl = document.getElementById('melody-cont-inputs');
    while (inpEl.childElementCount > 0) {
      inpEl.removeChild(inpEl.firstChild);
    }
    common.writeNoteSeqs('melody-cont-inputs', qns);
    let continuation = undefined;
    if (modelType.supportChords) {
      // Take a guess at a step to harmonize with.
      const hm = m2n.stepAndOctave(qns.notes[qns.notes.length - 1].pitch).step;
      continuation = await modelType.model.continueSequence(qns, 30, 1.0, [hm]);
    } else {
      continuation = await modelType.model.continueSequence(qns, 30, 1.0);
    }
    console.log('continuation; ');
    console.log(continuation);
    common.writeNoteSeqs('melody-cont-results', continuation);
    common.statusMessages().removeStatusMessage('compose', 'Composing');
  }
}

const melody = new Melody();
export = melody;
