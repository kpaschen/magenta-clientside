import * as mm from '@magenta/music';
import * as common from './common';
import { isNull } from 'util';

class Recorder {

    isRecording: boolean = false;
    recordingObj: any = null;
    melody_seed: mm.INoteSequence;
    melodies: mm.INoteSequence[];
    oafA: mm.OnsetsAndFrames;
    ready: Promise<void>;

    constructor() {
        this.oafA = new mm.OnsetsAndFrames(`${common.CHECKPOINTS_DIR}/transcription/onsets_frames_uni`);
        this.ready = new Promise((resolve, reject) => {
            this.oafA.initialize().then((result) => { resolve(undefined); }
            ).catch(failure => { alert(failure); })
        });

        this.melody_seed = {
            notes: [
                { pitch: 40, quantizedStartStep: 0, quantizedEndStep: 4 },
                { pitch: 50, quantizedStartStep: 4, quantizedEndStep: 7 },
                { pitch: 60, quantizedStartStep: 8, quantizedEndStep: 11 },
                { pitch: 70, quantizedStartStep: 12, quantizedEndStep: 16 },
            ],
            quantizationInfo: { stepsPerQuarter: 4 },
            tempos: [{ time: 0, qpm: 120 }],
            totalQuantizedSteps: 4,
        };

        this.melodies = [this.melody_seed];
    }

    disposeModels() {
        console.log('removing recorder model');
        this.oafA.dispose();
    }

    async transcribeFromFile(blob) {
        const audioEl: HTMLAudioElement = <HTMLAudioElement>document.getElementById('recordPlayer');
        audioEl.hidden = false;
        audioEl.src = window.URL.createObjectURL(blob);
        this.ready.then(async () => {
            const ns = await this.oafA.transcribeFromAudioFile(blob);
            this.melodies = this.melodies.concat(ns);
            common.writeNoteSeqs(`record-results`, [ns], true, false);
        });
    }

    record = () => {
        const recordBtn = <HTMLAudioElement>document.getElementById('recordBtn');
        mm.Player.tone.context.resume();
        if (this.isRecording && !isNull(this.recordingObj)) {
            this.recordingObj.stop();
            this.isRecording = false;
            recordBtn.textContent = 'Record';
        } else {
            this.isRecording = true;
            this.melodies = [];
            recordBtn.textContent = 'Stop recording';
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                this.recordingObj = new MediaRecorder(stream);
                this.recordingObj.addEventListener('dataavailable', e => {
                    this.transcribeFromFile(e.data);
                });
                this.recordingObj.start(5000);
            }).catch(err => {
                this.isRecording = false;
                recordBtn.textContent = 'Record';
                alert(err);
            })
        }
    }
}

let recorder = new Recorder();
module.exports = recorder;
