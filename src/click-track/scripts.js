import { download } from "../common/js/file-saver.js";
import { ClickTrack } from "../common/js/click-track.js";
import "../common/js/vexflow.js";

const {
    Renderer,
    RenderContext,
    Stave,
    StaveNote,
    Voice,
    Formatter,
    Articulation,
    Dot,
    Tuplet,
    StaveTempo,
    Annotation,
    BarlineType,
} = Vex.Flow;

const measureWidth = 150
document.documentElement.style.setProperty('--measure-width', measureWidth + 'px')

function findClosest(number, array) {
    var indexArr = array.map(function (k) {
        return Math.abs(k - number)
    })
    var min = Math.min.apply(Math, indexArr)
    return array[indexArr.indexOf(min)]
}

const NOTE_NAMES = {
    1: 'w',
    2: 'h',
    4: 'q',
    8: '8',
    16: '16',
    32: '32',
    64: '64',
    128: '128',
    'w': 'w',
    'h': 'h',
    'q': 'q',
    'e': '8',
}

function renderMeasure(
    element,
    pattern,
    timeSig = {
        num_beats: null,
        beat_value: null,
        shown: null
    },
    tempo = {
        starting: null,
        ending: null,
        starting_note: null,
        ending_note: null,
        starting_note_dots: null,
        ending_note_dots: null,
        show_starting: null,
        show_ending: null,
        show_rit: null,
        show_acc: null,
    },
    measure,
    barline = {
        starting: null,
        ending: null,
    }
) {
    function dotted(staveNote, noteIndex = -1) {
        if (noteIndex < 0) {
            Dot.buildAndAttach([staveNote], {
                all: true,
            });
        } else {
            Dot.buildAndAttach([staveNote], {
                index: noteIndex,
            });
        }
        return staveNote;
    }

    for (let index = 0; index < element.children.length; index++) {
        const child = element.children[index];
        element.removeChild(child)
    }
    console.log(element)

    let previousMeasure = element.previousElementSibling
    let nextMeasure = element.nextElementSibling

    if (pattern == null) {
        pattern = element.getAttribute('data-rhythm').split(',')
    }
    if (typeof pattern == 'string') {
        pattern = pattern.split(',')
    }

    if (timeSig.num_beats == null) {
        timeSig.num_beats = parseInt(element.getAttribute('data-time-signature').split('/')[0])
    }
    if (timeSig.beat_value == null) {
        timeSig.beat_value = parseInt(element.getAttribute('data-time-signature').split('/')[1])
    }
    if (timeSig.shown == null) {
        timeSig.shown = true

        if (previousMeasure) {
            let previousTimeSignature = previousMeasure.getAttribute('data-time-signature')
            if (previousTimeSignature == [timeSig.num_beats, timeSig.beat_value].join('/')) {
                timeSig.shown = false
            }
        }
    }

    console.log('timeSig', timeSig)

    if (tempo.starting == null) {
        tempo.starting = parseFloat(getLastMeasureInfo(element, (m, check) => {
            if (m === element) {
                return m.getAttribute('data-starting-bpm')
            }

            if (m.getAttribute('data-ending-bpm')) {
                return m.getAttribute('data-ending-bpm')
            } else {
                return m.getAttribute('data-starting-bpm')
            }
        }))
    }
    if (tempo.ending == null) {
        tempo.ending = parseFloat(getLastMeasureInfo(element, (m, check) => {
            if (m.getAttribute('data-ending-bpm')) {
                return m.getAttribute('data-ending-bpm')
            } else {
                return m.getAttribute('data-starting-bpm')
            }
        }))
    }
    if (tempo.show_rit == null && !tempo.show_acc) {
        if (tempo.starting > tempo.ending) {
            tempo.show_rit = true
        }
    }
    if (tempo.show_acc == null && !tempo.show_rit) {
        if (tempo.starting < tempo.ending) {
            tempo.show_acc = true
        }
    }

    if (tempo.starting_note == null) {
        tempo.starting_note = 'q'
        tempo.starting_note_dots = 0

        let starting_note = getLastMeasureInfo(element, (m, check) => {
            if (m === element) {
                return m.getAttribute('data-starting-tempo-note')
            }

            if (m.getAttribute('data-ending-tempo-note')) {
                return m.getAttribute('data-ending-tempo-note')
            } else {
                return m.getAttribute('data-starting-tempo-note')
            }
        })

        console.log('starting_note:', starting_note)

        if (starting_note) {
            let dots = 0
            let duration = 'q'

            for (const letter of starting_note) {
                if (letter == 'd') {
                    dots += 1
                } else if (NOTE_NAMES[letter]) {
                    duration = NOTE_NAMES[letter]
                }
            }

            tempo.starting_note = duration
            tempo.starting_note_dots = dots
        }
    }

    if (tempo.ending_note == null) {
        tempo.ending_note = 'q'
        tempo.ending_note_dots = 0

        let ending_note = getLastMeasureInfo(element, (m, check) => {
            if (m.getAttribute('data-ending-tempo-note')) {
                return m.getAttribute('data-ending-tempo-note')
            } else {
                return m.getAttribute('data-starting-tempo-note')
            }
        })

        console.log('ending_note:', ending_note)

        if (ending_note) {
            let dots = 0
            let duration = 'q'

            for (const letter of ending_note) {
                if (letter == 'd') {
                    dots += 1
                } else if (NOTE_NAMES[letter]) {
                    duration = NOTE_NAMES[letter]
                }
            }

            tempo.ending_note = duration
            tempo.ending_note_dots = dots
        }
    }

    if (tempo.show_starting == null) {
        tempo.show_starting = true

        if (previousMeasure) {
            let previousEndingTempo = parseFloat(getLastMeasureInfo(previousMeasure, (m, check) => {
                if (m.getAttribute('data-ending-bpm')) {
                    return m.getAttribute('data-ending-bpm')
                } else {
                    return m.getAttribute('data-starting-bpm')
                }
            }))
            let previousStartingTempo = parseFloat(getLastMeasureInfo(previousMeasure, (m, check) => {
                if (m === previousMeasure) {
                    return m.getAttribute('data-starting-bpm')
                }

                if (m.getAttribute('data-ending-bpm')) {
                    return m.getAttribute('data-ending-bpm')
                } else {
                    return m.getAttribute('data-starting-bpm')
                }
            }))

            let startingNote = getLastMeasureInfo(element, (m, check) => {
                if (m === element) {
                    return m.getAttribute('data-starting-tempo-note')
                }

                if (m.getAttribute('data-ending-tempo-note')) {
                    return m.getAttribute('data-ending-tempo-note')
                } else {
                    return m.getAttribute('data-starting-tempo-note')
                }
            })

            let previousEndingNote = getLastMeasureInfo(previousMeasure, (m, check) => {
                if (m.getAttribute('data-ending-tempo-note')) {
                    return m.getAttribute('data-ending-tempo-note')
                } else {
                    return m.getAttribute('data-starting-tempo-note')
                }
            })

            tempo.show_starting = (previousEndingTempo != tempo.starting) ||
                ((previousStartingTempo != previousEndingTempo)) ||
                (startingNote != previousEndingNote)
        }
    }

    if (tempo.show_ending == null) {
        tempo.show_ending = false

        if (nextMeasure) {
            let nextStartingTempo = parseFloat(getLastMeasureInfo(nextMeasure, (m, check) => {
                if (m === nextMeasure) {
                    return m.getAttribute('data-starting-bpm')
                }

                if (m.getAttribute('data-ending-bpm')) {
                    return m.getAttribute('data-ending-bpm')
                } else {
                    return m.getAttribute('data-starting-bpm')
                }
            }))


            let nextStartingNote = getLastMeasureInfo(nextMeasure, (m, check) => {
                if (m === nextMeasure) {
                    return m.getAttribute('data-starting-tempo-note')
                }

                if (m.getAttribute('data-ending-tempo-note')) {
                    return m.getAttribute('data-ending-tempo-note')
                } else {
                    return m.getAttribute('data-starting-tempo-note')
                }
            })

            let endingNote = getLastMeasureInfo(element, (m, check) => {
                if (m.getAttribute('data-ending-tempo-note')) {
                    return m.getAttribute('data-ending-tempo-note')
                } else {
                    return m.getAttribute('data-starting-tempo-note')
                }
            })

            console.log(('' + tempo.starting_note_dots + tempo.starting_note), ('' + tempo.ending_note_dots + tempo.ending_note))

            tempo.show_ending =
                (nextStartingTempo != tempo.ending) && tempo.ending != tempo.starting ||
                (tempo.ending != tempo.starting) && nextMeasure.getAttribute('data-measure') == 'add' ||
                (endingNote != nextStartingNote) && (tempo.ending != tempo.starting) ||
                ('' + tempo.starting_note_dots + tempo.starting_note) != ('' + tempo.ending_note_dots + tempo.ending_note)
        }
    }

    if (barline.starting == null) {
        barline.starting = parseInt(element.getAttribute('data-start-barline'))
    }
    if (barline.ending == null) {
        barline.ending = parseInt(element.getAttribute('data-end-barline'))
    }

    if (measure == null) {
        measure = element.getAttribute('data-measure')
        if (measure == 'add') {
            measure = null
        }
    }

    // Create an SVG renderer and attach it to the DIV element with id="output".
    const renderer = new Renderer(element, Renderer.Backends.SVG);
    const throwAwayRenderer = new Renderer(document.createElement('div'), Renderer.Backends.SVG)
    // renderer.ctx.svg.width.baseVal.value = 101


    // Configure the rendering context.
    // renderer.resize(500, 500);
    const context = renderer.getContext();
    const throwAwayContext = throwAwayRenderer.getContext()
    context.setFont('Arial', 5);

    // Create a stave
    const stave = new Stave(0, 0, measureWidth).setConfigForLines([{
        visible: false
    }, {
        visible: false
    }, {
        visible: true
    }, {
        visible: false
    }, {
        visible: false
    }])
    // const stave = new Stave(0, 0, 400).setNumLines(1)
    // stave.resetLines()

    // This is just a hack in order to make the measure number not cut-off.
    stave.draw = function () {
        const t = this.checkContext();
        this.setRendered(),
            this.applyStyle(),
            t.openGroup("stave", this.getAttribute("id")),
            this.formatted || this.format();
        const e = this.options.num_lines,
            i = this.width,
            b = this.x;
        let a;
        for (let n = 0; n < e; n++)
            a = this.getYForLine(n),
            this.options.line_config[n].visible && (t.beginPath(),
                t.moveTo(b, a),
                t.lineTo(b + i, a),
                t.stroke());
        t.closeGroup(),
            this.restoreStyle();
        for (let e = 0; e < this.modifiers.length; e++) {
            const i = this.modifiers[e];
            "function" == typeof i.draw && (i.applyStyle(t),
                i.draw(this, this.getModifierXShift(e)),
                i.restoreStyle(t))
        }
        if (this.measure > 0) {
            t.save(),
                t.setFont(this.textFont);
            const e = t.measureText("" + this.measure).width;
            a = this.getYForTopText(0) + 3,
                t.fillText("" + this.measure, this.x, a),
                t.restore()
        }
        return this
    }

    // modified fillText that does not filter the x.
    context.addText = function (text, x, y) {
        if (!text || text.length <= 0) return this;
        const b = Object.assign(Object.assign({}, this.attributes), {
                stroke: "none",
                x: x,
                y: y
            }),
            a = this.create("text");
        return a.textContent = text, this.applyAttributes(a, b), this.add(a), this
    }

    console.log('stave', stave)

    // Add a clef and time signature.
    if (timeSig.shown) {
        stave.addTimeSignature(timeSig.num_beats + '/' + timeSig.beat_value);
    }
    if (measure) {
        stave.setMeasure(measure)
    }

    // Connect it to the rendering context and draw!
    stave.setContext(context);

    let notes = [];

    // A quarter-note C.
    // new StaveNote({ keys: ["b/4"], duration: "q" }),

    // // A quarter-note D.
    // new StaveNote({ keys: ["b/4"], duration: "q" }),

    // // A quarter-note rest. Note that the key (b/4) specifies the vertical
    // // position of the rest.
    // new StaveNote({ keys: ["b/4"], duration: "qr" }),

    // // A C-Major chord.
    // new StaveNote({ keys: ["b/4"], duration: "q" }),

    let beat_value = timeSig.beat_value

    if (NOTE_NAMES[beat_value] == undefined) {
        beat_value = 8
    }

    for (const index in pattern) {
        if (Object.hasOwnProperty.call(pattern, index)) {
            let beat = pattern[index];
            if (typeof beat == 'string') {
                if (beat == 0) {
                    beat = [NOTE_NAMES[beat_value] + 'r']
                } else if (beat == 1) {
                    beat = [NOTE_NAMES[beat_value]]
                } else if (beat == 2) {
                    beat = [NOTE_NAMES[beat_value], 'a>']
                }
                // beat = [beat]
            }
            let note = new StaveNote({
                keys: ["b/4"],
                duration: beat[0]
            })
            if (beat[1]) {
                note.addModifier(new Articulation(beat[1]).setPosition(4))
            }
            if (beat[0].includes('d')) {
                dotted(note)
            }
            notes.push(note)
        }
    }


    // notes.forEach(note => {
    //     note.render_options.scale = 0.2
    // });

    let tuplet = null

    if (NOTE_NAMES[timeSig.beat_value] == undefined) {
        tuplet = new Tuplet(
            notes, {
                num_notes: timeSig.beat_value,
                notes_occupied: parseInt(timeSig.num_beats),
                ratioed: false,
            }
        )
    }

    // Create a voice in 4/4 and add above notes
    const voice = new Voice({
        num_beats: timeSig.num_beats,
        beat_value: timeSig.beat_value
    });
    console.log(notes)
    voice.addTickables(notes);

    // set barlines
    stave.setBegBarType(!barline.starting ? 1 : barline.starting)
    stave.setEndBarType(!barline.ending ? 1 : barline.ending)

    // Format and justify the notes to 400 pixels.
    var formatter = new Formatter()
    if (notes.length > 0) {
        // formatter.FormatAndDraw(context, stave, notes);
        formatter.joinVoices([voice]).format([voice], 100);
        voice.draw(throwAwayContext, stave);

        let boundingBox = voice.getBoundingBox()
        stave.setWidth(boundingBox.x + boundingBox.w + 10)
        console.log('width: ', stave.getWidth())

        if (tempo.show_starting && tempo.starting != null) {
            console.log('measure', measure, tempo.starting)
            let staveTempo = new StaveTempo({
                    bpm: tempo.starting,
                    duration: tempo.starting_note,
                    dots: tempo.starting_note_dots,
                },
                0,
                0,
            )
            staveTempo.shift_x = 0
            staveTempo.padding = 0
            staveTempo.position = 2
            staveTempo.textFont.size = 10
            stave.modifiers.push(staveTempo)
        }

        if (tempo.show_ending && tempo.ending != null) {
            console.log('measure', measure, tempo.ending)
            let staveTempo = new StaveTempo({
                    bpm: tempo.ending,
                    duration: tempo.ending_note,
                    dots: tempo.ending_note_dots,
                },
                0,
                0,
            )
            staveTempo.position = 2
            staveTempo.shift_x = stave.end_x - 50
            staveTempo.padding = 0
            staveTempo.textFont.size = 10
            stave.modifiers.push(staveTempo)
        }
        console.log(stave)


        stave.draw()
        voice.draw(context, stave)

        let text_x = '25%'

        context.setFont('serif', '1rem', 100, 'italic')
        if (tempo.show_acc) {
            context.addText('acc..', text_x, 20)
        }
        if (tempo.show_rit) {
            context.addText('rit..', text_x, 20)
        }
    } else {
        stave.draw()
    }

    // Render voice

    if (tuplet) {
        tuplet.setContext(context).draw()
    }

    element.style.setProperty('width', stave.getWidth() + 'px')
    element.style.setProperty('height', '100px')

    element.setAttribute('title', [null, 'add'].includes(measure) ? 'add measure' : `measure ${measure}`)
}

