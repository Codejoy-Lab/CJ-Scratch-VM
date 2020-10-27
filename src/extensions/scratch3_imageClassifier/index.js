const ArgumentType = require("../../extension-support/argument-type")
const BlockType = require("../../extension-support/block-type")
const Cast = require("../../util/cast")
const ml5 = require("ml5")
const formatMessage = require("format-message")

const Message = {
    startLoadModel:{
        'zh-cn': "加载[MODEL]模型进行分类",
        en: "Load model [MODEL] to classify",
    },
    startClassify:{
        'zh-cn': "图像中的物体",
        en: "What in the Video",
    }
}

let classifier

class ImageclassifierBlock {

    get MODEL_MENU() {
		return [
			{
				text: "Mobilenet",
				value: "mobilenet",
			},
			{
				text: 'Darknet',
				value: "Darknet",
			},
			{
				text: 'DoodleNet',
				value: "DoodleNet",
			},
        ]
    }

    constructor(runtime){
        this.runtime = runtime

        let video = document.createElement("video")
		video.width = 480
		video.height = 360
		video.autoplay = true
        video.style.display = "none"

		let media = navigator.mediaDevices.getUserMedia({
			video: true,
			audio: false,
		})

		media.then((stream) => {
			video.srcObject = stream
        })

        // const classifier = ml5.imageClassifier('MobileNet', modelLoaded);
        this.video = video
        this.result = ""
        this.runtime.ioDevices.video.enableVideo()
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

    getInfo(){
        this._locale = this.setLocale()
		return {
			id: "imageClassifier",
			name: "ImageClassifier",
			// blockIconURI: blockIconURI,
            blocks: [
                {
					opcode: "startLoadModel",
					blockType: BlockType.COMMAND,
					text: Message.startLoadModel[this._locale],
					arguments: {
						MODEL: {
							type: ArgumentType.STRING,
							menu: "modelList",
							defaultValue: "mobilenet",
						},
					},
                },
                {
					opcode: "startClassify",
					blockType: BlockType.REPORTER,
					text: Message.startClassify[this._locale],
				},
            ],
            menus: {
                modelList:{
                    acceptReporters: true,
					items: this.MODEL_MENU,
                }
            }
        }
    }

    startLoadModel(args){
        classifier = ml5.imageClassifier(args.MODEL, this.video,()=>{
            console.log("Model is ready!")
            // this.startClassify()
        });
    }

    startClassify(){
        classifier.classify((err,results) =>{
            console.log(results)
            this.result=""
            results.forEach((res,index)=>{
                if(index===results.length-1){
                    this.result+=res.label
                }else{this.result+=res.label+","}
                
            })
            
        })
        return this.result
    }
}

module.exports = ImageclassifierBlock