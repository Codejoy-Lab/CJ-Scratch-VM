const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const ml5 = require('ml5');
const formatMessage = require('format-message');

var currentNote = ""

class PitchDetection{
    constructor(runtime) {
        this.runtime = runtime;
        // this.pitch = null;
        this.crepe;
        this.voiceLow = 100;
        this.voiceHigh = 500;
        this.audioStream;
        
        // Circle variables
        this.circleSize = 42;
        

        this.setup()
    }
    // freqToMidi(f) {
    //     var mathlog2 = Math.log(f / 440) / Math.log(2);
    //     var m = Math.round(12 * mathlog2) + 69;
    //     return m;
    //   };

    getPitch() {
        
        this.pitch.getPitch(function(err, frequency) {
            console.log("frequency",frequency)
            let scale = ['1', '1#', '2', '2#', '3', '4', '4#', '5', '5#', '6', '6#', '7'];
          if (frequency) {
            var mathlog2 = Math.log(frequency / 440) / Math.log(2);
            var midiNum = Math.round(12 * mathlog2) + 69;
            // let midiNum = this.freqToMidi(frequency);
            currentNote = scale[midiNum % 12];
            // select('#currentNote').html(currentNote);
            // console.log(currentNote)
            // return currentNote
          }
        })
        console.log("currentNote",currentNote)
        return currentNote
      }

    // startPitch() {
    //     pitch = ml5.pitchDetection('https://cdn.jsdelivr.net/gh/sgszha17/ml5-test/model', audioContext, mic.stream, modelLoaded);
    //   }

    getInfo() {
        return {
            id: 'PitchDetection',
            name: 'Pitch Detection',
            blocks: [
                {
                    opcode: 'getPitch',
                    // text: formatMessage({
                    //     id: 'videoSensing.videoToggle',
                    //     default: 'turn video [VIDEO_STATE]',
                    //     description: 'Controls display of the video preview layer'
                    // }),
                    blockType: BlockType.REPORTER,
                    text: "Pitch"
                }
            ],
            menus: {
                // ATTRIBUTE: {
                //     acceptReporters: true,
                //     items: this._buildMenu(this.ATTRIBUTE_INFO)
                // },
                // SUBJECT: {
                //     acceptReporters: true,
                //     items: this._buildMenu(this.SUBJECT_INFO)
                // },
                // VIDEO_STATE: {
                //     acceptReporters: true,
                //     items:this._buildMenu(this.VIDEO_STATE_INFO),
                // },
                // typemenu: {
                //     acceptReporters: true,
                //     items: '_typeArr'
                // }
            }
        };
    }
    startPitch(stream, audioContext) {
        this.pitch = ml5.pitchDetection('https://cdn.jsdelivr.net/gh/sgszha17/ml5-test/model', audioContext, stream, this.modelLoaded);
      }

    modelLoaded() {
        console.log('Model Loaded');
        // getPitch();
      }

    async setup() {
        // canvas = createCanvas(width, height);
        // textCoordinates = [width / 2, 30];
        // gameReset();
      
        audioContext = new AudioContext();
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        this.startPitch(stream, audioContext);
      
        // requestAnimationFrame(draw)
      }
}

module.exports = PitchDetection;