function modeCheck() {
    let elements = document.querySelectorAll('input[name="mode-selector"]')

    let mode = 'edit'

    for (const index in elements) {
        if (Object.hasOwnProperty.call(elements, index)) {
            const element = elements[index];
            if (element.checked) {
                mode = element.value
                return mode
            }
        }
    }
    return mode
}

function getLastMeasureInfo (measure, callback = (measure, check) => {
    return measure.getAttribute('data-starting-bpm')
}) {
    if (!measure) {
        return ''
    }

    if (callback(measure, false)) {
        return callback(measure, true)
    }

    let previousSibling = measure.previousElementSibling

    if (!previousSibling) {
        return callback(measure, true)
    }

    return getLastMeasureInfo(previousSibling, callback)
}

const measureEditorDialog = document.querySelector('#edit-measure')
measureEditorDialog.cancelButton = measureEditorDialog.querySelector('#cancelButton')
measureEditorDialog.confirmButton = measureEditorDialog.querySelector('#confirmDialog')

measureEditorDialog.tempo = {
    startTempo: measureEditorDialog.querySelector('#editor-start-tempo'),
    endTempo: measureEditorDialog.querySelector('#editor-end-tempo'),
    startNote: measureEditorDialog.querySelector('#editor-tempo-start-note'),
    endNote: measureEditorDialog.querySelector('#editor-tempo-end-note'),
}

