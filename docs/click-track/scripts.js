const {
    Renderer,
    Stave,
    StaveNote,
    Voice,
    Formatter,
    Articulation,
    Dot,
    Tuplet,
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
    tempo,
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
        previousMeasure = element.previousElementSibling
        timeSig.shown = true

        if (previousMeasure) {
            let previousTimeSignature = previousMeasure.getAttribute('data-time-signature')
            if (previousTimeSignature == [timeSig.num_beats, timeSig.beat_value].join('/')) {
                timeSig.shown = false
            }
        }
    }

    console.log('timeSig', timeSig)

    if (tempo == null) {
        tempo = element.getAttribute('data-starting-bpm')
    }

    if (measure == null) {
        measure = element.getAttribute('data-measure')
        if (measure == 'add') {
            measure = null
        }
    }

    // Create an SVG renderer and attach it to the DIV element with id="output".
    const renderer = new Renderer(element, Renderer.Backends.SVG);
    // renderer.ctx.svg.width.baseVal.value = 101

    // Configure the rendering context.
    // renderer.resize(500, 500);
    const context = renderer.getContext();
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
    
    // Add a clef and time signature.
    if (timeSig.shown) {
        stave.addTimeSignature(timeSig.num_beats + '/' + timeSig.beat_value);
    }
    if (![null, undefined].includes(tempo)) {
        stave.setTempo(tempo)
    }
    if (measure) {
        stave.setMeasure(measure)
    }
    console.log(stave)
    
    // Connect it to the rendering context and draw!
    stave.setContext(context).draw();
    
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
                note.addModifier(new Articulation(beat[1]))
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
    if (notes.length > 0) {
        Formatter.FormatAndDraw(context, stave, notes);
    }
    // new Formatter().joinVoices([voice]).format([voice], stave.width - 30);
    console.log(stave.getWidth())

    // Render voice
    voice.draw(context, stave);

    if (tuplet) {
        tuplet.setContext(context).draw()
    }

    element.style.setProperty('width', (stave.getWidth() + 1) + 'px')
    element.style.setProperty('height', '100px')
    if (measure) {
        element.querySelector('text').setAttribute('x', 0)
    }
}

const measureEditorDialog = document.querySelector('#edit-measure')
measureEditorDialog.cancelButton = measureEditorDialog.querySelector('#cancelButton')
measureEditorDialog.confirmButton = measureEditorDialog.querySelector('#confirmDialog')

measureEditorDialog.tempo = measureEditorDialog.querySelector('#editor-tempo')
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
    let tempo = measure.getAttribute('data-starting-bpm')

    let timeSignature = timeSignatureText.split('/')

    console.log(timeSignature)

    this.timeSignature.beatsPerMeasure.value = timeSignature[0]
    this.timeSignature.noteDuration.value = timeSignature[1]
    this.tempo.value = tempo

    this.updateBeats()

    let rhythm = measure.getAttribute('data-rhythm')
    rhythm = rhythm.split(',')

    for (let index = 0; index < rhythm.length; index++) {
        const note = rhythm[index];
        const noteElement = this.rhythm.children[index]

        noteElement.value = note
    }

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
        let tempo = 0

        let showTimeSignature =  true
        let previous_measure_number = 0

        if (previousMeasure) {
            if (previousMeasure.getAttribute('data-measure') != 'add') {
                previous_measure_number = parseInt(previousMeasure.getAttribute('data-measure'))
                timeSignatureText = previousMeasure.getAttribute('data-time-signature')
                tempo = previousMeasure.getAttribute('data-starting-bpm')
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
            tempo = this.tempo.value
    
            rhythm = []
            for (let index = 0; index < this.rhythm.children.length; index++) {
                const note = this.rhythm.children[index];
                rhythm.push(note.value)
            }
    
            rhythmText = rhythm.join(',')
            
            measure.setAttribute('data-measure', parseInt(previous_measure_number) + 1)
            measure.setAttribute('data-starting-bpm', tempo)
            measure.setAttribute('data-time-signature', timeSignatureText)
            measure.setAttribute('data-rhythm', rhythmText)

            if (previousMeasure) {
                if (previousMeasure.getAttribute('data-time-signature') == timeSignatureText) {
                    showTimeSignature = false
                }
            }

            renderMeasure(
                measure,
                rhythm,
                {
                    num_beats: this.timeSignature.beatsPerMeasure.value,
                    beat_value: this.timeSignature.noteDuration.value,
                    shown: showTimeSignature,
                },
                tempo,
                measure.getAttribute('data-measure')
            )
        }

        console.log('previous', previousMeasure)

        if (nextMeasure) {
            if (nextMeasure.getAttribute('data-measure') != 'add') {
                console.log(nextMeasure.getAttribute('data-time-signature').split('/'))

                let timeSignatureShown = nextMeasure.getAttribute('data-time-signature') != timeSignatureText

                
                renderMeasure(
                    nextMeasure,
                    nextMeasure.getAttribute('data-rhythm').split(','),
                    {
                        num_beats: nextMeasure.getAttribute('data-time-signature').split('/')[0],
                        beat_value: nextMeasure.getAttribute('data-time-signature').split('/')[1],
                        shown: timeSignatureShown,
                    },
                    nextMeasure.getAttribute('data-starting-bpm'),
                    nextMeasure.getAttribute('data-measure'),
                )
            
            }
        }

    }

    this.showModal()
}

function editMeasure(measure) {
    measureEditorDialog.edit(measure)
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

    newMeasure.addEventListener('click', () => {
        editMeasure(newMeasure)
    })

    measureEditorDialog.edit(newMeasure, true)

} 

function render() {
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
                null,
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

            measure.addEventListener('click', () => {
                editMeasure(measure)
            })
        }
    });
}

render()
