const ArgumentType = require("../../extension-support/argument-type")
const BlockType = require("../../extension-support/block-type")
const Cast = require("../../util/cast")
const ml5 = require("ml5")
const formatMessage = require("format-message")

const Message = {
    videoToggle: {
		'zh-cn': "摄像头[VIDEO_STATE]",
		"ja-Hira": "ビデオを[VIDEO_STATE]にする",
		en: "turn video [VIDEO_STATE]",
    },
    on: {
		'zh-cn': "打开",
		"ja-Hira": "いり",
		en: "on",
	},
	off: {
		'zh-cn': "关闭",
		"ja-Hira": "きり",
		en: "off",
	},
	video_on_flipped: {
		'zh-cn': "左右反转",
		"ja-Hira": "さゆうはんてん",
		en: "on flipped",
    },
    name:{
        'zh-cn': "名称",
        en: "name",
    },
    detect:{
        'zh-cn': "YOLO[ITEM]",
        en: "YOLO[ITEM]",
	},
	setVideoTransparency:{
		'zh-cn': "将视频透明度设为[TRANSPARENCY]",
        en: "set video transparency to [TRANSPARENCY]",
	}
}

var result = "Detecting..."

class YoloBlock {

    get PARTS_MENU() {
        return [
			{
				text: Message.name[this._locale],
				value: "name",
            },
        ]
    }
    get VIDEO_MENU() {
		return [
			{
				text: Message.off[this._locale],
				value: "off",
			},
			{
				text: Message.on[this._locale],
				value: "on",
			},
			{
				text: Message.video_on_flipped[this._locale],
				value: "on-flipped",
			},
		]
	}
    
    constructor(runtime) {
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
			// video.srcObject = stream
        })
        
        this.yolo = ml5.YOLO(video, () => {
            console.log("Model Loaded!")
            // this.detect()
        });
        
        this.yolo.detect(video, (err, results) => {
            // console.log(results);
        });
		// this.runtime.ioDevices.video.setPreviewGhost(5);
		this.setVideoTransparency({
			TRANSPARENCY: 50
		});
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

    getInfo() {
		this._locale = this.setLocale()
		return {
			id: "Yolo",
			name: "Yolo",
			// blockIconURI: blockIconURI,
            blocks: [
                {
					opcode: "detect",
					blockType: BlockType.REPORTER,
					text: Message.detect[this._locale],
					arguments: {
						ITEM: {
							type: ArgumentType.STRING,
							menu: "item",
							defaultValue: "name",
						}
					},
				},
                {
					opcode: "videoToggle",
					blockType: BlockType.COMMAND,
					text: Message.videoToggle[this._locale],
					arguments: {
						VIDEO_STATE: {
							type: ArgumentType.STRING,
							menu: "videoMenu",
							defaultValue: "off",
						},
					},
				},
				{
                    opcode: 'setVideoTransparency',
					text: Message.setVideoTransparency[this._locale], 
					// formatMessage({
                    //     id: 'videoSensing.setVideoTransparency',
                    //     default: 'set video transparency to [TRANSPARENCY]',
                    //     description: 'Controls transparency of the video preview layer'
                    // }),
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50'
                        }
                    }
                },
            ],
            menus: {
				item: {
					acceptReporters: true,
					items: this.PARTS_MENU,
				},
				videoMenu: {
					acceptReporters: true,
					items: this.VIDEO_MENU,
				},
			},
        }
	}
	
	setVideoTransparency(args) {
		console.log('args',args)
        const transparency = Cast.toNumber(args.TRANSPARENCY);
		this.globalVideoTransparency = transparency;
		console.log('this.runtime.ioDevices.video',this.runtime.ioDevices.video)
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
	}
	
    videoToggle(args) {
		let state = args.VIDEO_STATE
		if (state === "off") {
			this.runtime.ioDevices.video.disableVideo()
		} else {
			this.runtime.ioDevices.video.enableVideo()
			this.runtime.ioDevices.video.mirror = state === "on"
		}
	}
      start(){

      }

      detect() {
        let _this = this
        
        this.yolo.detect(function(err, results) {
          console.log(results)
          if(results){
            result = results[0].label
          }
        });
        return result
    }
}

module.exports = YoloBlock