measureEditorDialog.tempo.startTempo.lastValue = measureEditorDialog.tempo.startTempo.value

measureEditorDialog.tempo.startTempo.addEventListener('input', function (e) {

    if (measureEditorDialog.tempo.endTempo.value == this.lastValue) {
        measureEditorDialog.tempo.endTempo.value = this.value
    }

    this.lastValue = this.value
})

measureEditorDialog.tempo.startNote.lastValue = measureEditorDialog.tempo.startNote.value

measureEditorDialog.tempo.startNote.addEventListener('onchange', function (e) {
    console.log('this', this)
    console.log('value', this.value)

    if (this.lastValue == measureEditorDialog.tempo.endNote.value) {
        measureEditorDialog.tempo.endNote.value = this.value
    }

    this.lastValue = this.value
})

measureEditorDialog.timeSignature = {
    beatsPerMeasure: measureEditorDialog.querySelector('#editor-time-signature-beats-per-measure'),
    noteDuration: measureEditorDialog.querySelector('#editor-time-signature-note-duration'),
}
measureEditorDialog.rhythm = measureEditorDialog.querySelector('#editor-rhythm')
measureEditorDialog.updateBeats = function () {
    let beatsPerMeasure = this.timeSignature.beatsPerMeasure.value

    let notes = this.rhythm.children

    if (beatsPerMeasure > notes.length) {
        let addAmount = beatsPerMeasure - notes.length

        let start = notes.length

        for (let index = 0; index < addAmount; index++) {
            let note = document.createElement('button')
            note.classList.add('measure-editor-note')
            note.setAttribute('data-note', start + index + 1)
            note.innerHTML = note.getAttribute('data-note')

            note.value = 0

            this.rhythm.appendChild(note)

            note.addEventListener('click', function (e) {
                console.log('note', this)
                this.value = (parseInt(this.value) + 1) % 3
            })
        }
    } else if (beatsPerMeasure < notes.length) {
        let delAmount = notes.length - beatsPerMeasure

        for (let index = 0; index < delAmount; index++) {
            this.rhythm.removeChild(this.rhythm.lastChild)
        }
    }
}

