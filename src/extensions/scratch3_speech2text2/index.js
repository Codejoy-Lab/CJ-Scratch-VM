const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const log = require('../../util/log');
const DiffMatchPatch = require('diff-match-patch');
// const recorderWorker = new Worker('./transformpcm.worker.js')

// const speecchtextClient = require('./speechtext_client.js')

const textSpeechClient = require("./text2speech_client.js");

let buffer = []

var intervalList = []

let frameSize = 1280; //每一帧音频大小的整数倍，请注意不同音频格式一帧大小字节数不同，可参考下方建议
let intervel = 40;
let status = 0;  // 音频的状态

const Message = {
    stop:{
        'zh-cn': "停止录音",
		en: "Stop",
    },
    cleanAll:{
        en:'Clean All',
        'zh-cn': "清除",
    },
    listeningAndWaitThenStop:{
        en:'Listen the speech and wait [SEC] seconds',
        'zh-cn': "识别语音[SEC]秒",
    }
}

class Scratch3Speech2TextBlocksV2 {

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        this.isStop = false;
        this.tempResult = '';

        this.status = 'null'
        this.language = 'zh_cn'
        this.accent = 'mandarin'
        // this.client = new speecchtextClient(null,null)
        /**
         * An array of phrases from the [when I hear] hat blocks.
         * The list of phrases in the when I hear hat blocks.  This list is sent
         * to the speech api to seed the recognition engine and for deciding
         * whether the transcription results match.
         * @type {Array}
         * @private
         */
        this._phraseList = [];

        /**
         * The most recent transcription result received from the speech API that we decided to keep.
         * This is the value returned by the reporter block.
         * @type {String}
         * @private
         */
        this._currentUtterance = '';

        /**
         *  Similar to _currentUtterance, but set back to '' at the beginning of listening block
         *  and on green flag.
         *  Used to get the hat blocks to edge trigger.  In order to detect someone saying
         *  the same thing twice in two subsequent listen and wait blocks
         *  and still trigger the hat, we need this to go from
         *  '' at the beginning of the listen block to '<transcription value>' at the end.
         * @type {string}
         * @private
         */
        this._utteranceForEdgeTrigger = null;

        /**
         * The list of queued `resolve` callbacks for 'Listen and Wait' blocks.
         * We only listen to for one utterance at a time.  We may encounter multiple
         * 'Listen and wait' blocks that tell us to start listening. If one starts
         * and hasn't receieved results back yet, when we encounter more, any further ones
         * will all resolve when we get the next acceptable transcription result back.
         * @type {!Array}
         * @private
         */
        this._speechPromises = [];

        /**
         * The id of the timeout that will run if we start listening and don't get any
         * transcription results back. e.g. because we didn't hear anything.
         * @type {number}
         * @private
         */
        this._speechTimeoutId = null;

        /**
         * The id of the timeout that will run to wait for after we're done listening but
         * are still waiting for a potential isFinal:true transcription result to come back.
         * @type {number}
         * @private
         */
        this._speechFinalResponseTimeout = null;

        /**
         * The ScriptProcessorNode hooked up to the audio context.
         * @type {ScriptProcessorNode}
         * @private
         */
        this._scriptNode = null;

        /**
         * The socket used to communicate with the speech server to send microphone data
         * and recieve transcription results.
         * @type {WebSocket}
         * @private
         */
        this._socket = null;

        /**
         * The AudioContext used to manage the microphone.
         * @type {AudioContext}
         * @private
         */
        this._context = null;

        /**
         * MediaStreamAudioSourceNode to handle microphone data.
         * @type {MediaStreamAudioSourceNode}
         * @private
         */
        this._sourceNode = null;

        /**
         * A Promise whose fulfillment handler receives a MediaStream object when the microphone has been obtained.
         * @type {Promise}
         * @private
         */
        this._audioPromise = null;

        this.audioData = null
        /**
         * Diff Match Patch is used to do some fuzzy matching of the transcription results
         * with what is in the hat blocks.
         */
        this._dmp = new DiffMatchPatch();
        // Threshold for diff match patch to use: (0.0 = perfection, 1.0 = very loose).
        this._dmp.Match_Threshold = 0.3;


        this.client = null

        // this._newSocketCallback = this._newSocketCallback.bind(this);
        // this._setupSocketCallback = this._setupSocketCallback.bind(this);
        // this._socketMessageCallback = this._socketMessageCallback.bind(this);
        this._processAudioCallback = this._processAudioCallback.bind(this);
        // this._onTranscriptionFromServer = this._onTranscriptionFromServer.bind(this);
        this._resetListening = this._resetListening.bind(this);
        // this._stopTranscription = this._stopTranscription.bind(this);

