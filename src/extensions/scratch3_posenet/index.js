require('babel-polyfill');
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const Video = require('../../io/video');
const formatMessage = require('format-message');
const tf = require('@tensorflow/tfjs');
const posenet = require('@tensorflow-models/posenet');

const util = require('./util');
// const mobilenetModule = require('./mobilenet.js');
// const knnClassifier = require('@tensorflow-models/knn-classifier');

/**
 * Sensor attribute video sensor block should report.
 * @readonly
 * @enum {string}
 */
const SensingAttribute = {
    /** The amount of motion. */
    MOTION: 'motion',

    /** The direction of the motion. */
    DIRECTION: 'direction'
};

/**
 * Subject video sensor block should report for.
 * @readonly
 * @enum {string}
 */
const SensingSubject = {
    /** The sensor traits of the whole stage. */
    STAGE: 'Stage',

    /** The senosr traits of the area overlapped by this sprite. */
    SPRITE: 'this sprite'
};

/**
 * States the video sensing activity can be set to.
 * @readonly
 * @enum {string}
 */
const VideoState = {
    /** Video turned off. */
    OFF: 'off',

    /** Video turned on with default y axis mirroring. */
    ON: 'on',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: 'on-flipped'
};

const poseID = {
    a : '1',
    b : '2',
}

const test=[1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10]

const guiState = {
    loaded:false,
}

let typeArr = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10'
]

const pos=[
    'x',
    'y'
]

const parts=[
    'nose',
    "leftEye",
    "rightEye",
    "leftEar",
    "rightEar",
    "rightShoulder",
    "leftShoulder",
    "leftElbow",
    "rightElbow",
    "leftWrist",
    "rightWrist",
    "leftHip",
    "rightHip",
    "leftKnee",
    "rightKnee",
    "leftAnkle",
    "rightAnkle"
]

/**
 * Class for the motion-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 * Scratch3Knn
 */
class Scratch3posenet {
    constructor(runtime) {
        this.knn = null
        this.pose = null
        this.currentPart = null
        this.trainTypes = typeArr.map(item => {
            return 'label' + item
        })
        // this.knnInit()
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The last millisecond epoch timestamp that the video stream was
         * analyzed.
         * @type {number}
         */
        this._lastUpdate = null;
        this.KNN_INTERVAL = 1000
        if (this.runtime.ioDevices) {
            // Clear target motion state values when the project starts.
            this.runtime.on(Runtime.PROJECT_RUN_START, this.reset.bind(this));

            // Kick off looping the analysis logic.
            // this._loop();

            // Configure the video device with values from a globally stored
            // location.
            this.setVideoTransparency({
                TRANSPARENCY: 10
            });
            this.videoToggle({
                VIDEO_STATE: this.globalVideoState
            });
            this.poseDetection();
        }

        // setInterval(async () => {
        //     if (this.globalVideoState === VideoState.ON) {
        //         await this.gotResult()
        //         console.log('knn result:', this.trainResult)
        //     }
        // }, this.KNN_INTERVAL)
    }