measureEditorDialog.timeSignature.beatsPerMeasure.addEventListener('input', function () {
    if (this.value != '') {
        this.value = Math.max(1, this.value)
        this.value = Math.min(30, this.value)
        measureEditorDialog.updateBeats()
    }
})
measureEditorDialog.timeSignature.beatsPerMeasure.addEventListener('change', function () {
    if (this.value == '') {
        this.value = measureEditorDialog.rhythm.children.length
    }
})

measureEditorDialog.timeSignature.noteDuration.addEventListener('input', function () {
    notes = [
        1,
        2,
        4,
        8,
        16,
        32,
        64,
        128,
    ]

    if (this.value != '') {
        if (!notes.includes(this.value)) {
            this.value = findClosest(this.value, notes)
        }
    }
})
measureEditorDialog.timeSignature.noteDuration.addEventListener('change', function () {
    if (this.value == '') {
        this.value = 4
    }
})

measureEditorDialog.submit = function () {}

measureEditorDialog.addEventListener('close', function (e) {
    console.log(this.returnValue)
    this.submit()
})

measureEditorDialog.edit = function (measure, adding = false) {
    let timeSignatureText = measure.getAttribute('data-time-signature')
    let startTempo = getLastMeasureInfo(measure, (m, check) => {
        if (m === measure) {
            return m.getAttribute('data-starting-bpm')
        }

        if (m.getAttribute('data-ending-bpm')) {
            return m.getAttribute('data-ending-bpm')
        } else {
            return m.getAttribute('data-starting-bpm')
        }
    })
    let endTempo = getLastMeasureInfo(measure, (m, check) => {
        if (m.getAttribute('data-ending-bpm')) {
            return m.getAttribute('data-ending-bpm')
        } else {
            return m.getAttribute('data-starting-bpm')
        }
    })

    let startNote = getLastMeasureInfo(measure, (m, check) => {
        if (m === measure) {
            return m.getAttribute('data-starting-tempo-note')
        }

        if (m.getAttribute('data-ending-tempo-note')) {
            return m.getAttribute('data-ending-tempo-note')
        } else {
            return m.getAttribute('data-starting-tempo-note')
        }
    })
    let endNote = getLastMeasureInfo(measure, (m, check) => {
        if (m.getAttribute('data-ending-tempo-note')) {
            return m.getAttribute('data-ending-tempo-note')
        } else {
            return m.getAttribute('data-starting-tempo-note')
        }
    })

    let barline = {
        start: measure.getAttribute('data-start-barline'),
        end: measure.getAttribute('data-end-barline'),
    }


    if (!barline.start) {
        barline.start = 1
    }
    if (!barline.end) {
        barline.end = 1
    }
    console.log('barline', barline)

    let timeSignature = timeSignatureText.split('/')

    console.log(timeSignature)

    this.timeSignature.beatsPerMeasure.value = timeSignature[0]
    this.timeSignature.noteDuration.value = timeSignature[1]
    this.tempo.startTempo.value = startTempo
    this.tempo.endTempo.value = endTempo

    this.tempo.startNote.value = startNote
    this.tempo.endNote.value = endNote

    let startBarlineSelection = this.querySelector(`input[name="editor-start-barline"][value="${barline.start}"]`)
    let endBarlineSelection = this.querySelector(`input[name="editor-end-barline"][value="${barline.end}"]`)

    if (startBarlineSelection) {
        startBarlineSelection.checked = true
    }

    if (endBarlineSelection) {
        endBarlineSelection.checked = true
    }

    this.updateBeats()

    let rhythm = measure.getAttribute('data-rhythm')
    rhythm = rhythm.split(',')

    for (let index = 0; index < rhythm.length; index++) {
        const note = rhythm[index];
        const noteElement = this.rhythm.children[index]

        noteElement.value = note
    }

    this.tempo.startTempo.lastValue = this.tempo.startTempo.value


    this.submit = function () {
        if (this.returnValue == 'cancel') {
            if (adding) {
                measure.remove()
            }
            return
        }

        let nextMeasure = measure.nextElementSibling
        let previousMeasure = measure.previousElementSibling

        let timeSignatureText = ''
        let startTempo = 0

        let startNote = 'q'
        let endNote = 'q'

        let showTimeSignature = true
        let previous_measure_number = 0

        if (previousMeasure) {
            if (previousMeasure.getAttribute('data-measure') != 'add') {
                previous_measure_number = parseInt(previousMeasure.getAttribute('data-measure'))
                timeSignatureText = previousMeasure.getAttribute('data-time-signature')
                startTempo = previousMeasure.getAttribute('data-starting-bpm')
            }
        }

        if (this.returnValue == 'delete') {
            let parent = measure.parentNode

            measure.remove()

            for (let index = 0; index < parent.children.length; index++) {
                const child = parent.children[index];
                console.log('measure', child.getAttribute('data-measure'))
                if (child.getAttribute('data-measure') != 'add') {
                    child.setAttribute('data-measure', index + 1)
                    renderMeasure(child)
                }
            }
        } else {
            timeSignatureText = [
                this.timeSignature.beatsPerMeasure.value,
                this.timeSignature.noteDuration.value,
            ].join('/')
            startTempo = this.tempo.startTempo.value
            endTempo = this.tempo.endTempo.value

            startNote = this.tempo.startNote.value
            endNote = this.tempo.endNote.value

            rhythm = []
            for (let index = 0; index < this.rhythm.children.length; index++) {
                const note = this.rhythm.children[index];
                rhythm.push(note.value)
            }

            let rhythmText = rhythm.join(',')

            let lastStartTempo = getLastMeasureInfo(previousMeasure, (m, check) => {
                if (m === measure) {
                    return m.getAttribute('data-starting-bpm')
                }

                if (m.getAttribute('data-ending-bpm')) {
                    return m.getAttribute('data-ending-bpm')
                } else {
                    return m.getAttribute('data-starting-bpm')
                }
            })

            let lastStartNote = getLastMeasureInfo(previousMeasure, (m, check) => {
                if (m === measure) {
                    return m.getAttribute('data-starting-tempo-note')
                }

                if (m.getAttribute('data-ending-tempo-note')) {
                    return m.getAttribute('data-ending-tempo-note')
                } else {
                    return m.getAttribute('data-starting-tempo-note')
                }
            })


            let startBarlineSelection = this.querySelector(`input[name="editor-start-barline"]:checked`)
            let endBarlineSelection = this.querySelector(`input[name="editor-end-barline"]:checked`)

            measure.setAttribute('data-measure', parseInt(previous_measure_number) + 1)
            measure.setAttribute('data-starting-bpm', lastStartTempo == startTempo ? '' : startTempo)
            measure.setAttribute('data-ending-bpm', startTempo == endTempo ? '' : endTempo)
            measure.setAttribute('data-starting-tempo-note', startNote == lastStartNote ? '' : startNote)
            measure.setAttribute('data-ending-tempo-note', endNote == startNote ? '' : endNote)
            measure.setAttribute('data-start-barline', !startBarlineSelection.value ? '1' : startBarlineSelection.value)
            measure.setAttribute('data-end-barline', !endBarlineSelection.value ? '1' : endBarlineSelection.value)
            measure.setAttribute('data-time-signature', timeSignatureText)
            measure.setAttribute('data-rhythm', rhythmText)

            if (previousMeasure) {
                if (previousMeasure.getAttribute('data-time-signature') == timeSignatureText) {
                    showTimeSignature = false
                }
            }

            renderMeasure(measure)
        }

        console.log('previous', previousMeasure)

        if (nextMeasure) {
            if (nextMeasure.getAttribute('data-measure') != 'add') {
                console.log(nextMeasure.getAttribute('data-time-signature').split('/'))

                renderMeasure(nextMeasure)
            }
        }

        if (previousMeasure) {
            renderMeasure(previousMeasure)
        }
    }

    this.showModal()
    this.timeSignature.beatsPerMeasure.focus()
}

