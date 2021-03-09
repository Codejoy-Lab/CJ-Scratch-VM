const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const ml5 = require('ml5');
const formatMessage = require('format-message');

var currentNote = ""
var fre = 0
var second = 0

const Message={
  getPitch:{
    "en":"Pitch",
    "zh-cn":"音高",
  },
  getFre:{
    "en":"Frequency",
    "zh-cn":"频率",
  },
  startDetect:{
    "en":"Detect Pitch once every [SEC] seconds",
    "zh-cn":"每 [SEC] 秒检测一次",
  }
}
const AvailableLocales = ["en",'zh-cn']
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
    setLocale() {
      let locale = formatMessage.setup().locale
      if (AvailableLocales.includes(locale)) {
        return locale
      } else {
        return "en"
      }
    }
    getPitch() {
        
      setTimeout(()=>{
        this.pitch.getPitch(function(err, frequency) {
            // console.log("frequency",frequency)
            let scale = ['1', '1#', '2', '2#', '3', '4', '4#', '5', '5#', '6', '6#', '7'];
          if (frequency) {
            fre = frequency
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
          
        }, second)
        return currentNote
      }

      getFre(){
        // console.log('second',second)
        setTimeout(()=>{
            this.pitch.getPitch(function(err, frequency) {
              fre = frequency
            })
          }, second)
          
          return fre
       
      }

      startDetect(input){
        var val = input.SEC
        second = input.SEC*1000
      }

    // startPitch() {
    //     pitch = ml5.pitchDetection('https://cdn.jsdelivr.net/gh/sgszha17/ml5-test/model', audioContext, mic.stream, modelLoaded);
    //   }

    getInfo() {
      this._locale = this.setLocale()
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
                    text: Message.getPitch[this._locale]//"Pitch"
                },
                {
                  opcode: 'getFre',
                  // text: formatMessage({
                  //     id: 'videoSensing.videoToggle',
                  //     default: 'turn video [VIDEO_STATE]',
                  //     description: 'Controls display of the video preview layer'
                  // }),
                  blockType: BlockType.REPORTER,
                  text: Message.getFre[this._locale]//"Frequency"
              },
              {
                opcode: 'startDetect',
                // text: formatMessage({
                //     id: 'videoSensing.videoToggle',
                //     default: 'turn video [VIDEO_STATE]',
                //     description: 'Controls display of the video preview layer'
                // }),
                blockType: BlockType.COMMAND,
                text: Message.startDetect[this._locale],//"Detect Pitch once every [SEC] seconds",
                arguments:{
                  SEC:{
                    type: ArgumentType.NUMBER,
                    defaultValue: '1'
                  }
                }
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
