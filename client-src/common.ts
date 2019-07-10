import * as mm from '@magenta/music';

export const CHECKPOINTS_DIR = 'http://localhost:3000/checkpoints';
// 'https://storage.googleapis.com/magentadata/js/checkpoints';
const SOUNDFONT_URL =
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus';

const createPlayerButton = (seq: mm.INoteSequence, useSoundFontPlayer: boolean, el: SVGSVGElement) => {
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

    // tslint:disable-next-line:no-any
    let player: any;
    if (useSoundFontPlayer) {
        player = new mm.SoundFontPlayer(
            SOUNDFONT_URL, undefined, undefined, undefined, callbackObject);
        player.loadSamples(seq).then(() => button.disabled = false);
    } else {
        player = new mm.Player(false, callbackObject);
    }

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

const createPlayer = (seq: mm.INoteSequence, useSoundFontPlayer = false) => {
    // Visualizer
    const div = document.createElement('div');
    div.classList.add('player-container');
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('visualizer-container');
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    containerDiv.appendChild(el);

    const buttonsDiv = document.createElement('div');
    // Regular player.
    buttonsDiv.appendChild(
        createPlayerButton(seq, useSoundFontPlayer, el));

    div.appendChild(buttonsDiv);
    div.appendChild(containerDiv);
    return div;
}

export const writeNoteSeqs = (elementId: string, seqs: mm.INoteSequence[],
    append = false,
    useSoundFontPlayer = false, writeVelocity = false) => {
    const element = document.getElementById(elementId);
    if (!append) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    seqs.forEach(seq => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'View NoteSequence';
        details.appendChild(summary);

        const seqText = document.createElement('span');
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
                    if (writeVelocity) {
                        s += ' v:' + n.velocity;
                    }
                    s += '}';
                    return s;
                })
                .join(', ') +
            ']';
        details.appendChild(seqText);
        console.log('appended: ' + seqText);
        details.appendChild(createPlayer(seq, useSoundFontPlayer));
        console.log('added player');
        element.appendChild(details);
        console.log('appended details');
    });
}