    /**
     * After analyzing a frame the amount of milliseconds until another frame
     * is analyzed.
     * @type {number}
     */
    static get INTERVAL() {
        return 33;
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS() {
        return [480, 360];
    }

    /**
     * The key to load & store a target's motion-related state.
     * @type {string}
     */
    static get STATE_KEY() {
        return 'Scratch.videoSensing';
    }

    /**
     * The default motion-related state, to be used when a target has no existing motion state.
     * @type {MotionState}
     */
    static get DEFAULT_MOTION_STATE() {
        return {
            motionFrameNumber: 0,
            motionAmount: 0,
            motionDirection: 0
        };
    }

    /**
     * The transparency setting of the video preview stored in a value
     * accessible by any object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoTransparency() {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoTransparency;
        }
        return 10;
    }

    set globalVideoTransparency(transparency) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoTransparency = transparency;
        }
        return transparency;
    }

    /**
     * The video state of the video preview stored in a value accessible by any
     * object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoState() {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoState;
        }
        return VideoState.ON;
    }

    set globalVideoState(state) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoState = state;
        }
        return state;
    }

    /**
     * Reset the extension's data motion detection data. This will clear out
     * for example old frames, so the first analyzed frame will not be compared
     * against a frame from before reset was called.
     */
    reset() {
        const targets = this.runtime.targets;
        for (let i = 0; i < targets.length; i++) {
            const state = targets[i].getCustomState(Scratch3posenet .STATE_KEY);
            if (state) {
                state.motionAmount = 0;
                state.motionDirection = 0;
            }
        }
    }

    /**
     * Occasionally step a loop to sample the video, stamp it to the preview
     * skin, and add a TypedArray copy of the canvas's pixel data.
     * @private
     */
    _loop() {
        setTimeout(this._loop.bind(this), Math.max(this.runtime.currentStepTime, Scratch3Knn .INTERVAL));

        // Add frame to detector
        const time = Date.now();
        if (this._lastUpdate === null) {
            this._lastUpdate = time;
        }
        const offset = time - this._lastUpdate;
        if (offset > Scratch3posenet .INTERVAL) {
            const frame = this.runtime.ioDevices.video.getFrame({
                format: Video.FORMAT_IMAGE_DATA,
                dimensions: Scratch3posenet .DIMENSIONS
            });
            if (frame) {
                this._lastUpdate = time;
            }
        }
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu(info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    /**
     * @param {Target} target - collect motion state for this target.
     * @returns {MotionState} the mutable motion state associated with that
     *   target. This will be created if necessary.
     * @private
     */
    _getMotionState(target) {
        let motionState = target.getCustomState(Scratch3posenet .STATE_KEY);
        if (!motionState) {
            motionState = Clone.simple(Scratch3posenet .DEFAULT_MOTION_STATE);
            target.setCustomState(Scratch3posenet .STATE_KEY, motionState);
        }
        return motionState;
    }

    static get SensingAttribute() {
        return SensingAttribute;
    }

    // /**
    //  * An array of choices of whether a reporter should return the frame's
    //  * motion amount or direction.
    //  * @type {object[]} an array of objects
    //  * @param {string} name - the translatable name to display in sensor
    //  *   attribute menu
    //  * @param {string} value - the serializable value of the attribute
    //  */
    get ATTRIBUTE_INFO() {
        return [
            {
                name: 'motion',
                value: SensingAttribute.MOTION
            },
            {
                name: 'direction',
                value: SensingAttribute.DIRECTION
            }
        ];
    }

    static get SensingSubject() {
        return SensingSubject;
    }

    // /**
    //  * An array of info about the subject choices.
    //  * @type {object[]} an array of objects
    //  * @param {string} name - the translatable name to display in the subject menu
    //  * @param {string} value - the serializable value of the subject
    //  */
    get SUBJECT_INFO() {
        return [
            {
                name: 'stage',
                value: SensingSubject.STAGE
            },
            {
                name: 'sprite',
                value: SensingSubject.SPRITE
            }
        ];
    }

    // /**
    //  * States the video sensing activity can be set to.
    //  * @readonly
    //  * @enum {string}
    //  */
    static get VideoState() {
        return VideoState;
    }

    static get poseID() {
        return poseID;
    }

    // /**
    //  * An array of info on video state options for the "turn video [STATE]" block.
    //  * @type {object[]} an array of objects
    //  * @param {string} name - the translatable name to display in the video state menu
    //  * @param {string} value - the serializable value stored in the block
    //  */
    get POSE_ID_INFO () {
        return [
            {
                name: '1',
                value: poseID.a
            },
            {
                name: '2',
                value: poseID.b
            }
        ];
    }

    get VIDEO_STATE_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.off',
                    default: 'off',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.OFF
            },
            
            {
                name: formatMessage({
                    id: 'videoSensing.on',
                    default: 'on',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.ON
            },
            {
                name: formatMessage({
                    id: 'videoSensing.onFlipped',
                    default: 'on flipped',
                    description: 'Option for the "turn video [STATE]" block that causes the video to be flipped' +
                        ' horizontally (reversed as in a mirror)'
                }),
                value: VideoState.ON_FLIPPED
            }
        ];
    }


    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'posenet',
            name: 'PoseNet',
            blocks: [
                {
                    opcode: 'videoToggle',
                    text: formatMessage({
                        id: 'videoSensing.videoToggle',
                        default: 'turn video [VIDEO_STATE]',
                        description: 'Controls display of the video preview layer'
                    }),
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'VIDEO_STATE',
                            defaultValue: VideoState.ON
                        }
                    }
                },
                {
                    opcode: 'isloaded',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'posenet.isloaded',
                        default: 'is loaded',
                        description: 'knn is loaded'
                    })
                },
                {
                    opcode: 'poseConfidence',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'posenet.poseConfidence',
                        default: 'pose [POSE_ID] confidence',
                        description: 'samples'
                    }),
                    arguments: {
                        POSE_ID: {
                            type: ArgumentType.NUMBER,
                            menu: 'POSE_ID',
                            defaultValue: poseID[1]
                        }
                    }
                },
                {
                    opcode: 'posePartPosition',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'posenet.posePartPosition',
                        default: 'pose [POSE_ID] part [PART] position [POS]',
                        description: 'samples'
                    }),
                    arguments: {
                        POSE_ID: {
                            type: ArgumentType.NUMBER,
                            menu: 'POSE_ID',
                            defaultValue: poseID[1]
                        },
                        PART:{
                            type: ArgumentType.NUMBER,
                            menu: 'PART',
                            // defaultValue: poseID[1]
                        },
                        POS:{
                            type: ArgumentType.NUMBER,
                            menu: 'POS',
                            // defaultValue: poseID[1]
                        }
                    }
                },
                {
                    opcode: 'posePartConfidence',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'posenet.posePartConfidence',
                        default: 'pose [POSE_ID] part [PART] confidence',
                        description: 'samples'
                    }),
                    arguments: {
                        POSE_ID: {
                            type: ArgumentType.NUMBER,
                            menu: 'POSE_ID',
                            defaultValue: poseID[1]
                        },
                        PART:{
                            type: ArgumentType.NUMBER,
                            menu: 'PART',
                            // defaultValue: poseID[1]
                        }
                    }
                },
                {
                    opcode: 'setVideoTransparency',
                    text: formatMessage({
                        id: 'videoSensing.setVideoTransparency',
                        default: 'set video transparency to [TRANSPARENCY]',
                        description: 'Controls transparency of the video preview layer'
                    }),
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                }
                
            ],
            menus: {
                ATTRIBUTE: {
                    acceptReporters: true,
                    items: this._buildMenu(this.ATTRIBUTE_INFO)
                },
                SUBJECT: {
                    acceptReporters: true,
                    items: this._buildMenu(this.SUBJECT_INFO)
                },
                VIDEO_STATE: {
                    acceptReporters: true,
                    items:this._buildMenu(this.VIDEO_STATE_INFO),
                },
                typemenu: {
                    acceptReporters: true,
                    items: '_typeArr'
                },
                POSE_ID:{
                    acceptReporters: true,
                    items:'_test'
                },
                PART:{
                    acceptReporters: true,
                    items:'_part'
                },
                POS:{
                    acceptReporters: true,
                    items:'_pos'
                }
            }
        };
    }

    _typeArr () {
        return typeArr.slice(3).map(item => item.toString())
    }
    _test(){
        return test.map(item => item.toString())
    }
    _part(){
        return parts.map(item => item.toString())
    }
    _pos(){
        return pos.map(item => item.toString())
    }
    /**
     * A scratch command block handle that configures the video state from
     * passed arguments.
     * @param {object} args - the block arguments
     * @param {VideoState} args.VIDEO_STATE - the video state to set the device to
     */
    videoToggle(args) {
        const state = args.VIDEO_STATE;
        this.globalVideoState = state;
        if (state === VideoState.OFF) {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            // this.runtime.ioDevices.video.enableVideo();
            this.runtime.ioDevices.video.enableVideo().then(() => {
                this.video = this.runtime.ioDevices.video.provider.video
                console.log('this.video got')
            });
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    /**
     * A scratch command block handle that configures the video preview's
     * transparency from passed arguments.
     * @param {object} args - the block arguments
     * @param {number} args.TRANSPARENCY - the transparency to set the video
     *   preview to
     */
    setVideoTransparency(args) {
        const transparency = Cast.toNumber(args.TRANSPARENCY);
        this.globalVideoTransparency = transparency;
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
    }

    // clearClass(classIndex) {
    //     this.classifier.clearClass(classIndex);
    // }

    // updateExampleCounts(args, util) {
    //     let counts = this.classifier.getClassExampleCount();
    //     this.runtime.emit('SAY', util.target, 'say', this.trainTypes.map((item, index) => {
    //         return item + '样本数：' + (counts[index] || 0) + '\n'
    //     }).join('\n'));
    // }

    isloaded() {
        return guiState.loaded
    }
    poseConfidence(args){
        console.log(args)
        if(this.pose){
            return this.pose[parseInt(args.POSE_ID)-1].score
        }
    }
    posePartConfidence(args){
        console.log(args)
        if(this.pose){
            let part = this.getPosePart(this.pose[parseInt(args.POSE_ID)-1],args.PART)
            return part.score
        }
    }
    posePartPosition(args){
        console.log(args)
        if(this.pose){
            let part = this.getPosePart(this.pose[parseInt(args.POSE_ID)-1],args.PART)
            return this.positionTransfer(args.POS,part.position[args.POS],part.score)
        }
    }

    getPosePart(pose,p){
        if(this.pose){
            let part = pose.keypoints.find(e => e.part === p)
            return part
        }
    }

    positionTransfer(pos,position,confidence){
        const originCanvas = this.runtime.renderer._gl.canvas
        console.log("originCanvas",originCanvas)
        console.log("pos",pos)
        let width =  parseFloat(480/2);
        let height =  parseFloat(360/2);
        console.log('originCanvas.width',originCanvas.width)
        if(pos ==='y'){
            console.log(parseFloat(height-position))
            return parseFloat(height-position*confidence)
        }
        else if(pos==='x'){
            return parseFloat(position*confidence-width)
        }
    }
    
    poseDetection(){
        
        return new Promise((resolve, reject) => {

            const originCanvas = this.runtime.renderer._gl.canvas  // 右上侧canvas

            // 循环检测并绘制检测结果
            this.timer = setInterval(async () => {
                // this.video.width = 480
                // this.video.height = 360
                console.log("originCanvas",originCanvas)
                
                const net = await posenet.load();
                const results = await net.estimateMultiplePoses(originCanvas, {
                    flipHorizontal: false,
                    maxDetections: 2,
                    scoreThreshold: 0.6,
                    nmsRadius: 20
                  });
                
                // 确认仅得到数据后进行绘制
                if(results){
                    this.pose = results
                    guiState.loaded = true
                    console.log("this.pose",this.pose)
                }
               
                resolve('success')
            }, 50);
        })
        
            
    }
    
    async knnInit () {
        // const imageElement = document.getElementById('cat');
        this.poseDetection();
      
        // this.classifier = knnClassifier.create();
        // this.mobilenet = await mobilenetModule.load();
    }
}

module.exports = Scratch3posenet;