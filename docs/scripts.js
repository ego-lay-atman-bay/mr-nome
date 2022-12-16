// code by Andrew Willems https://stackoverflow.com/a/37623959/17129659

function onRangeChange(rangeInputElmt, listener) {

    var inputEvtHasNeverFired = true;

    var rangeValue = {
        current: undefined,
        mostRecent: undefined
    };

    rangeInputElmt.addEventListener("input", function(evt) {
        inputEvtHasNeverFired = false;
        rangeValue.current = evt.target.value;
        if (rangeValue.current !== rangeValue.mostRecent) {
            listener(evt);
        }
        rangeValue.mostRecent = rangeValue.current;
    });

    rangeInputElmt.addEventListener("change", function(evt) {
        if (inputEvtHasNeverFired) {
            listener(evt);
        }
    });

}

// globals

function setTempo(bpm) {
    metronome.setBpm(bpm)

    let slider = document.querySelector('#tempo-slider')
    slider.value = bpm

    let input = document.querySelector('#tempo-input')
    input.value = bpm
}

// init

function init() {
    
    metronome = new Metronome();
    let tempoDiv = document.querySelector('.tempo');

    // var tempoSliderChange = (e) => {
    //     let input = document.querySelector('#tempo-input')
    //     console.log(input)
    //     input.setAttribute('value', e.target.value)
    // }

    // onRangeChange(tempoSlider.querySelector('#tempo-slider'), tempoSliderChange)

    let tempoSlider = tempoDiv.querySelector('#tempo-slider');
    tempoSlider.addEventListener('input', e => {
        let input = document.querySelector('#tempo-input');
        input.value = tempoSlider.value;
        metronome.setBpm(parseInt(tempoSlider.value));
    })

    var tempoInput = tempoDiv.querySelector('#tempo-input')

    tempoInput.addEventListener('change', e => {
        let slider = document.querySelector('#tempo-slider');
        slider.value = tempoInput.value;
        metronome.setBpm(parseInt(tempoInput.value));
    })

    const buttons = document.querySelectorAll(".play-button");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const currentState = button.getAttribute("data-state");

            if (!currentState || currentState === "stopped") {
                button.setAttribute("data-state", "playing");
                metronome.play();
            } else {
                button.setAttribute("data-state", "stopped");
                metronome.stop();
            }
        });
    });

    
}

// options dialog + button

function options () {
    let optionsDialog = document.getElementById('options-dialog')
    let optionsButton = document.getElementById('options')
    let cancelButton = optionsDialog.querySelector('#cancelButton')
    let confirmButton = optionsDialog.querySelector('#confirmDialog')

    let timeSigEl = optionsDialog.querySelector('.time-signiture')
    let measure = timeSigEl.querySelector('#mesure')
    let beatUnit = timeSigEl.querySelector('#beatUnit')

    let timeSig

    optionsDialog.addEventListener('open', e => {
        console.log('open')

        timeSig = [metronome.timeSig[0],metronome.timeSig[1]]
        confirmButton.value = [metronome.timeSig[0],metronome.timeSig[1]]

        measure.value = metronome.timeSig[0]
        beatUnit.value = metronome.timeSig[1]
    })

    optionsButton.addEventListener('click', e => {
        optionsDialog.showModal()

        console.log('open')

        timeSig = [metronome.timeSig[0],metronome.timeSig[1]]
        confirmButton.value = [metronome.timeSig[0],metronome.timeSig[1]]

        measure.value = metronome.timeSig[0]
        beatUnit.value = metronome.timeSig[1]
    })

    measure.addEventListener('change', e => {
        timeSig[0] = parseInt(measure.value)
        confirmButton.value = timeSig
    })

    beatUnit.addEventListener('change', e => {
        timeSig[1] = parseInt(beatUnit.value)
        confirmButton.value = timeSig
    })

    cancelButton.addEventListener('click', e => {
        measure.value = metronome.timeSig[0]
        beatUnit.value = metronome.timeSig[1]
        // optionsDialog.close()
        // timeSig = met.timeSig
    })

    function submit () {
        
        metronome.timeSig = timeSig
            
        let pattern = []
        for (let i = 0; i < timeSig[1]; i++) {
            if (i == 0) {
                pattern.push(1)
            } else {
                pattern.push(0)
            }
        }

        metronome.pattern = pattern

        Tone.Transport.timeSignature = timeSig
        metronome.makeLoop();
    }

    optionsDialog.addEventListener('close', e => {
        if (optionsDialog.returnValue != 'cancel') {
            submit()
        }
    })

    optionsDialog.addEventListener('submit', e => {
        console.log('submit')
        if (optionsDialog.returnValue != 'cancel') {
            submit()
        }
    })

    // let submit = (e) => {
    //     // met.timeSig[0] = measure.value
    //     // met.timeSig[1] = beatUnit.value

    //     confirmButton.value = timeSig
    //     met.timeSig = timeSig
    //     console.log('submit')
    // }

    // optionsDialog.addEventListener('close', submit)
    // optionsDialog.addEventListener('submit', submit)
}

// tap beat

function tapBeat() {
    let button = document.querySelector('#tap-beat')
    let tapTime = 0,
        curTime,
        difTime = 0,
        tempo = 0,
        taps = 0

    button.addEventListener('click', () => {
        curTime = new Date().getTime()
        if (taps == 0) {
            tapTime = curTime
        }
        difTime = curTime - tapTime
        tapTime = curTime
        if (difTime > 10000) {
            taps = 0
        } else {
            // console.log(difTime)

            tempo = (1000 / difTime) * 60
            // console.log(tempo)

            if (tempo && tempo != Infinity) {
                setTempo(Math.round(tempo))
            }

            taps += 1
        }

    })
}

tapBeat()
init()
options()
