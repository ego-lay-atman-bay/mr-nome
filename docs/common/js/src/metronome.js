var Tone = require('tone')

class Metronome {
    constructor(bpm, pattern, rhythm) {
        this.bpm = bpm || 120;
        this.pattern = pattern || [1, 0, 0, 0];
        this.rhythm = rhythm || [1, 1, 1, 1];

        this.currentBeat = 0;

        this.playing = false;

        this.audio = new Tone.Sampler({
            urls: {
                "C4": "assets/gock block.mp3",
            },
            release: 1,
            onload: () => {
                Tone.Transport.scheduleRepeat((time) => {

                    // console.log(beat);
                    this.audio.triggerAttackRelease(['C4', 'E4'][this.pattern[this.currentBeat]], "4n", time);
                    // for (let n = 1; n < this.pattern.length; n++) {
                    //   this.audio.triggerAttackRelease("C4", "4n", time + (n * 0.5));

                    // }
                    this.currentBeat = (this.currentBeat + 1) % this.pattern.length;

                }, "4n")
            },
        }).toDestination();

        // this.loop = new Tone.Loop(time => {
        //   this.audio.triggerAttackRelease("C4", "8n", time);
        // }, "4n").start();

        Tone.Transport.bpm.value = this.bpm;

    }

    async play() {
        this.currentBeat = 0;
        await Tone.start();
        this.playing = true;
        this.offsetTime = 0;
        await Tone.start();

        // this.loop.start(0);
        Tone.Transport.start();
        // this.playBeat(0);



        // while (this.playing) {
        //     this.playBeat(0)
        //     let start = new Date().getTime();
        //     let result = await this.waitBeat(1);
        //     let end = new Date().getTime();
        //     console.log(end - start)
        //     console.log(this.getBeatMilliseconds(1));
        //     this.offsetTime = Math.max(0, (end - start) - this.getBeatMilliseconds(1));
        //     console.log(this.offsetTime)
        // console.log(result);

        // let dif = new Date().getTime() - startTime;
        // let duration = this.getBeatMilliseconds(1)

        // if ((duration / dif) >= 1) {
        //   console.log('playing');
        //   startTime += duration * Math.floor(duration / dif);
        //   this.playBeat(0)
        // }
        // }
    }

    getBeatMilliseconds(duration, bpm) {
        duration = duration || 1;
        bpm = bpm || this.bpm;

        return (((60 / bpm) * (duration * 1000)))
    }

    waitBeat(beat) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('resolved')
            }, ((beat * (60 / this.bpm)) * 1000) - this.offsetTime)
        })
    }

    stop() {
        this.playing = false;
        // this.loop.stop();
        Tone.Transport.stop();
    }

    playBeat(pitch) {
        this.audio.triggerAttackRelease("C4", 1);;
        // audio.currentTime = 0;
        // audio.play();

        // audio.start();
    }

    setBpm(bpm) {
        this.bpm = bpm || 120;
        Tone.Transport.bpm.value = this.bpm;
    }
}

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


met = new Metronome();

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
    met.setBpm(parseInt(tempoSlider.value));
})

var tempoInput = tempoDiv.querySelector('#tempo-input')

tempoInput.addEventListener('change', e => {
    let slider = document.querySelector('#tempo-slider');
    slider.value = tempoInput.value;
    met.setBpm(parseInt(tempoInput.value));
})

const buttons = document.querySelectorAll(".play-button");

buttons.forEach((button) => {
    button.addEventListener("click", () => {
        const currentState = button.getAttribute("data-state");

        if (!currentState || currentState === "stopped") {
            button.setAttribute("data-state", "playing");
            met.play();
        } else {
            button.setAttribute("data-state", "stopped");
            met.stop();
        }
    });
});