function editMeasure(measure) {
    measureEditorDialog.edit(measure)
}

function measureClickHandler(e, measure) {
    let mode = modeCheck()

    if (mode == 'edit') {
        editMeasure(measure)
    } else if (mode == 'select') {
        let selected = document.querySelectorAll('.measure.selected')
        selected.forEach(element => {
            element.classList.remove('selected')
        });

        measure.classList.add('selected')
    }

}

function addMeasure(adder) {
    let previousMeasure = adder.previousElementSibling
    let rhythm = '1,1,1,1'
    let tempo = 120
    let timeSignature = '4/4'
    if (previousMeasure) {
        rhythm = previousMeasure.getAttribute('data-rhythm')
        tempo = previousMeasure.getAttribute('data-starting-bpm')
        timeSignature = previousMeasure.getAttribute('data-time-signature')
    }

    let newMeasure = document.createElement('button')
    newMeasure.classList.add('measure')
    newMeasure.setAttribute('data-rhythm', rhythm)
    newMeasure.setAttribute('data-starting-bpm', tempo)
    newMeasure.setAttribute('data-ending-bpm', tempo)
    newMeasure.setAttribute('data-time-signature', timeSignature)

    adder.parentNode.insertBefore(newMeasure, adder)

    newMeasure.addEventListener('click', (e) => {
        measureClickHandler(e, newMeasure)
    })

    measureEditorDialog.edit(newMeasure, true)

}

