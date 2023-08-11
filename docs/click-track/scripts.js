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
} = Vex.Flow;

measureWidth = 150
document.documentElement.style.setProperty('--measure-width', measureWidth + 'px')

function findClosest (number, array) {
    var indexArr = array.map(function(k) { return Math.abs(k - number) })
    var min = Math.min.apply(Math, indexArr)
    return array[indexArr.indexOf(min)]
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
        show_starting: null,
        show_ending: null,
        show_rit: null,
        show_acc: null,
    },
    measure,
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
            tempo.show_starting = (previousEndingTempo != tempo.starting) || ((previousStartingTempo != previousEndingTempo))
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
            tempo.show_ending = (nextStartingTempo != tempo.ending) && tempo.ending != tempo.starting
        }
    }

    console.log('render tempo:', tempo)

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
        const e = this.options.num_lines
          , i = this.width
          , b = this.x;
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
    context.addText = function(text, x, y) {
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

    let noteNames = {
        1: 'w',
        2: 'h',
        4: 'q',
        8: '8',
        16: '16',
        32: '32',
        64: '64',
        128: '128',
    }

    beat_value = timeSig.beat_value

    if (noteNames[beat_value] == undefined) {
        beat_value = 8
    }

    for (const index in pattern) {
        if (Object.hasOwnProperty.call(pattern, index)) {
            let beat = pattern[index];
            if (typeof beat == 'string') {
                if (beat == 0) {
                    beat = [noteNames[beat_value] + 'r']
                } else if (beat == 1) {
                    beat = [noteNames[beat_value]]
                } else if (beat == 2) {
                    beat = [noteNames[beat_value], 'a>']
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

    if (noteNames[timeSig.beat_value] == undefined) {
        tuplet = new Tuplet(
            notes,
            {
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
            let staveTempo = new StaveTempo(
                {
                    bpm: tempo.starting,
                    duration: 'q',
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
            let staveTempo = new StaveTempo(
                {
                    bpm: tempo.ending,
                    duration: 'q',
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

        if (tempo.show_acc) {
            context.setFont('serif', '1rem', 100, 'italic')
            context.addText('acc..', text_x, 20)
        }
        if (tempo.show_rit) {
            context.setFont('serif', '1rem', 100, 'italic')
            context.addText('rit..', text_x, 20)
        }
    } else {
        stave.draw()
    }

    // Render voice

    if (tuplet) {
        tuplet.setContext(context).draw()
    }

    element.style.setProperty('width', (stave.getWidth() + 1) + 'px')
    element.style.setProperty('height', '100px')
    if (measure) {
        // element.querySelector('text').setAttribute('x', 0)
    }
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

getLastMeasureInfo = function (measure, callback = (measure, check) => {
    return measure.getAttribute('data-starting-bpm')
}) {
    if (!measure) {
        return ''
    }
    
    if (callback(measure, false)) {
        return callback(measure, true)
    }

    previousSibling = measure.previousElementSibling

    if (!previousSibling) {
        return callback(measure, true)
    }

    return getLastMeasureInfo(previousSibling, callback)
}

const measureEditorDialog = document.querySelector('#edit-measure')
measureEditorDialog.cancelButton = measureEditorDialog.querySelector('#cancelButton')
measureEditorDialog.confirmButton = measureEditorDialog.querySelector('#confirmDialog')

measureEditorDialog.startTempo = measureEditorDialog.querySelector('#editor-start-tempo')
measureEditorDialog.endTempo = measureEditorDialog.querySelector('#editor-end-tempo')
measureEditorDialog.startTempo.lastValue = measureEditorDialog.startTempo.value

measureEditorDialog.startTempo.addEventListener('input', function (e) {

    if (measureEditorDialog.endTempo.value == this.lastValue) {
        measureEditorDialog.endTempo.value = this.value
    }

    this.lastValue = this.value
})

measureEditorDialog.timeSignature = {
    beatsPerMeasure: measureEditorDialog.querySelector('#editor-time-signature-beats-per-measure'),
    noteDuration: measureEditorDialog.querySelector('#editor-time-signature-note-duration'),
}
measureEditorDialog.rhythm = measureEditorDialog.querySelector('#editor-rhythm')
measureEditorDialog.updateBeats = function () {
    beatsPerMeasure = this.timeSignature.beatsPerMeasure.value

    notes = this.rhythm.children

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

    let timeSignature = timeSignatureText.split('/')

    console.log(timeSignature)

    this.timeSignature.beatsPerMeasure.value = timeSignature[0]
    this.timeSignature.noteDuration.value = timeSignature[1]
    this.startTempo.value = startTempo
    this.endTempo.value = endTempo

    this.updateBeats()

    let rhythm = measure.getAttribute('data-rhythm')
    rhythm = rhythm.split(',')

    for (let index = 0; index < rhythm.length; index++) {
        const note = rhythm[index];
        const noteElement = this.rhythm.children[index]

        noteElement.value = note
    }

    this.startTempo.lastValue = this.startTempo.value

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

        let showTimeSignature =  true
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
            startTempo = this.startTempo.value
            endTempo = this.endTempo.value
    
            rhythm = []
            for (let index = 0; index < this.rhythm.children.length; index++) {
                const note = this.rhythm.children[index];
                rhythm.push(note.value)
            }
    
            rhythmText = rhythm.join(',')

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
            
            measure.setAttribute('data-measure', parseInt(previous_measure_number) + 1)
            measure.setAttribute('data-starting-bpm', lastStartTempo == startTempo ? '' : startTempo)
            measure.setAttribute('data-ending-bpm', startTempo == endTempo ? '' : endTempo)
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
                [],
                {
                    num_beats: 1,
                    beat_value: 1,
                    shown: false,
                },
                {
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
