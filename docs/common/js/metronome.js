// Tone = require('tone')

Metronome = class Metronome {
    constructor(bpm, pattern, rhythm, audioButton) {
        this.bpm = bpm || 120;
        this.pattern = pattern || [1, 0, 0, 0];
        this.rhythm = rhythm || [1, 1, 1, 1];

        this.timeSig = [4, 4]

        this.currentBeat = 0;

        this.playing = false;

        this.audioButton = audioButton

        let audioTag = null

        if (this.audioButton) {
            audioTag = document.getElementById(this.audioButton.getAttribute('aria-controls'))
        }

        console.log(audioTag)

        if (audioTag) {
            this.audioTag = audioTag
        } else {
            this.setUpMediaAudio()
        }

        this.audio = new Tone.Sampler({
            urls: {
                "C4": "assets/sounds/gock block.mp3",
            },
            release: 1,
            onload: () => {
                this.makeLoop();
            },
        }).toDestination();

        // this.loop = new Tone.Loop(time => {
        //   this.audio.triggerAttackRelease("C4", "8n", time);
        // }, "4n").start();

        Tone.Transport.bpm.value = this.bpm;


        
        this.audioButton.addEventListener("click", () => {
            console.log('audioButton click')
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
                this.stop()
            }
        })
        this.audioTag.addEventListener('play', () => {
            console.log('audioTag play')
            if (!this.playing) {
                this.play()
            }
        })
    }

    makeLoop() {
        Tone.Transport.clear(this.loop);
        this.loop = Tone.Transport.scheduleRepeat((time) => {
            this.currentBeat = Math.min(this.timeSig[0] - 1, this.currentBeat)

            // console.log(beat);
            this.audio.triggerAttackRelease(['C4', 'E4'][this.pattern[this.currentBeat]], "4n", time);
            // for (let n = 1; n < this.pattern.length; n++) {
            //   this.audio.triggerAttackRelease("C4", "4n", time + (n * 0.5));

            // }
            this.currentBeat = (this.currentBeat + 1) % this.timeSig[0];

        }, this.timeSig[1] + "n", 0)
    }

    async play() {
        this.audioButton.setAttribute("data-state", "playing");
        this.currentBeat = 0;
        await Tone.start();
        this.playing = true;
        if (this.audioTag && this.audioTag.paused) {
            this.audioTag.play()
        }
        // navigator.mediaSession.playbackState = 'playing'
        this.offsetTime = 0;

        // this.loop.start(0);
        Tone.Transport.start();
    }

    stop() {
        this.audioButton.setAttribute("data-state", "stopped");
        this.playing = false;
        if (this.audioTag && !this.audioTag.paused) {
            this.audioTag.pause()
        }
        // navigator.mediaSession.playbackState = 'paused'
        // this.loop.stop();
        Tone.Transport.stop();
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


    playBeat(pitch) {
        this.audio.triggerAttackRelease("C4", 1);;
        // audio.currentTime = 0;
        // audio.play();

        // audio.start();
    }

    setBpm(bpm) {
        this.bpm = bpm || 120;
        Tone.Transport.bpm.value = this.bpm;
        this.getArtist()
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
                console.log('play')
                this.play()
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                this.stop()
            });
            navigator.mediaSession.setActionHandler("stop", () => {
                this.stop()
            });
            // navigator.mediaSession.setActionHandler("seekbackward", () => {
            //     this.setBpm(this.bpm - 10)
            // });
            // navigator.mediaSession.setActionHandler("seekforward", () => {
            //     this.setBpm(this.bpm + 10)
            // });
            navigator.mediaSession.setActionHandler("seekto", (e) => {
                console.log(e)
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                this.setBpm(this.bpm - 10)
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                this.setBpm(this.bpm + 10)
            });
        }
        console.log(navigator.mediaSession)
    }

    setUpMediaAudio = () => {
        if (!this.audioTag) {
            console.log('create audioTag')
            this.audioTag = document.createElement('audio');
            document.body.appendChild(this.audioTag);
            this.audioTag.src = "https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3";
            this.audioTag.loop = true;
        }
    }
}