        this.audioData = []
        // 记录听写结果
        this.resultText = ''
        // wpgs下的听写结果需要中间状态辅助记录
        this.resultTextTemp = ''

        this.runtime.on('PROJECT_STOP_ALL', this._resetListening.bind(this));
        this.runtime.on('PROJECT_START', this._resetEdgeTriggerUtterance.bind(this));

    }

    _initListening () {
        console.log("initlistening")
        this._initializeMicrophone();
        // this._initScriptNode();
        // this._newWebsocket();
    }

    /**
     * Called when we have data from the microphone. Takes that data and ships
     * it off to the speech server for transcription.
     * @param {audioProcessingEvent} e The event with audio data in it.
     * @private
     */
    _processAudioCallback (e) {
        // console.log("e",e)
        const floatSamples = e.inputBuffer.getChannelData(0);
        let bufTo16kHz = this.to16kHz(floatSamples)
        let bufTo16BitPCM = this.to16BitPCM(bufTo16kHz)
        this.audioData.push(...bufTo16BitPCM)
        

        

        // if (this._socket.readyState === WebSocket.CLOSED ||
        // this._socket.readyState === WebSocket.CLOSING) {
        //     log.error(`Not sending data because not in ready state. State: ${this._socket.readyState}`);
        //     this._initListening ()
        //     // TODO: should we stop trying and reset state so it might work next time?
        //     return;
        // }
        // const MAX_INT = Math.pow(2, 16 - 1) - 1;
        // const floatSamples = e.inputBuffer.getChannelData(0);
        // // The samples are floats in range [-1, 1]. Convert to 16-bit signed
        // // integer.Int16Array.from(floatSamples.map(n => n * MAX_INT))
        // this._socket.send(floatSamples);
        // this._socket.addEventListener('message', this._onTranscriptionFromServer);
    }

    /**
     * Initialize the audio context and connect the microphone.
     * @private
     */
    _initializeMicrophone () {
        // Don't make a new context if we already made one.
        if (!this._context) {
            // Safari still needs a webkit prefix for audio context
            this._context = new (window.AudioContext || window.webkitAudioContext)();
        }
        // In safari we have to call getUserMedia every time we want to listen. Other browsers allow
        // you to reuse the mediaStream.  See #1202 for more context.
        this._audioPromise = navigator.mediaDevices.getUserMedia({
            audio: true
        });

        this._audioPromise.then(stream =>{
            this._initScriptNode (stream)
        }).catch(e => {
            log.error(`Problem connecting to microphone:  ${e}`);
        });
    }

    _initScriptNode (stream) {
        // Create a node that sends raw bytes across the websocket
        this._scriptNode = this._context.createScriptProcessor(0, 1, 1);
        this._startByteStream(stream)
        // console.log('_initScriptNode')
    }

     /**
     * Do setup so we can start streaming mic data.
     * @private
     */
    _startByteStream (stream) {
        // Hook up the scriptNode to the mic
        this._sourceNode = this._context.createMediaStreamSource(stream);
        this._sourceNode.connect(this._scriptNode);
        this._scriptNode.addEventListener('audioprocess', this._processAudioCallback);
        this.startSendFromBuffer();
        this._scriptNode.connect(this._context.destination);
    }

    startSendFromBuffer(){

    }

    /**
     * Kick off the listening process.
     * @private
     */
    _startListening () {
        console.log("client",this.client)
        var _this = this
        // setTimeout(function(){ 
            _this.runtime.emitMicListening(true);
        // }, 800);
        
        this._initListening();
        // Force the block to timeout if we don't get any results back/the user didn't say anything.
        // this._speechTimeoutId = setTimeout(this._stopTranscription, listenAndWaitBlockTimeoutMs);
    }

     /**
     * Resets all things related to listening. Called on Red Stop sign button.
     *   - suspends audio processing
     *   - closes socket with speech socket server
     *   - clears out any remaining speech blocks that are waiting.
     * @private.
     */
    _resetListening () {
        console.log("_resetListening")
        this.runtime.emitMicListening(false);
        this._stopListening();
        this._resolveSpeechPromises();
    }

     /**
     * Resolves all the speech promises we've accumulated so far and empties out the list.
     * @private
     */
    _resolveSpeechPromises () {
        for (let i = 0; i < this._speechPromises.length; i++) {
            const resFn = this._speechPromises[i];
            resFn();
        }
        this._speechPromises = [];
    }

    /**
     * Call to suspend getting data from the microphone.
     * @private
     */
    _stopListening () {
        // Note that this can be called before any Listen And Wait block did setup,
        // so check that things exist before disconnecting them.
        if (this._context) {
            this._context.suspend.bind(this._context);
        }
        // This is called on green flag to reset things that may never have existed
        // in the first place. Do a bunch of checks.
        
        
        if (this._scriptNode) {
            // console.log("stop scriptNode")
            
            this._scriptNode.removeEventListener('audioprocess', this._processAudioCallback);
            this._scriptNode.disconnect();
        }
        if (this._sourceNode) {
            // console.log("this._sourceNode.disconnect()")
            this._sourceNode.disconnect()
        }
    }
    /**
     * Call into diff match patch library to compute whether there is a fuzzy match.
     * @param {string} text The text to search in.
     * @param {string} pattern The pattern to look for in text.
     * @returns {number} The index of the match or -1 if there isn't one.
     */
    _computeFuzzyMatch (text, pattern) {
        // Don't bother matching if any are null.
        if (!pattern || !text) {
            return -1;
        }
        let match = -1;
        try {
            // Look for the text in the pattern starting at position 0.
            match = this._dmp.match_main(text, pattern, 0);
            // console.log("match",match)
        } catch (e) {
            // This can happen inf the text or pattern gets too long.  If so just substring match.
            return pattern.indexOf(text);
        }
        return match;
    }

      /**
     * Reset the utterance we look for in the when I hear hat block back to
     * the empty string.
     * @private
     */
    _resetEdgeTriggerUtterance () {
        this._utteranceForEdgeTrigger = '';
    }
    
    setLocale() {
        let now_locale = "";
        switch (formatMessage.setup().locale) {
            case "en":
                now_locale = "en";
                break;
            case "zh-cn":
                now_locale = "zh-cn";
                break;
            default:
                now_locale = "zh-cn";
                break;
        }
        return now_locale;
    }

    getInfo () {
        this._locale = this.setLocale()
        return {
            id: 'speech2textv2',
            name:'speech2textv2',
            // formatMessage({
            //     id: 'speech.extensionName',
            //     default: 'Speech to Text',
            //     description: 'Name of extension that adds speech recognition blocks.'
            // }),
            // color1: '#4a90e2',
            // menuIconURI: menuIconURI,
            // blockIconURI: iconURI,
            blocks: [
                {
                    opcode: 'listenWait',
                    text: formatMessage({
                        id: 'speech.listenAndWait',
                        default: 'listen and wait',
                        // eslint-disable-next-line max-len
                        description: 'Start listening to the microphone and wait for a result from the speech recognition system.'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'stopListen',
                    text: formatMessage({
                        // id: 'speech.stopListen',
                        default: Message.stop[this._locale],
                        // eslint-disable-next-line max-len
                        description: 'Start listening to the microphone and wait for a result from the speech recognition system.'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'listeningAndWaitThenStop',
                    text: formatMessage({
                        // id: 'speech.listenAndWait',
                        default: Message.listeningAndWaitThenStop[this._locale],//'listen and wait',
                        // eslint-disable-next-line max-len
                        description: 'Start listening to the microphone and wait for a result from the speech recognition system.'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments:{
                        SEC:{
                            type: ArgumentType.NUMBER,
                            defaultValue:5
                        }
                    }
                },
                {
                    opcode: 'whenIHearHat',
                    text: formatMessage({
                        // id: 'speech.whenIHear',
                        default: 'when I hear [PHRASE]',
                        // eslint-disable-next-line max-len
                        description: 'Event that triggers when the text entered on the block is recognized by the speech recognition system.'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        PHRASE: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                // id: 'speech.defaultWhenIHearValue',
                                default: 'let\'s go',
                                description: 'The default phrase/word that, when heard, triggers the event.'
                            })
                        }
                    }
                },
                {
                    opcode: 'getSpeech',
                    text: formatMessage({
                        // id: 'speech.speechReporter',
                        default: 'speech',
                        description: 'Get the text of spoken words transcribed by the speech recognition system.'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'cleanAll',
                    text: formatMessage({
                        // id: 'speech.stopListen',
                        default:  Message.cleanAll[this._locale],
                        // eslint-disable-next-line max-len
                        // description: 'Start listening to the microphone and wait for a result from the speech recognition system.'
                    }),
                    blockType: BlockType.COMMAND
                },
            ]
        };
    }

    toBase64(buffer) {
        var binary = ''
        var bytes = new Uint8Array(buffer)
        var len = bytes.byteLength
        for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
      }
    sendRequestTo(){
        // console.log("开始合成")
        // var params = {
        //     "common": {
        //         "app_id": this.config.appid
        //     },
        //     // 填充business
        //     "business": {
        //         "aue": "lame",
        //         "auf": "audio/L16;rate=16000",
        //         "vcn": voice,//"aisjiuxu",
        //         "tte": "UTF8"
        //     },
        //     // 填充data
        //     "data": {
        //         "text": Buffer.from(words).toString('base64'),
        //         "status": 2
        //     }
        //   }
        // this.ws.send(JSON.stringify(params))
        if (this.client.ws.readyState !== 1) {
          return
        }
        let audioData = this.audioData.splice(0, 1280)
        var params = {
          common: {
            app_id: this.client.config.appid
          },
          business: {
            language: this.language, //小语种可在控制台--语音听写（流式）--方言/语种处添加试用
            domain: 'iat',
            accent: this.accent, //中文方言可在控制台--语音听写（流式）--方言/语种处添加试用
            vad_eos: 5000,
            dwa: 'wpgs', //为使该功能生效，需到控制台开通动态修正功能（该功能免费）
          },
          data: {
            status: 0,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: this.toBase64(audioData),
          },
        }
        this.client.ws.send(JSON.stringify(params))
        this.handlerInterval = setInterval(() => {
          // websocket未连接
          if (this.client.ws.readyState !== 1) {
            this.audioData = []
            clearInterval(this.handlerInterval)
            return
          }
          if (this.audioData.length === 0) {
            if (this.status === 'end') {
              this.client.ws.send(
                JSON.stringify({
                  data: {
                    status: 2,
                    format: 'audio/L16;rate=16000',
                    encoding: 'raw',
                    audio: '',
                  },
                })
              )
              this.audioData = []
              clearInterval(this.handlerInterval)
            }
            return false
          }
          audioData = this.audioData.splice(0, 1280)
          // 中间帧
          this.client.ws.send(
            JSON.stringify({
              data: {
                status: 1,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: this.toBase64(audioData),
              },
            })
          )
        }, 40)
        // return this.audio
    }

    result(resultData) {
        // 识别结束
        let jsonData = JSON.parse(resultData)
        if (jsonData.data && jsonData.data.result) {
          let data = jsonData.data.result
          let str = ''
          let resultStr = ''
          let ws = data.ws
          for (let i = 0; i < ws.length; i++) {
            str = str + ws[i].cw[0].w
          }
          // 开启wpgs会有此字段(前提：在控制台开通动态修正功能)
          // 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
          if (data.pgs) {
            if (data.pgs === 'apd') {
              // 将resultTextTemp同步给resultText
              this.setResultText({
                resultText: this.resultTextTemp,
              })
            }
            // 将结果存储在resultTextTemp中
            this.setResultText({
              resultTextTemp: this.resultText + str,
            })
          } else {
            this.setResultText({
              resultText: this.resultText + str,
            })
          }
        }
        if (jsonData.code === 0 && jsonData.data.status === 2) {
            console.log('close')
          this.client.ws.close()
        }
        if (jsonData.code !== 0) {
          this.client.ws.close()
          console.log(`${jsonData.code}:${jsonData.message}`)
        }
      }
  
      setResultText({ resultText, resultTextTemp } = {}) {
        this.onTextChange && this.onTextChange(resultTextTemp || resultText || '')
        resultText !== undefined && (this.resultText = resultText)
        resultTextTemp !== undefined && (this.resultTextTemp = resultTextTemp)
        console.log('resultText',resultText)
        this._utteranceForEdgeTrigger = resultText;
      }


    listenWait(){
        console.log("start")
        this._resetEdgeTriggerUtterance()
        // 
        // this.cleanAll = new textSpeechClient(null,null);
        var _this = this
        if(this.client === null){
            this.client = new textSpeechClient(
                ()=>{
                    this._startListening();
                    //send request
                    this.client.ws.onmessage=function(evt){
                        let res = JSON.parse(evt.data)
                        console.log('evt.data.audio',res.data)
                        _this.result(evt.data)
                        // _this.audio = Buffer.from(res.data.audio, 'base64')
                        // console.log('audioBuf',audioBuf)
                        
                    }
                    _this.sendRequestTo()
                }, // onConnect,
                null, // onDisconnect,
            )
        }else{
            if(this.client.ws.readyState != 1){
                this.client = new textSpeechClient(
                    ()=>{
                        this._startListening();
                        //send request
                        this.client.ws.onmessage=function(evt){
                            let res = JSON.parse(evt.data)
                            console.log('evt.data.audio',res.data)
                            _this.result(evt.data)
                            if(res.data.result.ls){
                                this.client.ws.close()
                            }
                            // _this.audio = Buffer.from(res.data.audio, 'base64')
                            // console.log('audioBuf',audioBuf)
                            
                        }
                        _this.sendRequestTo()
                    }, // onConnect,
                    null, // onDisconnect,
                )
            }else{
                this._startListening();
                this.sendRequestTo()
            }
            
        }
    }
    cleanAll(){
        this.resultText = ""
        this.resultTextTemp = ''
    }
    getSpeech(){
        return this.resultText
    }
    /**
     * Decide whether the pattern given matches the text. Uses fuzzy matching
     * @param {string} pattern The pattern to look for.  Usually this is the transcription result
     * @param {string} text The text to look in. Usually this is the set of phrases from the when I hear blocks
     * @returns {boolean} true if there is a fuzzy match.
     * @private
     */
    _speechMatches (pattern, text) {
        // pattern = this._normalizeText(pattern);
        // text = this._normalizeText(text);
        const match = this._computeFuzzyMatch(text, pattern);
        return match !== -1;
    }

    whenIHearHat(args){
        return this._speechMatches(args.PHRASE, this._utteranceForEdgeTrigger);
    }
    listeningandWait(sec){
        console.log("start")
        this._resetEdgeTriggerUtterance()
        // 
        // this.cleanAll = new textSpeechClient(null,null);
        var _this = this
        if(this.client === null){
            this.client = new textSpeechClient(
                ()=>{
                   
                    this._startListening();
                    //send request
                    this.client.ws.onmessage=function(evt){
                        // let res = JSON.parse(evt.data)
                        // console.log('evt.data.audio',res.data)
                        _this.result(evt.data)
                        // _this.audio = Buffer.from(res.data.audio, 'base64')
                        // console.log('audioBuf',audioBuf)
                        
                    }
                    _this.sendRequestTo()
                    setTimeout(function(){ 
                        _this.stopListen() 
                    },sec)
                }, // onConnect,
                null, // onDisconnect,
            )
        }else{
            if(this.client.ws.readyState != 1){
                this.client = new textSpeechClient(
                    ()=>{
                        this._startListening();
                        //send request
                        this.client.ws.onmessage=function(evt){
                            // let res = JSON.parse(evt.data)
                            // console.log('evt.data.audio',res.data)
                            _this.result(evt.data)
                            // _this.audio = Buffer.from(res.data.audio, 'base64')
                            // console.log('audioBuf',audioBuf)
                            
                        }
                        _this.sendRequestTo()
                        setTimeout(function(){ 
                            _this.stopListen() 
                        },sec)
                    }, // onConnect,
                    null, // onDisconnect,
                )
            }else{
                this._startListening();
                this.sendRequestTo()
            }
            
        }
        
    }
    listeningAndWaitThenStop(para){
        this.listeningandWait (para.SEC*1000)
        // var _this = this
        // console.log('para',para.SEC)
        // setTimeout(function(){ 
        //     console.log("timeout stop!")
        //     _this.stopListen() 
        // }, para.SEC*1000);
    }
    stopListen(){
        console.log("Stop")
        this._resetListening()
    }
    // helper 
    to16kHz (buffer) {
        var data = new Float32Array(buffer)
        var fitCount = Math.round(data.length * (16000 / 44100))
        var newData = new Float32Array(fitCount)
        var springFactor = (data.length - 1) / (fitCount - 1)
        newData[0] = data[0]
        for (let i = 1; i < fitCount - 1; i++) {
          var tmp = i * springFactor
          var before = Math.floor(tmp).toFixed()
          var after = Math.ceil(tmp).toFixed()
          var atPoint = tmp - before
          newData[i] = data[before] + (data[after] - data[before]) * atPoint
        }
        newData[fitCount - 1] = data[data.length - 1]
        return newData
      }
      to16BitPCM (input) {
        var dataLength = input.length * (16 / 8)
        var dataBuffer = new ArrayBuffer(dataLength)
        var dataView = new DataView(dataBuffer)
        var offset = 0
        for (var i = 0; i < input.length; i++, offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]))
          dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        }
        return Array.from(new Int8Array(dataView.buffer))
      }
}
module.exports = Scratch3Speech2TextBlocksV2;
