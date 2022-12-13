class Metronome {
    constructor (bpm, pattern, rhythm) {
        this.bpm = bpm || 120;
        this.pattern = pattern || [1,0,0,0];
        this.rhythm = rhythm || [1,1,1,1];
        
        this.playing = false;
    }

    async play() {
        this.playing = true;

        while (this.playing) {
            console.log('playing');
            this.playBeat();
            let result = await this.waitBeat(1);
            console.log(result)
        }
    }

    waitBeat(beat) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('resolved')
            }, (beat * (60 / this.bpm)) * 1000)
        })
    }

    stop() {
        this.playing = false;
    }

    playBeat(pitch) {
        var audio = new Audio('/assets/gock block.mp3');
        audio.play();
    }
}

// code by Andrew Willems https://stackoverflow.com/a/37623959/17129659

function onRangeChange(rangeInputElmt, listener) {

    var inputEvtHasNeverFired = true;
  
    var rangeValue = {current: undefined, mostRecent: undefined};
    
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
    met.bpm = parseInt(tempoSlider.value);
})

var tempoInput = tempoDiv.querySelector('#tempo-input')

tempoInput.addEventListener('change', e => {
    let slider = document.querySelector('#tempo-slider');
    slider.value = tempoInput.value;
    met.bpm = parseInt(tempoInput.value);
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
