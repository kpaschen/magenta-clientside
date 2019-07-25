import * as mm from '@magenta/music';
import * as common from './common';
import { isNull, isNullOrUndefined } from 'util';

class Recorder {
    isRecording: boolean = false;
    recordingObj: any = null;
    audioChunks = [];
    audioEl: HTMLAudioElement;

    melody: mm.INoteSequence;
    oafA: mm.OnsetsAndFrames;
    ready: Promise<void>;

    animationHandle: number = undefined;
    analyzer: AnalyserNode = undefined;

    constructor() {
        this.oafA = new mm.OnsetsAndFrames(`${common.CHECKPOINTS_DIR}/transcription/onsets_frames_uni`);
        this.ready = new Promise((resolve, reject) => {
            this.oafA.initialize().then((result) => {
                common.statusMessages().removeStatusMessage('Loading oafa model');
                const btn = document.getElementById('recordBtn');
                btn.removeAttribute('disabled');
                resolve(undefined);
            }
            ).catch(failure => { console.log(failure); })
        });
    }

    disposeModels() {
        this.oafA.dispose();
    }

    async transcribeFromFile(blob) {
        const el = document.getElementById('record-results');
        if (!isNullOrUndefined(el)) {
            const details = el.getElementsByClassName("player-container");
            while (details.length > 0) {
                el.removeChild(details[0]);
            }
        }
        this.ready.then(async () => {
            const ns = await this.oafA.transcribeFromAudioFile(blob);
            this.melody = ns;
            common.writeNoteSeqs(`record-results`, ns);
            const rnnBtn = document.getElementById('startRnn');
            if (!isNullOrUndefined(rnnBtn)) {
                rnnBtn.removeAttribute('disabled');
            }
            common.statusMessages().removeStatusMessage('Transcribing');
        });
    }

    initCanvas() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('sound-visualization');
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        // TODO: move these to a better place.
        common.statusMessages().addStatusMessage('Loading oafa model');
        common.statusMessages().addStatusMessage('Loading Rnn Models');
    }

    draw = function () {
        this.animationHandle = requestAnimationFrame(this.draw.bind(this));
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('sound-visualization');
        const canvasCtx = canvas.getContext('2d');
        const WIDTH = canvas.width
        const HEIGHT = canvas.height;
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const bufferLength = this.analyzer.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);
        this.analyzer.getByteTimeDomainData(dataArray);

        canvasCtx.beginPath();
        const sliceWidth = WIDTH * 1.0 / bufferLength;
        let x = 0;

        for (var i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * HEIGHT / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(WIDTH, HEIGHT / 2);
        canvasCtx.stroke();
    };

    async visualize(stream) {
        const source = mm.Player.tone.context.createMediaStreamSource(stream);
        this.analyzer = mm.Player.tone.context.createAnalyser();
        this.analyzer.fftSize = 2048;
        source.connect(this.analyzer);
        this.draw.bind(this)();
    }

    stopRecording = () => {
        const recordBtn = <HTMLAudioElement>document.getElementById('recordBtn');
        this.recordingObj.stop();
        cancelAnimationFrame(this.animationHandle);
        this.isRecording = false;
        recordBtn.textContent = 'Record';
        common.statusMessages().removeStatusMessage('Recording');
    }

    record = () => {
        const recordBtn = <HTMLAudioElement>document.getElementById('recordBtn');
        mm.Player.tone.context.resume();
        if (this.isRecording && !isNull(this.recordingObj)) {
            this.stopRecording();
        } else {
            this.isRecording = true;
            this.audioChunks = [];
            recordBtn.textContent = 'Stop recording';
            const myTimer = setTimeout(function () { this.stopRecording(); }.bind(this), 10000);
            common.statusMessages().addStatusMessage('Recording');
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                this.recordingObj = new MediaRecorder(stream);
                this.visualize(stream);

                this.recordingObj.addEventListener('dataavailable', e => {
                    this.audioChunks.push(e.data);
                });
                this.recordingObj.onstop = function () {
                    const blob = new Blob(recorder.audioChunks);
                    common.statusMessages().addStatusMessage('Transcribing');
                    recorder.transcribeFromFile(blob);
                    if (!isNullOrUndefined(myTimer)) {
                        clearTimeout(myTimer);
                    }
                }
                this.recordingObj.start(1000);
            }).catch(err => {
                this.isRecording = false;
                recordBtn.textContent = 'Record';
                console.log('error getting user media: ' + err);
            });
        }
    }
}

let recorder = new Recorder();
module.exports = recorder;
