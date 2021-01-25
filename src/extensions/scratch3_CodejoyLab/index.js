const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
// const RateLimiter = require("../../util/rateLimiter.js");
const formatMessage = require("format-message");
const Cast = require('../../util/cast');
const Video = require('../../io/video');
// const io = require("socket.io-client"); // yarn add socket.io-client socket.io-client@2.2.0
// const AdapterBaseClient = require("./codelab_adapter_base.js.js");
const axios = require('axios');
const { extensionURL } = require("../scratch3_microbitmore");
const Runtime = require('../../engine/runtime');
const maybeFormatMessage = require("../../util/maybe-format-message");

const Message = {
    get:{
        "en":"Get [URL]",
        "zh-cn":"发送GET请求到[URL]"
    },
    getImgData:{
        "en":"Video data",
        "zh-cn":"视频数据"
    }
}
const VideoState = {
    /** Video turned off. */
    OFF: 'off',

    /** Video turned on with default y axis mirroring. */
    ON: 'on',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: 'on-flipped'
};

class CodejoyLabBlocks{
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // axios.defaults.withCredentials = true;
        if (this.runtime.ioDevices) {
            // Clear target motion state values when the project starts.
            // this.runtime.on(Runtime.PROJECT_RUN_START, this.reset.bind(this));

            // Kick off looping the analysis logic.
            // this._loop();

            // Configure the video device with values from a globally stored
            // location.
            this.setVideoTransparency({
                TRANSPARENCY: this.globalVideoTransparency
            });
            this.videoToggle({
                VIDEO_STATE: this.globalVideoState
            });
        }
    }
    get globalVideoTransparency() {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoTransparency;
        }
        return 50;
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
    // reset() {
    //     const targets = this.runtime.targets;
    //     for (let i = 0; i < targets.length; i++) {
    //         const state = targets[i].getCustomState(faceApi .STATE_KEY);
    //         if (state) {
    //             state.motionAmount = 0;
    //             state.motionDirection = 0;
    //         }
    //     }
    // }

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
     * An array of info on video state options for the "turn video [STATE]" block.
     * @type {object[]} an array of objects
     * @param {string} name - the translatable name to display in the video state menu
     * @param {string} value - the serializable value stored in the block
     */
    get VIDEO_STATE_INFO() {
        return [
            {
                name: 'off',
                value: VideoState.OFF
            },
            {
                name: 'on',
                value: VideoState.ON
            },
            {
                name: 'on flipped',
                value: VideoState.ON_FLIPPED
            }
        ];
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
    getInfo() {
        this._locale = this.setLocale()
        return {
            id: 'codejoyLab',
            name: 'Codejoy Lab',
            blocks:[
                {
                    opcode: 'sendGetRequest',
                    blockType: BlockType.COMMAND,
                    text: Message.get[this._locale],
                    arguments:{
                        URL:{
                            type:ArgumentType.STRING,
                            defaultValue: "URL"
                        }
                    }
                },
                {
                    opcode: 'videoToggle',
                    text: 'turn video [VIDEO_STATE]',
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'VIDEO_STATE',
                            defaultValue: VideoState.ON
                        }
                    }
                },
                {
                    opcode: 'setVideoTransparency',
                    text: 'set video transparency to [TRANSPARENCY]',
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'getImgBase64Data',
                    text: Message.getImgData[this._locale],
                    blockType: BlockType.REPORTER,
                    // arguments: {
                    //     TRANSPARENCY: {
                    //         type: ArgumentType.NUMBER,
                    //         defaultValue: 50
                    //     }
                    // }
                },
            ],
            menus: {
                VIDEO_STATE: this._buildMenu(this.VIDEO_STATE_INFO)
            }
        }
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
            this.runtime.ioDevices.video.enableVideo().then(() => {
                // 获得video数据
                this.video = this.runtime.ioDevices.video.provider.video
                console.log('this.video got')
                // this.originCanvas = this.runtime.renderer._gl.canvas  // 右上侧canvas
              
            });
;
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    setVideoTransparency(args) {
        const transparency = Cast.toNumber(args.TRANSPARENCY);
        this.globalVideoTransparency = transparency;
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
    }

    onSendGet(data){
        return this.sendGetRequest(data)
    }
    sendGetRequest(data){
        let url = data.URL
        if(url!="URL"){
            
            return new Promise(resolve => {
                axios.get(url,{withCredentials:false})
                    .then(function (response) {
                        // handle success
                        console.log("res",response)
                        // if(response.data.current_condition.length >0){
                        //     currentTem = response.data.current_condition[0].FeelsLikeC
                        //     console.log('currentTem',currentTem)
                        resolve(JSON.stringify(response))
                        // }
                    })
                    .catch(function (error) {
                        // handle error
                        resolve(error)
                        console.log(error);
                    })
                })
        }
    }
    getImgBase64Data(){
        if(this.video){
            // console.log('video',this.video)
            const canvas = document.createElement('canvas')
            const width = this.video.videoWidth // canvas的尺寸和图片一样
            const height = this.video.videoHeight
            canvas.width = width
            canvas.height = height
            canvas.getContext('2d').drawImage(this.video, 0, 0, width, height) // 绘制canvas
            let dataURL = canvas.toDataURL('image/jpeg') // 转换为base64
            // dataURL = dataURL.replace('data:image/jpeg;base64,', '')
            // dataURL就是base64格式的代码 需要后台解析
            // console.log(dataURL)
            return dataURL
        }
        
        
    }
}

module.exports = CodejoyLabBlocks