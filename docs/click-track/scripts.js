const {
    Renderer,
    Stave,
    StaveNote,
    Voice,
    Formatter,
    Articulation,
    Dot,
} = Vex.Flow;

measureWidth = 150
document.documentElement.style.setProperty('--measure-width', measureWidth + 'px')

function setMeasure(element, pattern, timeSig = {
    num_beats: 4,
    beat_value: 4,
    shown: false
}, tempo, measure) {
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

    for (const index in pattern) {
        if (Object.hasOwnProperty.call(pattern, index)) {
            let beat = pattern[index];
            if (typeof beat == 'string') {
                beat = [beat]
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
        
    // Create a voice in 4/4 and add above notes
    const voice = new Voice({
        num_beats: timeSig.num_beats,
        beat_value: timeSig.beat_value
    });
    voice.addTickables(notes);

    // Format and justify the notes to 400 pixels.
    Formatter.FormatAndDraw(context, stave, notes);
    // new Formatter().joinVoices([voice]).format([voice], stave.width - 30);
    console.log(stave.getWidth())

    // Render voice
    voice.draw(context, stave);

    element.style.setProperty('width', (stave.getWidth() + 1) + 'px')
    element.style.setProperty('height', '100px')
    element.querySelector('text').setAttribute('x', 0)
}

setMeasure(document.getElementById('measure-1'), [['8d', 'a>'], '16', 'qr', 'qr', 'q'], {
    num_beats: 4,
    beat_value: 4,
    shown: true
}, 120, 1)
setMeasure(document.getElementById('measure-2'), [['q', 'a>'], 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: true
}, 120, 2)
setMeasure(document.getElementById('measure-3'), [['q', 'a>'], 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 3)
setMeasure(document.getElementById('measure-4'), [['q', 'a>'], 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 4)
setMeasure(document.getElementById('measure-5'), [['16', 'a>'], '8dr', 'qr', 'q', ['q', 'a>']], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 5)
