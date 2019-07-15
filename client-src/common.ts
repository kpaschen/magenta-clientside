import * as mm from '@magenta/music';
import * as m2n from './miditonote';

export const CHECKPOINTS_DIR = 'http://localhost:3000/checkpoints';

const SOUNDFONT_URL =
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus';

const createPlayerButton = (seq: mm.INoteSequence, el: SVGSVGElement) => {
    const visualizer = new mm.PianoRollSVGVisualizer(seq, el as SVGSVGElement);
    const container = el.parentElement as HTMLDivElement;

    const callbackObject = {
        run: (note: mm.NoteSequence.Note) => {
            const currentNotePosition = visualizer.redraw(note);

            // See if we need to scroll the container.
            const containerWidth = container.getBoundingClientRect().width;
            if (currentNotePosition > (container.scrollLeft + containerWidth)) {
                container.scrollLeft = currentNotePosition - 20;
            }
        },
        stop: () => { }
    };
    const button = document.createElement('button');
    button.textContent = 'Play';

    let player = new mm.SoundFontPlayer(
        SOUNDFONT_URL, undefined, undefined, undefined, callbackObject);
    player.loadSamples(seq).then(() => button.disabled = false);

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

const createPlayer = (seq: mm.INoteSequence) => {
    const div = document.createElement('div');
    div.classList.add('player-container');
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('visualizer-container');
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    containerDiv.appendChild(el);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.appendChild(createPlayerButton(seq, el));

    div.appendChild(buttonsDiv);
    div.appendChild(containerDiv);
    return div;
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

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'View NoteSequence';
    details.appendChild(summary);

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
    // TODO: also append the pitch names here, if they have been populated.
    details.appendChild(createPlayer(seq));
    details.appendChild(seqText);
    element.appendChild(details);
}
