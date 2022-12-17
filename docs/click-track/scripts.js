const {
    Renderer,
    Stave,
    StaveNote,
    Voice,
    Formatter
} = Vex.Flow;

function createMeasure(div, pattern, timeSig = {
    num_beats: 4,
    beat_value: 4,
    shown: false
}, tempo, measure) {
    // Create an SVG renderer and attach it to the DIV element with id="output".
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    // renderer.ctx.svg.width.baseVal.value = 101

    // Configure the rendering context.
    // renderer.resize(500, 500);
    const context = renderer.getContext();
    context.setFont('Arial', 5);

    // Create a stave of width 400 at position 10, 40.
    const stave = new Stave(0, 0, 150).setConfigForLines([{
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
        stave.options.bottom_text_position = 10
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

    for (const note in pattern) {
        if (Object.hasOwnProperty.call(pattern, note)) {
            const duration = pattern[note];
            notes.push(new StaveNote({
                keys: ["b/4"],
                duration: duration
            }))
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
    new Formatter().joinVoices([voice]).format([voice], stave.width - 30);
    console.log(stave.getWidth())

    // Render voice
    voice.draw(context, stave);

    div.style.setProperty('width', (stave.getWidth() + 1) + 'px')
    div.style.setProperty('height', '100px')
    div.querySelector('text').setAttribute('x', 0)
}

createMeasure(document.getElementById('measure-1'), ['q', 'qr', 'qr', 'q'], {
    num_beats: 4,
    beat_value: 4,
    shown: true
}, 120, 1)
createMeasure(document.getElementById('measure-2'), ['q', 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: true
}, 120, 2)
createMeasure(document.getElementById('measure-3'), ['q', 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 3)
createMeasure(document.getElementById('measure-4'), ['q', 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 4)
createMeasure(document.getElementById('measure-5'), ['q', 'qr', 'qr', 'q', 'q'], {
    num_beats: 5,
    beat_value: 4,
    shown: false
}, 120, 5)