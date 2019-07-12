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
                common.removeStatusMessage('oafa-model-loading-status');
                const btn = document.getElementById('recordBtn');
                btn.removeAttribute('disabled');
                resolve(undefined);
            }
            ).catch(failure => { console.log(failure); })
        });
    }

    disposeModels() {
        console.log('removing recorder model');
        this.oafA.dispose();
    }

    async transcribeFromFile(blob) {
        const el = document.getElementById('record-results');
        if (!isNullOrUndefined(el)) {
            const details = el.getElementsByTagName("details");
            while (details.length > 0) {
                el.removeChild(details[0]);
            }
        }
        this.ready.then(async () => {
            const ns = await this.oafA.transcribeFromAudioFile(blob);
            this.melody = ns;
            common.writeNoteSeqs(`record-results`, ns, true, false);
            const rnnBtn = document.getElementById('startRnn');
            rnnBtn.removeAttribute('disabled');
            common.removeStatusMessage('transcribing');
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
        common.addStatusMessage('status-messages', 'oafa-model-loading-status', "Loading oafa model");
        common.addStatusMessage('status-messages', 'rnn-model-loading-status', 'Loading Rnn Models');
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

    record = () => {
        const recordBtn = <HTMLAudioElement>document.getElementById('recordBtn');
        mm.Player.tone.context.resume();
        if (this.isRecording && !isNull(this.recordingObj)) {
            this.recordingObj.stop();
            cancelAnimationFrame(this.animationHandle);
            this.isRecording = false;
            recordBtn.textContent = 'Record';
            common.removeStatusMessage('recording');
        } else {
            this.isRecording = true;
            this.audioChunks = [];
            recordBtn.textContent = 'Stop recording';
            common.addStatusMessage('status-messages', 'recording', 'Recording');
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                this.recordingObj = new MediaRecorder(stream);
                this.visualize(stream);

                this.recordingObj.addEventListener('dataavailable', e => {
                    this.audioChunks.push(e.data);
                });
                this.recordingObj.onstop = function (e) {
                    const blob = new Blob(recorder.audioChunks);
                    common.addStatusMessage('status-messages', 'transcribing', 'Transcribing audio');
                    recorder.transcribeFromFile(blob);
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
