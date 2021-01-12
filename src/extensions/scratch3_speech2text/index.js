const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const log = require('../../util/log');
const DiffMatchPatch = require('diff-match-patch');
// const recorderWorker = new Worker('./transformpcm.worker.js')

const speecchtextClient = require('./speechtext_client.js')


let buffer = []

var intervalList = []
// recorderWorker.onmessage = function (e) {
//     buffer.push(...e.data.buffer)
//   }
/**
 * Url of icon to be displayed at the left edge of each extension block.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cGF0aCBkPSJNMTIgMTRjMS42NiAwIDIuOTktMS4zNCAyLjk5LTNMMTUgNWMwLTEuNjYtMS4zNC0zLTMtM1M5IDMuMzQgOSA1djZjMCAxLjY2IDEuMzQgMyAzIDN6bTUuMy0zYzAgMy0yLjU0IDUuMS01LjMgNS4xUzYuNyAxNCA2LjcgMTFINWMwIDMuNDEgMi43MiA2LjIzIDYgNi43MlYyMWgydi0zLjI4YzMuMjgtLjQ4IDYtMy4zIDYtNi43MmgtMS43eiIvPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4K';


/**
 * Url of icon to be displayed in the toolbox menu for the extension category.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzc1NzU3NSI+CiAgICA8cGF0aCBkPSJNMTIgMTRjMS42NiAwIDIuOTktMS4zNCAyLjk5LTNMMTUgNWMwLTEuNjYtMS4zNC0zLTMtM1M5IDMuMzQgOSA1djZjMCAxLjY2IDEuMzQgMyAzIDN6bTUuMy0zYzAgMy0yLjU0IDUuMS01LjMgNS4xUzYuNyAxNCA2LjcgMTFINWMwIDMuNDEgMi43MiA2LjIzIDYgNi43MlYyMWgydi0zLjI4YzMuMjgtLjQ4IDYtMy4zIDYtNi43MmgtMS43eiIvPgogICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';


/**
 * The url of the speech server.
 * @type {string}
 */
const serverURL = 'ws://speech.scratch.mit.edu';

/**
 * The amount of time to wait between when we stop sending speech data to the server and when
 * we expect the transcription result marked with isFinal: true to come back from the server.
 * @type {int}
 */
const finalResponseTimeoutDurationMs = 3000;

/**
 * The max amount of time the Listen And Wait block will listen for.  It may listen for less time
 * if we get back results that are good and think the user is done talking.
 * Currently set to 10sec. This should not exceed the speech api limit (60sec) without redoing how
 * we stream the microphone data data.
 * @type {int}
 */
const listenAndWaitBlockTimeoutMs = 10000;



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

