const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const MathUtil = require('../../util/math-util');
const formatMessage = require('format-message');
const { image } = require('@tensorflow/tfjs-core');
const axios = require('axios')


const Message = {
    auth:{
        'zh-cn': "授权",
        en: "auth",
    },
    enterToken:{
        'zh-cn':"请输入[TOKEN]",
        en: "Please enter [TOKEN]",

    },
    run:{
        'zh-cn':"运行[scene]",
        en: "Run[scene]",
    },
    scene:{
        'zh-cn':"场景:[sceneId]",
        en: "Scene[sceneId]",
    },
    action:{
        'zh-cn':"活动",
        en: "action",
    }
}

// const AvailableLocales = ['en', 'ja', 'ja-Hira', 'zh-cn'];

class Scratch3AqaraBlocks {

    constructor (runtime) {

        this.TOKEN = ''
        this.currentScene = ''
        this.list=null
        this.sceneList = [{
            text: "menu",
            value: "menu",
        }]
        // this.sceneList
    }
    get SCENEOPTION() {
        // return this.sceneList
        
       return this.sceneList
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
            id: 'aqara',
            name: 'Aqara',
            blocks: [{
                opcode: 'auth',
                blockType: BlockType.COMMAND,
                text: Message.auth[this._locale]
            },
            {
                opcode: 'enterToken',
                text: Message.enterToken[this._locale],
                // formatMessage({
                //     id: 'text2speech.speakAndWaitBlock',
                //     default: 'set voice to [VOICE] and speak [WORDS]',
                //     description: 'Speak some words.'
                // }),
                blockType: BlockType.COMMAND,
                arguments: {
                    TOKEN: {
                        type: ArgumentType.STRING,
                        defaultValue: "Token"
                    }
                }
            },
            {
                opcode: 'run',
                text: Message.run[this._locale],
                // formatMessage({
                //     id: 'text2speech.speakAndWaitBlock',
                //     default: 'set voice to [VOICE] and speak [WORDS]',
                //     description: 'Speak some words.'
                // }),
                blockType: BlockType.COMMAND,
                arguments: {
                    scene: {
                        type: ArgumentType.STRING,
                        defaultValue: Message.action[this._locale]
                    }
                }
            },
            {
                opcode: 'onGetScene',
                text: Message.scene[this._locale],
                // formatMessage({
                //     id: 'text2speech.speakAndWaitBlock',
                //     default: 'set voice to [VOICE] and speak [WORDS]',
                //     description: 'Speak some words.'
                // }),
                blockType: BlockType.REPORTER,
                arguments: {
                    sceneId: {
                        type: ArgumentType.STRING,
                        menu: 'SCENE',
                        defaultValue: "menu"
                    }
                }
            },
        ],
        menus:{
            SCENE:'_getSCENE'
            // {
            //     acceptReporters: true,
            //     items: this.SCENEOPTION
            // }
            
        }
        
        }
    }
    _getSCENE(){
        return this.sceneList
    }

    auth(){
        window.open('https://aiot-oauth2.aqara.cn/authorize?client_id=367342150640945c01115150&response_type=code&redirect_uri=http://aqara-gate.codejoyai.com:8080/&theme=1','_blank')
    }
    enterToken(data){
        // console.log('token',data)
        var _this = this
        var tempList = []
        this.TOKEN = data.TOKEN
        this.sceneList = [{
            text: "menu",
            value: "menu",
        }]
        axios({
            method: 'get',
            url: `http://aqara-gate.codejoyai.com:8080/listScene/${data.TOKEN}`,
            // withCredentials: true
          })
            .then(function (response) {
                // console.log("resp",response)
                let rust = response.data.result.data
                rust.forEach(element => {
                    tempList.push({text:element.name,value:element.sceneId})
                });
                if(_this.sceneList.length===1){
                _this.sceneList = _this.sceneList.concat(tempList)}
                // console.log("_this.list",_this.list)
            });
    }
    run(data){
        console.log('run',data)
        this.currentScene = data.scene
        axios({
            method:"get",
            url:`http://aqara-gate.codejoyai.com:8080/runScene/${this.TOKEN}/${this.currentScene}`
        }).then(function (response) {
            console.log('run',response)
        })
    }
    onGetScene(data){
        console.log('onGetScene',data)
        return data.sceneId
    }
}

module.exports = Scratch3AqaraBlocks