function updateMeasures() {
    let measures = document.querySelectorAll('.measure')
    let last_time_signature = ''
    measures.forEach(measure => {
        let tempo = measure.getAttribute('data-start-tempo')
        let measure_number = measure.getAttribute('data-measure')

        if (measure_number == 'add') {
            renderMeasure(
                measure,
                [], {
                    num_beats: 1,
                    beat_value: 1,
                    shown: false,
                }, {
                    starting: null,
                    ending: null,
                    show_starting: false,
                    show_ending: false,
                    show_rit: false,
                    show_acc: false,
                },
                null,
            )

            measure.addEventListener('click', function (e) {
                addMeasure(this)
            })
        } else {

            let time_signature = measure.getAttribute('data-time-signature')
            let split_time_signature = time_signature.split('/')
            let num_beats = split_time_signature[0]
            let beat_value = split_time_signature[1]

            let rhythm = measure.getAttribute('data-rhythm')

            rhythm = rhythm.split(',')


            renderMeasure(
                measure
            )

            last_time_signature = time_signature

            measure.addEventListener('click', (e) => {
                measureClickHandler(e, measure)
            })
        }
    });
}

updateMeasures()

function createMeasure (data = {
    measure: null,
    rhythm: [],
    time_signature: null,
    tempo: {
        starting: null,
        ending: null,
        starting_note: null,
        ending_note: null,
    },
    barline: {
        starting: null,
        ending: null,
    }
}) {
    let measure = document.createElement('button')
    measure.classList.add('measure')

    const track = document.querySelector('#track')
    const measureAdder = track.querySelector('[data-measure="add"]')

    const lastMeasure = measureAdder.previousElementSibling

    measure.setAttribute('data-measure', data.measure || parseFloat(lastMeasure.getAttribute('data-measure') + 1))
    measure.setAttribute('data-starting-bpm', data.tempo.starting || '')
    measure.setAttribute('data-ending-bpm', data.tempo.ending || '')
    measure.setAttribute('data-starting-tempo-note', data.tempo.starting_note || '')
    measure.setAttribute('data-ending-tempo-note', data.tempo.ending_note || '')
    measure.setAttribute('data-start-barline', data.barline.starting || '1')
    measure.setAttribute('data-end-barline', data.barline.ending || '1')
    measure.setAttribute('data-time-signature', data.time_signature.join('/') || data.time_signature || lastMeasure.getAttribute('data-time-signature'))
    measure.setAttribute('data-rhythm', data.rhythm.join(',') || data.rhythm || lastMeasure.getAttribute('data-rhythm'))

    if (measureAdder) {
        track.insertBefore(measure,measureAdder)
    } else {
        track.appendChild(measure)
    }

    renderMeasure(measure)

    measure.addEventListener('click', (e) => {
        measureClickHandler(e, measure)
    })

    return measure
}

