const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
const axios = require('axios');
// 翻译


const Form_control_extension = {
    "en": "[turn] temperature",
    "zh-cn": "[turn] 气温",
}


/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
// import blockIconURI from './icon_logo.png';
const blockIconURI = require('../scratch3_python_kernel/icon_logo.svg');
const menuIconURI = blockIconURI;

const API_URL =
    "https://wttr.in/";//http://wttr.in/Beijing?format=j1


// EIM: Everything Is Message
class weatherReport {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        // this.adapter_client = new AdapterClient(NODE_ID, HELP_URL);
    }

    /**
     * The key to load & store a target's test-related state.
     * @type {string}
     */
    

    _setLocale() {
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
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        let the_locale = this._setLocale();
        return {
            id: "weatherReport",
            name: "Weather Report",
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                
                {
                    opcode: "control_extension",
                    blockType: BlockType.REPORTER,
                    text: Form_control_extension[the_locale],
                    arguments: {
                        turn: {
                            type: ArgumentType.STRING,
                            defaultValue: "Beijing",
                            menu: "turn",
                        }
                    },
                }
            ],
            menus: {
             
                turn: {
                    acceptReporters: true,
                    items: ["Beijing", "Shanghai","Melbourne"],
                },
            },
        };
    }

    control_extension(args) {
        const content = args.turn;
        let URL = API_URL+content+"?format=j1"
        
        
        return new Promise(resolve => {
            var currentTem=null
            axios.get(URL)
                .then(function (response) {
                    // handle success
                    if(response.data.current_condition.length >0){
                        currentTem = response.data.current_condition[0].FeelsLikeC
                        console.log('currentTem',currentTem)
                        resolve(currentTem)
                    }
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                })
            })
       
    }

}

/*
注意安全问题: 赋予用户强大的能力，但提醒他们担心锤子砸伤脚
*/

module.exports = weatherReport;