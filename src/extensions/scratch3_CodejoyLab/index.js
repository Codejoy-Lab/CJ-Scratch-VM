const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const RateLimiter = require("../../util/rateLimiter.js");
const formatMessage = require("format-message");
// const io = require("socket.io-client"); // yarn add socket.io-client socket.io-client@2.2.0
// const AdapterBaseClient = require("./codelab_adapter_base.js.js");
const axios = require('axios');
const { extensionURL } = require("../scratch3_microbitmore");

const Message = {
    get:{
        "en":"Get [URL]",
        "zh-cn":"发送GET请求到[URL]"
    }
}

class CodejoyLabBlocks{
    constructor (runtime) {
        // axios.defaults.withCredentials = true;
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
                }
            ]
        }
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
}

module.exports = CodejoyLabBlocks