class Scratch3Speech2TextBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        this.isStop = false;
        this.tempResult = '';
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


        /**
         * Diff Match Patch is used to do some fuzzy matching of the transcription results
         * with what is in the hat blocks.
         */
        this._dmp = new DiffMatchPatch();
        // Threshold for diff match patch to use: (0.0 = perfection, 1.0 = very loose).
        this._dmp.Match_Threshold = 0.3;

        this._newSocketCallback = this._newSocketCallback.bind(this);
        this._setupSocketCallback = this._setupSocketCallback.bind(this);
        this._socketMessageCallback = this._socketMessageCallback.bind(this);
        this._processAudioCallback = this._processAudioCallback.bind(this);
        this._onTranscriptionFromServer = this._onTranscriptionFromServer.bind(this);
        this._resetListening = this._resetListening.bind(this);
        this._stopTranscription = this._stopTranscription.bind(this);


        this.runtime.on('PROJECT_STOP_ALL', this._resetListening.bind(this));
        this.runtime.on('PROJECT_START', this._resetEdgeTriggerUtterance.bind(this));

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

    /**
     * Scans all the 'When I hear' hat blocks for each sprite and pulls out the text.  The list
     * is sent off to the speech recognition server as hints.  This *only* reads the value out of
     * the hat block shadow.  If a block is dropped on top of the shadow, it is skipped.
     * @returns {Array} list of strings from the hat blocks in the project.
     * @private
     */
    _scanBlocksForPhraseList () {
        const words = [];
        // For each each target, walk through the top level blocks and check whether
        // they are speech hat/when I hear blocks.
        this.runtime.targets.forEach(target => {
            target.blocks._scripts.forEach(id => {
                const b = target.blocks.getBlock(id);
                if (b.opcode === 'speech_whenIHearHat') {
                    // Grab the text from the hat block's shadow.
                    const inputId = b.inputs.PHRASE.block;
                    const inputBlock = target.blocks.getBlock(inputId);
                    // Only grab the value from text blocks. This means we'll
                    // miss some. e.g. values in variables or other reporters.
                    if (inputBlock.opcode === 'text') {
                        const word = target.blocks.getBlock(inputId).fields.TEXT.value;
                        words.push(word);
                    }
                }
            });
        });
        return words;
    }

    /**
     * Get the viewer's language code.
     * @return {string} the language code.
     */
    _getViewerLanguageCode () {
        return formatMessage.setup().locale || navigator.language || navigator.userLanguage || 'en-US';
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
     * Reset the utterance we look for in the when I hear hat block back to
     * the empty string.
     * @private
     */
    _resetEdgeTriggerUtterance () {
        this._utteranceForEdgeTrigger = '';
    }

    /**
     * Close the connection to the socket server if it is open.
     * @private
     */
    _closeWebsocket () {
        if (this._socket && this._socket.readyState === this._socket.OPEN) {
            this._socket.close();
            console.log("close Socket")
        }
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
     * Called when we want to stop listening (e.g. when a listen block times out)
     * but we still want to wait a little to see if we get any transcription results
     * back before yielding the block execution.
     * @private
     */
    _stopTranscription () {
        this._stopListening();
        if (this._socket && this._socket.readyState === this._socket.OPEN) {
            
            this._socket.close()
        }
        // Give it a couple seconds to response before giving up and assuming nothing else will come back.
        this._speechFinalResponseTimeout = setTimeout(this._resetListening, finalResponseTimeoutDurationMs);
    }

    /**
     * Decides whether to keep a given transcirption result.
     * @param {number} fuzzyMatchIndex Index of the fuzzy match or -1 if there is no match.
     * @param {object} result The json object representing the transcription result.
     * @param {string} normalizedTranscript The transcription text used for matching (i.e. lowercased, no punctuation).
     * @returns {boolean} true If a result is good enough to be kept.
     * @private
     */
    _shouldKeepResult (fuzzyMatchIndex, result, normalizedTranscript) {
        // The threshold above which we decide transcription results are unlikely to change again.
        // See https://cloud.google.com/speech-to-text/docs/basics#streaming_responses.
        const stabilityThreshold = .85;

        // For responsiveness of the When I Hear hat blocks, sometimes we want to keep results that are not
        // yet marked 'isFinal' by the speech api.  Here are some signals we use.

        // If the result from the speech api isn't very stable and we only had a fuzzy match, we don't want to use it.
        const shouldKeepFuzzyMatch = fuzzyMatchIndex !== -1 && result.stability > stabilityThreshold;

        // TODO: This is for debugging. Remove when this function is finalized.
        if (shouldKeepFuzzyMatch) {
            log.info(`Fuzzy match with high stability.`);
            log.info(`match index is  ${fuzzyMatchIndex}`);
            const phrases = this._phraseList.join(' ');
            const matchPhrase = phrases.substring(fuzzyMatchIndex, fuzzyMatchIndex + normalizedTranscript.length);
            log.info(`fuzzy match: ${matchPhrase} in ${normalizedTranscript}`);
        }

        // If the result is in the phraseList (i.e. it matches one of the 'When I Hear' blocks), we keep it.
        // This might be aggressive... but so far seems to be a good thing.
        const shouldKeepPhraseListMatch = this._phraseList.includes(normalizedTranscript);
        // TODO: This is just for debugging. Remove when this function is finalized.
        if (shouldKeepPhraseListMatch) {
            log.info(`phrase list ${this._phraseList} includes ${normalizedTranscript}`);
        }
        // TODO: This is for debugging. Remove when this function is finalized.
        if(result){
            if (result.isFinal) {
                log.info(`result is final`);
            }
    
            if (!result.isFinal && !shouldKeepPhraseListMatch && !shouldKeepFuzzyMatch) {
                return false;
            }
            
        }
        return true;
    }

    /**
     * Normalizes text a bit to facilitate matching.  Lowercases, removes some punctuation and whitespace.
     * @param {string} text The text to normalzie
     * @returns {string} The normalized text.
     * @private
     */
    // _normalizeText (text) {
    //     text = Cast.toString(text).toLowerCase();
    //     text = text.replace(/[.?!]/g, '');
    //     text = text.trim();
    //     return text;
    // }
    _normalizeText (data) {
        let rtasrResult = []
        // var currentText = $('#result_output').html()
        // console.log("_normalizeText",data)
        if(data){
            rtasrResult[data.seg_id] = data
            var interResult = ''
            rtasrResult.forEach(i => {
                let str = ""
                if(i.cn && i.cn.st && i.cn.st.type){
                    // str += (i.cn.st.type == 0) ? "【最终】识别结果：" : "【中间】识别结果："
                    i.cn.st.rt.forEach(j => {
                        j.ws.forEach(k => {
                        k.cw.forEach(l => {
                            str += l.w
                        })
                        })
                    })
                }
                console.log(str)
                if(i.cn.st.type == 0){
                    if(!this.tempResult.includes(str)) this.tempResult += str
                    interResult = ''
                } else{
                    // if(this.tempResult ===''){
                    //     this.tempResult = str
                    // }
                    interResult = str
                    console.log("【中间】识别结果",str)
                } 
                // this._currentUtterance = str
            })
            return this.tempResult+interResult
        }
        
        //   if (currentText.length == 0) {
        //     $('#result_output').html(str)
        //   } else {
        //     $('#result_output').html(currentText + "<br>" +str)
        //   }
        //   var ele = document.getElementById('result_output');
        //   ele.scrollTop = ele.scrollHeight;
        
        
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
            console.log("match",match)
        } catch (e) {
            // This can happen inf the text or pattern gets too long.  If so just substring match.
            return pattern.indexOf(text);
        }
        return match;
    }

    /**
     * Processes the results we get back from the speech server.  Decides whether the results
     * are good enough to keep. If they are, resolves the 'Listen and Wait' blocks promise and cleans up.
     * @param {object} result The transcription result.
     * @private
     */
    _processTranscriptionResult (result) {
        log.info(`Got result: ${JSON.stringify(result)}`);
        const transcriptionResult = this._normalizeText(result);
        // // result.alternatives[0].transcript
        // // Waiting for an exact match is not satisfying.  It makes it hard to catch
        // // things like homonyms or things that sound similar "let us" vs "lettuce".  Using the fuzzy matching helps
        // // more aggressively match the phrases that are in the "When I hear" hat blocks.
        // const phrases = this._phraseList.join(' ');
        // const fuzzyMatchIndex = this._computeFuzzyMatch(phrases, transcriptionResult);
        
        // // If the result isn't good enough yet, return without saving and resolving the promises.
        // if (!this._shouldKeepResult(fuzzyMatchIndex, result, transcriptionResult)) {
        //     return;
        // }

        this._currentUtterance = transcriptionResult;
        log.info(`Keeing result: ${this._currentUtterance}`);
        this._utteranceForEdgeTrigger = transcriptionResult;

        // We're done listening so resolove all the promises and reset everying so we're ready for next time.
        // this._resetListening();

        // We got results so clear out the timeouts.
        
    }

    /**
     * Handle a message from the socket. It contains transcription results.
     * @param {MessageEvent} e The message event containing data from speech server.
     * @private
     */
    _onTranscriptionFromServer (e) {
        let result = null;
        var data = null
        let _this = this
        
        try {
            // console.log("result",e)
            result = JSON.parse(e.data);
            if(result.data){
                data = JSON.parse(result.data)
                console.log("result.data",data)
            }
            // if (this._speechTimeoutId) {
            //     clearTimeout(this._speechTimeoutId);
            //     this._speechTimeoutId = null;
            // }
            if (this._speechFinalResponseTimeout) {
                clearTimeout(this._speechFinalResponseTimeout);
                this._speechFinalResponseTimeout = null;
            }
            // if((this.isStop&&data && data.cn && data.cn && data.cn.st.type =="0")||(result.action==='error')){
            if((this.isStop&&data && data.ls)||(result.action==='error')){
                
                if(result.code==='10205') this._currentUtterance = "Internet Error"
                setTimeout(function(){
                    _this._closeWebsocket ()
                    console.log('Close Websocket')
                    // console.log("_this.handlerInterval",_this.handlerInterval)
                    intervalList.forEach(interval =>{
                        clearInterval(interval)
                        // intervalList.pop(interval)
                    })
                    _this.handlerInterval = null
                    _this._resetListening();
                    _this.isStop = false
                    _this.tempResult = ''
                },5000)
                
            }
            
            
        } catch (ex) {
            log.error(`Problem parsing json. continuing: ${ex}`);
            // TODO: Question - Should we kill listening and continue?
            return;
        }
        this._processTranscriptionResult(data);
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

    /**
     * Kick off the listening process.
     * @private
     */
    _startListening () {
        var _this = this
        // setTimeout(function(){ 
            _this.runtime.emitMicListening(true);
        // }, 800);
        
        this._initListening();
        // Force the block to timeout if we don't get any results back/the user didn't say anything.
        // this._speechTimeoutId = setTimeout(this._stopTranscription, listenAndWaitBlockTimeoutMs);
    }

    /**
     * Resume listening for audio and re-open the socket to send data.
     * @private
     */
    _resumeListening () {
        this._context.resume.bind(this._context);
        this._newWebsocket();
    }

    /**
     * Does all setup to get microphone data and initializes the web socket.
     * that data to the speech server.
     * @private
     */
    _initListening () {
        this._initializeMicrophone();
        this._initScriptNode();
        this._newWebsocket();
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

        this._audioPromise.then().catch(e => {
            log.error(`Problem connecting to microphone:  ${e}`);
        });
    }

    /**
     * Sets up the script processor and the web socket.
     * @private
     *
     */
    _initScriptNode () {
        // Create a node that sends raw bytes across the websocket
        this._scriptNode = this._context.createScriptProcessor(0, 1, 1);
        console.log('_initScriptNode')
    }

    /**
     * Callback called when it is time to setup the new web socket.
     * @param {Function} resolve - function to call when the web socket opens succesfully.
     * @param {Function} reject - function to call if opening the web socket fails.
     */
    _newSocketCallback (resolve, reject) {
        this._socket = new WebSocket(this.client.url);
        this._socket.addEventListener('open', resolve);
        this._socket.addEventListener('error', reject);
    }

    /**
     * Callback called once we've initially established the web socket is open and working.
     * Sets up the callback for subsequent messages (i.e. transcription results)  and
     * connects to the script node to get data.
     * @private
     */
    _socketMessageCallback () {
        console.log("onmessage")
        // this._socket.onmessage=function(evt){
        //         // let res = JSON.parse(evt.data)
        //         console.log('evt.data.audio',evt)
        //         // _this.audio = Buffer.from(res.data.audio, 'base64')
        //         // console.log('audioBuf',audioBuf)
                
            
        // }
        // this._socket.addEventListener('message', this._onTranscriptionFromServer);
        this._startByteStream();
    }

    /**
     * Sets up callback for when socket and audio are initialized.
     * @private
     */
    _newWebsocket () {
        // let _this = this
        this.client = new speecchtextClient(null,null)
        // this.client = new speecchtextClient(()=>{
        //     console.log("Connected")
        //     // let vm = _this
        //     this._setupSocketCallback()
            // const langCode = _this._getViewerLanguageCode();
            // _this.client.ws.onmessage=function(evt){
            //     let res = JSON.parse(evt.data)
                
                // console.log('sampleRate',{
                //     sampleRate: vm._context.sampleRate,
                //     phrases: vm._phraseList,
                //     locale: langCode
                // })
                // _this.audio = Buffer.from(res.data.audio, 'base64')
                // console.log('audioBuf',audioBuf)
                
            // }
        // },null)
        const websocketPromise = new Promise(this._newSocketCallback);
        Promise.all([this._audioPromise, websocketPromise]).then(
            this._setupSocketCallback)
            .catch(e => {
                log.error(`Problem with setup:  ${e}`);
            });
    }

    /**
     * Callback to handle initial setting up of a socket.
     * Currently we send a setup message (only contains sample rate) but might
     * be useful to send more data so we can do quota stuff.
     * @param {Array} values The
     */
    _setupSocketCallback (values) {
        // console.log("values",values)
        this._micStream = values[0];
        this._socket = values[1].target;

        this._socket.addEventListener('error', e => {
            log.error(`Error from web socket: ${e}`);
        });

        // Send the initial configuration message. When the server acknowledges
        // it, start streaming the audio bytes to the server and listening for
        // transcriptions.
        this._startByteStream();
        this._socket.addEventListener('message', this._socketMessageCallback, {once: true});
        const langCode = this._getViewerLanguageCode();
        this._socket.send(JSON.stringify(
            {
                sampleRate: this._context.sampleRate,
                phrases: this._phraseList,
                locale: langCode
            }
        ));
    }

    /**
     * Do setup so we can start streaming mic data.
     * @private
     */
    _startByteStream () {
        // Hook up the scriptNode to the mic
        this._sourceNode = this._context.createMediaStreamSource(this._micStream);
        this._sourceNode.connect(this._scriptNode);
        this._scriptNode.addEventListener('audioprocess', this._processAudioCallback);
        this.startSendFromBuffer();
        this._scriptNode.connect(this._context.destination);
    }

    startSendFromBuffer(){
        
            this._socket.addEventListener('message', this._onTranscriptionFromServer);
            
            let _this = this
            if(buffer.length>0){
                var audioData = buffer.splice(0, 1279)
                if(audioData.length > 0){
                    console.log("send")
                    _this._socket.send(new Int8Array(audioData));
                }
            }   
            this.handlerInterval = setInterval(() => {
                if(buffer.length>0){
       
                    // this._socket.send(new Int8Array(audioData));
    
                    if (_this._socket.readyState === WebSocket.CLOSED ||
                        _this._socket.readyState === WebSocket.CLOSING) {
                        log.error(`Not sending data because not in ready state. State: ${_this._socket.readyState}`);
                        _this._resetListening ()
                        // clearInterval(_this.handlerInterval)
                        intervalList.forEach(interval =>{
                            clearInterval(interval)
                            // intervalList.pop(interval)
                        })
                        _this.handlerInterval = null
                        return
                    }
        
                    var audioData = buffer.splice(0, 1280)
                    if(audioData.length > 0){
                        console.log("send")
                        _this._socket.send(new Int8Array(audioData));
                    }
                }
                else if(this.isStop){
                    // this.isStop = false
                    let _this = this
                    setTimeout(function(){ 
                        console.log("发送结束标识")
                        _this._socket.send("{\"end\": true}"); 
                    }, 5000)
                    
                    intervalList.forEach(interval =>{
                        clearInterval(interval)
                        // intervalList.pop(interval)
                    })
                    
                    // return
                }
            }, 40)
            
            if(!intervalList.includes(this.handlerInterval)) {
                console.log(this.handlerInterval)
                intervalList.push(this.handlerInterval)
            }
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
        buffer.push(...bufTo16BitPCM)
        

        

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
     * The key to load & store a target's speech-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.speech';
    }

    /**
     * @returns {object} Metadata for this extension and its blocks.
     */
    getInfo () {
        this._locale = this.setLocale()
        return {
            id: 'speech2text',
            name: formatMessage({
                id: 'speech.extensionName',
                default: 'Speech to Text',
                description: 'Name of extension that adds speech recognition blocks.'
            }),
            menuIconURI: menuIconURI,
            blockIconURI: iconURI,
            blocks: [
                {
                    opcode: 'listenAndWait',
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
                        id: 'speech.stopListen',
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
                        id: 'speech.whenIHear',
                        default: 'when I hear [PHRASE]',
                        // eslint-disable-next-line max-len
                        description: 'Event that triggers when the text entered on the block is recognized by the speech recognition system.'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        PHRASE: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'speech.defaultWhenIHearValue',
                                default: 'let\'s go',
                                description: 'The default phrase/word that, when heard, triggers the event.'
                            })
                        }
                    }
                },
                {
                    opcode: 'getSpeech',
                    text: formatMessage({
                        id: 'speech.speechReporter',
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

    /**
     * Start the listening process if it isn't already in progress.
     * @return {Promise} A promise that will resolve when listening is complete.
     */
    listenAndWait () {
        this._phraseList = this._scanBlocksForPhraseList();
        this._resetEdgeTriggerUtterance();

        const speechPromise = new Promise(resolve => {
            const listeningInProgress = this._speechPromises.length > 0;
            this._speechPromises.push(resolve);
            if (!listeningInProgress) {
                console.log("listeningInProgress",listeningInProgress)
                this._startListening();
            }
        });
        // console.log("speechPromise",speechPromise)
        return speechPromise;
    }
    listeningAndWaitThenStop(para){
        this.listenAndWait ()
        var _this = this
        // console.log('para',para.SEC)
        setTimeout(function(){ 
            console.log("timeout stop!")
            _this.stopListen() 
        }, para.SEC*1000);
        
    }

    stopListen(){
        this._resetListening()
        this.isStop = true
    }

    /**
     * An edge triggered hat block to listen for a specific phrase.
     * @param {object} args - the block arguments.
     * @return {boolean} true if the phrase matches what was transcribed.
     */
    whenIHearHat (args) {
        return this._speechMatches(args.PHRASE, this._utteranceForEdgeTrigger);
    }

    /**
     * Reporter for the last heard phrase/utterance.
     * @return {string} The lastest thing we heard from a listen and wait block.
     */
    getSpeech () {
        return this._currentUtterance;
    }
    cleanAll(){
        this._currentUtterance = ""
        // return this._currentUtterance;
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
module.exports = Scratch3Speech2TextBlocks;