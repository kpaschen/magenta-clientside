import * as mm from '@magenta/music';
import * as m2n from './miditonote';

export const CHECKPOINTS_DIR = 'http://localhost:3000/checkpoints';

// URLS from https://github.com/tensorflow/magenta-js/blob/master/music/README.md#soundfonts
const SGM_URL =
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus';
const PIANO_URL =
    'https://storage.googleapis.com/magentadata/js/soundfonts/salamander';

const createPlayButton = (el: SVGElement, seq: mm.INoteSequence) => {
    const button = document.createElement('button');
    button.textContent = 'Play';

    const visualizer = new mm.PianoRollSVGVisualizer(seq, el as SVGSVGElement);

    const callbackObject = {
        run: (note: mm.NoteSequence.Note) => {
            const currentNotePosition = visualizer.redraw(note, true);
        }, stop: () => { }
    };
    let player = new mm.SoundFontPlayer(SGM_URL, undefined, undefined, undefined, callbackObject);

    player.loadSamples(seq).then(() => { button.disabled = false; });

    button.addEventListener('click', () => {
        if (player.isPlaying()) {
            player.stop();
            button.textContent = 'Play';
        } else {
            player.start(visualizer.noteSequence)
                .then(() => (button.textContent = 'Play'));
            button.textContent = 'Stop';
        }
    });
    return button;
}

export const addStatusMessage = (parentId: string, elementId: string, msg: string) => {
    const el = document.getElementById(parentId);
    const readymsg = document.getElementById("ready-msg");
    readymsg.setAttribute("style", "visibility:hidden;");
    const newmsg = document.createElement("p");
    newmsg.innerText = msg;
    newmsg.setAttribute('id', elementId);
    newmsg.setAttribute('class', 'status-message');
    el.appendChild(newmsg);
};

export const removeStatusMessage = (msgElementId: string) => {
    const el = document.getElementById(msgElementId);
    const pt = el.parentElement;
    pt.removeChild(el);
    if (pt.childElementCount == 0) {
        const readymsg = document.getElementById('ready-msg');
        readymsg.setAttribute("style", "visibility:inline");
    }
}

export const writeNoteSeqs = (elementId: string, seq: mm.INoteSequence) => {
    const element = document.getElementById(elementId);
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const buttonsDiv = document.createElement('div');
    buttonsDiv.appendChild(createPlayButton(el, seq));

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'View NoteSequence';
    details.appendChild(summary);

    const containerDiv = document.createElement('div');
    containerDiv.classList.add('visualizer-container');

    containerDiv.appendChild(el);
    details.appendChild(containerDiv);

    const seqText = document.createElement('span');
    seqText.classList.add('note-sequence');
    const isQuantized = mm.sequences.isQuantizedSequence(seq);
    seqText.innerHTML = '[' +
        seq.notes
            .map(n => {
                let s = '{p:' + n.pitch + ' s:' +
                    (isQuantized ? n.quantizedStartStep :
                        n.startTime.toPrecision(2));
                const end =
                    isQuantized ? n.quantizedEndStep : n.endTime.toPrecision(3);
                if (end != null) {
                    s += ' e:' + end;
                }
                s += ' v:' + n.velocity;
                const so = m2n.stepAndOctave(n.pitch);
                s += ' st: ' + so.step;
                s += ' o: ' + so.octave;
                s += '}';
                return s;
            })
            .join(', ') +
        ']';
    details.appendChild(seqText);

    const div = document.createElement('div');
    div.classList.add('player-container');

    div.appendChild(buttonsDiv);
    div.appendChild(details);
    element.appendChild(div);
}
