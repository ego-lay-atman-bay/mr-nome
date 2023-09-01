if (false) {
    const Tone = require('tone/build/esm/core/Tone')
}

ClickTrack = class ClickTrack {
    NOTE_NAMES = {
        1: '1n',
        2: '2n',
        4: '4n',
        8: '8n',
        16: '16n',
        32: '32n',
        64: '64n',
        128: '128n',
        'w': '1n',
        'h': '2n',
        'q': '4n',
        'e': '8n',
    }

    NOTE_TEMPO_CONVERSIONS = {
        1: 4,
        2: 2,
        4: 1,
        8: 0.5,
        16: 0.25,
        32: 4/32,
        64: 4/64,
        128: 4/128,
        'w': 4,
        'h': 2,
        'q': 1,
        'e': 0.5,
    }

    constructor(data, audioButton, buttonCallback) {
        this.data = data

        this.currentBeat = 0
        this.currentMeasure = 0

        this.playing = false

        this.audioButton = audioButton

        let audioTag = null

        if (this.audioButton) {
            audioTag = document.getElementById(this.audioButton.getAttribute('aria-controls'))
        }

        console.log(audioTag)

        if (audioTag) {
            this.audioTag = audioTag
        }
        this.setUpMediaAudio()

        this.audio = new Tone.Sampler({
            urls: {
                "C4": "../../assets/sounds/gock block.mp3",
            },
            release: 1,
            onload: () => {
                this.makeTrack();
            },
        }).toDestination();

        this.audio.sync()

        // this.loop = new Tone.Loop(time => {
        //   this.audio.triggerAttackRelease("C4", "8n", time);
        // }, "4n").start();

        Tone.Transport.bpm.value = 120;

        this.audioButton.addEventListener("click", () => {
            console.log('audioButton click')

            buttonCallback(this)

            const currentState = this.audioButton.getAttribute("data-state");

            if (!currentState || currentState === "stopped") {
                this.play().then(() => {
                    this.setupMediaSession()
                })
            } else {
                this.stop();
            }
        });

        this.audioTag.addEventListener('pause', () => {
            console.log('audioTag pause')
            if (this.playing) {
                this.pause()
            }
            // this.setAudioPosition()
        })
        this.audioTag.addEventListener('play', () => {
            console.log('audioTag play')

            buttonCallback(this)

            // this.audioTag.playbackRate = 0
            if (!this.playing) {
                this.play()
            }
        })
    }

    getLastMeasureInfo(measureIndex, callback = (measure, measureIndex, check) => {
        return measure.tempo.starting
    }) {
        if (!this.data.measures[measureIndex]) {
            return null
        }

        if (callback(this.data.measures[measureIndex], measureIndex, false)) {
            return callback(this.data.measures[measureIndex], measureIndex, true)
        }

        if (measureIndex == 0) {
            return callback(this.data.measures[measureIndex], measureIndex, true)
        }

        return this.getLastMeasureInfo(measureIndex - 1, callback)
    }

    makeTrack() {
        Tone.Transport.cancel(0)
        Tone.Transport.bpm.value = 120

        let quarter_notes = 0

        Tone.Transport.timeSignature = this.data.measures[0].time_signature

        let measureIndex = 0

        let lastMeasure = null

        for (let measureNumber = 0; measureNumber < this.data.measures.length; measureNumber++) {
            const measure = this.data.measures[measureNumber];

            Tone.Transport.schedule((time) => {
                lastMeasure?.element?.classList.remove('selected')
                measure.element?.classList.add('selected')

                Tone.Transport.timeSignature = measure.time_signature

                console.log('new time signature', measure.time_signature)
                
                console.log('measureNumber', measureNumber)

                let tempo = {
                    starting: this.getLastMeasureInfo(measureNumber, (m) => {
                        if (m === measure) {
                            return m.tempo.starting
                        }
                
                        if (m.tempo.ending) {
                            return m.tempo.ending
                        } else {
                            return m.tempo.starting
                        }
                    }),
                    ending: measure.tempo.ending,
                }

                if (measure.tempo.starting_note) {
                    let dots = 0
                    let duration = 'q'

                    for (const letter of measure.tempo.starting_note) {
                        if (letter == 'd') {
                            dots += 1
                        } else if (this.NOTE_TEMPO_CONVERSIONS[letter]) {
                            duration = this.NOTE_TEMPO_CONVERSIONS[letter]
                        }
                    }

                    let newDuration = duration
                    for (let dot = 1; dot <= dots; dot++) {
                        newDuration += (duration * Math.pow(0.5, dot))
                    }

                    duration = newDuration

                    console.log('start duration', duration)

                    if (tempo.starting && parseFloat(tempo.starting) != NaN) {
                        tempo.starting *= duration
                    } else {
                        tempo.starting = Tone.Transport.bpm.value * duration
                        console.log('modify bpm', tempo.starting)
                    }
                }
                if (tempo.starting && parseFloat(tempo.starting) != NaN) {
                    console.log('set bpm', tempo.starting)
                    Tone.Transport.bpm.value = tempo.starting
                }

                if (measure.tempo.ending_note) {
                    let dots = 0
                    let duration = 'q'

                    for (const letter of measure.tempo.ending_note) {
                        if (letter == 'd') {
                            dots += 1
                        } else if (this.NOTE_TEMPO_CONVERSIONS[letter]) {
                            duration = this.NOTE_TEMPO_CONVERSIONS[letter]
                        }
                    }

                    let newDuration = duration
                    for (let dot = 1; dot <= dots; dot++) {
                        newDuration += (duration * Math.pow(0.5, dot))
                    }

                    duration = newDuration

                    console.log('end duration', duration)

                    if (tempo.ending && parseFloat(tempo.ending) != NaN) {
                        tempo.ending *= duration
                    } else {
                        tempo.ending = Tone.Transport.bpm.value * duration
                        console.log('modify rampto bpm', tempo.ending)
                    }
                }
                if (tempo.ending && parseFloat(tempo.ending) != NaN) {
                    console.log('rampto', tempo.ending)
                    Tone.Transport.bpm.rampTo(tempo.ending, '1m')
                }

                lastMeasure = measure
            }, `0:${quarter_notes}`)

            for (let noteIndex = 0; noteIndex < measure.rhythm.length; noteIndex++) {
                const note = measure.rhythm[noteIndex];

                const noteName = ['C4', 'E4'][note - 1]
                const duration = this.NOTE_NAMES[measure.time_signature[1]]
                const time = `0:${(this.NOTE_TEMPO_CONVERSIONS[measure.time_signature[1]] * noteIndex) + quarter_notes}`

                console.log('')
                console.log('measure', measureNumber)
                console.log('noteIndex', noteIndex)
                console.log('note', note)
                console.log('quarter_notes', quarter_notes)
                console.log('time', time)
                console.log('duration', duration)
                console.log('noteName', noteName)

                if (note > 0) {
                    this.audio.triggerAttackRelease(
                        noteName,
                        duration,
                        time
                    )
                }
            }

            quarter_notes += parseFloat(measure.time_signature[0] / (measure.time_signature[1] / 4))

            if (measure.barline.ending == 5) {
                if (measure.repeat == undefined ) {
                    measure.repeat = 2
                }
                
                measure.repeat -= 1

                if (measure.repeat < 0) {
                    measure.repeat = 1
                }
                
                if (measure.repeat > 0) {
                    let repeatStart = this.getLastMeasureInfo(measureNumber, (measure, index, check) => {
                        if (measure.barline.starting == 4 || index == 0) {
                            return check ? index : true
                        } else {
                            return false
                        }
                    })

                    measureNumber = repeatStart - 1
                    
                }

            }
            
            // if (measure.time_signature) {
            //     Tone.Transport.timeSignature = measure.time_signature
            //     console.log('set time signature', measure.time_signature)
            // }

            measureIndex++
        }

        Tone.Transport.schedule((time) => {
            lastMeasure?.element?.classList.remove('selected')
            this.stop()
        }, `0:${quarter_notes}`)
        Tone.Transport.timeSignature = this.data.measures[0].time_signature


        // this.track = Tone.Transport.scheduleRepeat((time) => {
        //     this.currentBeat = Math.min(this.timeSig[0] - 1, this.currentBeat)

        //     // console.log(beat);
        //     this.audio.triggerAttackRelease(['C4', 'E4'][this.pattern[this.currentBeat]], "4n", time);
        //     // for (let n = 1; n < this.pattern.length; n++) {
        //     //   this.audio.triggerAttackRelease("C4", "4n", time + (n * 0.5));

        //     // }
        //     this.currentBeat = (this.currentBeat + 1) % this.timeSig[0];

        // }, this.timeSig[1] + "n", 0)
    }

    async play() {
        this.makeTrack()
        this.audioButton.setAttribute("data-state", "playing");
        this.currentBeat = 0;
        await Tone.start();
        this.playing = true;
        // this.setAudioPosition()
        if (this.audioTag && this.audioTag.paused) {
            this.audioTag.play()
        }
        // navigator.mediaSession.playbackState = 'playing'
        this.offsetTime = 0;

        // this.loop.start(0);
        Tone.Transport.start();
    }

    pause() {
        this.audioButton.setAttribute('data-state', 'paused')
        this.playing = false

        if (this.audioTag && !this.audioTag.paused) {
            console.log('audio paused')
            // this.audioTag.playbackRate = 0.1
            this.audioTag.pause()
        }

        Tone.Transport.pause()
    }

    stop() {
        this.audioButton.setAttribute("data-state", "stopped");
        this.playing = false;
        if (this.audioTag && !this.audioTag.paused) {
            console.log('audio paused')
            // this.audioTag.playbackRate = 0.1
            this.audioTag.pause()
        }
        // this.setAudioPosition()
        // navigator.mediaSession.playbackState = 'paused'
        // this.loop.stop();
        Tone.Transport.stop();
    }

    setBpm(bpm) {
        this.bpm = bpm || 120;
        Tone.Transport.bpm.value = this.bpm;
        this.getArtist()

        // this.setAudioPosition()
    }

    setAudioPosition() {
        if (this.audioTag) {
            console.log('audio tempo time')
            this.audioTag.currentTime = this.bpm * 2
        }
    }

    getArtist() {
        let artist = `tempo: ${this.bpm}`
        navigator.mediaSession.metadata.artist = artist
        return artist
    }

    setupMediaSession() {
        this.setUpMediaAudio()
        console.log('mediaSession', "mediaSession" in navigator)
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: "Mr. Nome",
            });
            this.getArtist()

            navigator.mediaSession.setActionHandler("play", () => {
                console.log(this)
                console.log('play')
                this.play()
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                console.log('pause')
                this.pause()
            });
            navigator.mediaSession.setActionHandler("stop", () => {
                console.log('stop')
                this.stop()
            });
            // navigator.mediaSession.setActionHandler("seekbackward", () => {
            //     this.setBpm(this.bpm - 10)
            // });
            // navigator.mediaSession.setActionHandler("seekforward", () => {
            //     this.setBpm(this.bpm + 10)
            // });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                this.setBpm(this.bpm - 10)
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                this.setBpm(this.bpm + 10)
            });

            navigator.mediaSession.setActionHandler("seekto", (e) => {
                this.setBpm(Math.round(Math.min(e.seekTime, this.audioTag.duration - 1) / 2))
            });
        }
        console.log(navigator.mediaSession)
    }

    setUpMediaAudio () {
        if (!this.audioTag) {
            console.log('create audioTag')
            this.audioTag = document.createElement('audio')
            document.body.appendChild(this.audioTag)
            this.audioTag.src = "assets/sounds/silence-10m.flac"
        }
        
        // this.audioTag.addEventListener('seeked', (e) => {
        //     console.log('audio seek')
        //     if (this.audioTag.currentTime == 0) {
        //         this.audioTag.currentTime = this.audioTag.duration
        //     }
        //     let time = Math.round(Math.min(this.audioTag.currentTime, this.audioTag.duration - 1) / 2)
        //     if (time != this.bpm) {
        //         this.setBpm(time)
        //     }
        // })

        this.audioTag.controls = false
        this.audioTag.loop = true
        // this.audioTag.playbackRate = 0
    }
}