// save stuff

const SAVE_VERSION = 1

function getTrackData (includeElements) {
    const measures = document.querySelectorAll('.track .measure:not([data-measure="add"])')

    let save = {
        version: SAVE_VERSION,
        measures: []
    }

    for (const element of measures) {
        let measure = {
            measure: element.getAttribute('data-measure'),
            rhythm: element.getAttribute('data-rhythm').split(','),
            time_signature: element.getAttribute('data-time-signature').split('/').map((t) => parseFloat(t) || 4),
            tempo: {
                starting: element.getAttribute('data-starting-bpm'),
                ending: element.getAttribute('data-ending-bpm'),
                starting_note: element.getAttribute('data-starting-tempo-note'),
                ending_note: element.getAttribute('data-ending-tempo-note'),
            },
            barline: {
                starting: element.getAttribute('data-start-barline'),
                ending: element.getAttribute('data-end-barline'),
            }
        }

        if (includeElements) {
            measure.element = element
        }

        save.measures.push(measure)
    }

    return save
}

function resetTrack () {
    const measures = document.querySelectorAll('.track .measure:not([data-measure="add"])')

    for (const element of measures) {
        element.remove()
    }
}

window.resetTrack = resetTrack

function loadTrack (data) {
    resetTrack()

    const track = document.querySelector('#track')

    for (const measure of data.measures) {
        createMeasure(measure)
    }
}

// play track

const button = document.querySelector("#play-button");
const audioPlayer = document.getElementById(button.getAttribute('aria-controls'))

let track = getTrackData(true)

var clickTrack = new ClickTrack(track, button, (clickTrack) => {
    clickTrack.data = getTrackData(true)
}, {
    'C4': '../assets/sounds/gock block.mp3',
})

let save_button = document.querySelector('.control-bar [value="save"]')
console.log('save_button', save_button)
save_button.addEventListener('click', () => {
    download(JSON.stringify(getTrackData(false)), 'track.json', 'application/json')
})

let open_button = document.querySelector('#open-file')
open_button.addEventListener('change', async (event) => {
    let file_selector = event.target
    let files = event.target.files
    console.log('files:', files)

    let file = files[0]
    console.log('file', file)
    if (file) {
        let content = await file.text()
        try {
            let json = JSON.parse(content)
            console.log(json)
            loadTrack(json)
        } catch (error) {
            console.error(error)
        }
    }

    file_selector.value = ''
})
