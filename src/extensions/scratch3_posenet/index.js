const ArgumentType = require("../../extension-support/argument-type")
const BlockType = require("../../extension-support/block-type")
const Cast = require("../../util/cast")
const ml5 = require("ml5")
const formatMessage = require("format-message")

const Message = {
	x: {
		ja: "のx座標",
		"ja-Hira": "のxざひょう",
		en: " x",
		'zh-cn':"x坐标"
	},
	y: {
		ja: "のy座標",
		"ja-Hira": "のyざひょう",
		en: " y",
		'zh-cn':"y坐标"
	},
	peopleCount: {
		ja: "人数",
		"ja-Hira": "にんずう",
		en: "people count",
		'zh-cn':"人数"
	},
	nose: {
		ja: "鼻",
		"ja-Hira": "はな",
		en: "nose",
		'zh-cn':"鼻子"
	},
	leftEye: {
		ja: "左目",
		"ja-Hira": "ひだりめ",
		en: "left eye",
		'zh-cn':"左眼"
	},
	rightEye: {
		ja: "右目",
		"ja-Hira": "みぎめ",
		en: "right eye",
		'zh-cn':"右眼"
	},
	leftEar: {
		ja: "左耳",
		"ja-Hira": "ひだりみみ",
		en: "left ear",
		'zh-cn':"左耳"
	},
	rightEar: {
		ja: "右耳",
		"ja-Hira": "みぎみみ",
		en: "right ear",
		'zh-cn':"右耳"
	},
	leftShoulder: {
		ja: "左肩",
		"ja-Hira": "ひだりかた",
		en: "left shoulder",
		'zh-cn':"左肩"
	},
	rightShoulder: {
		ja: "右肩",
		"ja-Hira": "みぎかた",
		en: "right shoulder",
		'zh-cn':"右肩"
	},
	leftElbow: {
		ja: "左ひじ",
		"ja-Hira": "ひだりひじ",
		en: "left elbow",
		'zh-cn':"左手肘"
	},
	rightElbow: {
		ja: "右ひじ",
		"ja-Hira": "みぎひじ",
		en: "right elbow",
		'zh-cn':"右手肘"
	},
	leftWrist: {
		ja: "左手首",
		"ja-Hira": "ひだりてくび",
		en: "left wrist",
		'zh-cn':"左手腕"
	},
	rightWrist: {
		ja: "右手首",
		"ja-Hira": "みぎてくび",
		en: "right wrist",
		'zh-cn':"右手腕"
	},
	leftHip: {
		ja: "左腰",
		"ja-Hira": "ひだりこし",
		en: "left hip",
		'zh-cn':"左腰"
	},
	rightHip: {
		ja: "右腰",
		"ja-Hira": "みぎこし",
		en: "right hip",
		'zh-cn':"右腰"
	},
	leftKnee: {
		ja: "左ひざ",
		"ja-Hira": "ひだりひざ",
		en: "left knee",
		'zh-cn':"左膝盖"
	},
	rightKnee: {
		ja: "右ひざ",
		"ja-Hira": "みぎひざ",
		en: "right knee",
		'zh-cn':"右膝盖"
	},
	leftAnkle: {
		ja: "左足首",
		"ja-Hira": "ひだりあしくび",
		en: "left ankle",
		'zh-cn':"左脚踝"
	},
	rightAnkle: {
		ja: "右足首",
		"ja-Hira": "みぎあしくび",
		en: "right ankle",
		'zh-cn':"右脚踝"
	},
	getX: {
		ja: "[PERSON_NUMBER] 人目の [PART] のx座標",
		"ja-Hira": "[PERSON_NUMBER] にんめの [PART] のxざひょう",
		en: "[PART] x of person no. [PERSON_NUMBER]",
		'zh-cn':"第[PERSON_NUMBER]个人的[PART]部位的坐标x的位置"
	},
	getY: {
		ja: "[PERSON_NUMBER] 人目の [PART] のy座標",
		"ja-Hira": "[PERSON_NUMBER] にんめの [PART] のyざひょう",
		en: "[PART] y of person no. [PERSON_NUMBER]",
		'zh-cn':"第[PERSON_NUMBER]个人的[PART]部位的坐标y的位置"
	},
	videoToggle: {
		ja: "ビデオを[VIDEO_STATE]にする",
		"ja-Hira": "ビデオを[VIDEO_STATE]にする",
		en: "turn video [VIDEO_STATE]",
		'zh-cn':"改变视频状态为[VIDEO_STATE]"
	},
	on: {
		ja: "入",
		"ja-Hira": "いり",
		en: "on",
		'zh-cn':"打开"
	},
	off: {
		ja: "切",
		"ja-Hira": "きり",
		en: "off",
		'zh-cn':"关闭"
	},
	video_on_flipped: {
		ja: "左右反転",
		"ja-Hira": "さゆうはんてん",
		en: "on flipped",
		'zh-cn':"反转摄像头"
	},
}
const AvailableLocales = ["en", "ja", "ja-Hira",'zh-cn']

class Scratch3Posenet2ScratchBlocks {
	get PERSON_NUMBERS_MENU() {
		return [
			{
				text: "1",
				value: "1",
			},
			{
				text: "2",
				value: "2",
			},
			{
				text: "3",
				value: "3",
			},
			{
				text: "4",
				value: "4",
			},
			{
				text: "5",
				value: "5",
			},
			{
				text: "6",
				value: "6",
			},
			{
				text: "7",
				value: "7",
			},
			{
				text: "8",
				value: "8",
			},
			{
				text: "9",
				value: "9",
			},
			{
				text: "10",
				value: "10",
			},
		]
	}

	get PARTS_MENU() {
		return [
			{
				text: Message.nose[this._locale],
				value: "0",
			},
			{
				text: Message.leftEye[this._locale],
				value: "1",
			},
			{
				text: Message.rightEye[this._locale],
				value: "2",
			},
			{
				text: Message.leftEar[this._locale],
				value: "3",
			},
			{
				text: Message.rightEar[this._locale],
				value: "4",
			},
			{
				text: Message.leftShoulder[this._locale],
				value: "5",
			},
			{
				text: Message.rightShoulder[this._locale],
				value: "6",
			},
			{
				text: Message.leftElbow[this._locale],
				value: "7",
			},
			{
				text: Message.rightElbow[this._locale],
				value: "8",
			},
			{
				text: Message.leftWrist[this._locale],
				value: "9",
			},
			{
				text: Message.rightWrist[this._locale],
				value: "10",
			},
			{
				text: Message.leftHip[this._locale],
				value: "11",
			},
			{
				text: Message.rightHip[this._locale],
				value: "12",
			},
			{
				text: Message.leftKnee[this._locale],
				value: "13",
			},
			{
				text: Message.rightKnee[this._locale],
				value: "14",
			},
			{
				text: Message.leftAnkle[this._locale],
				value: "15",
			},
			{
				text: Message.rightAnkle[this._locale],
				value: "16",
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

		this.poses = []
		this.keypoints = []

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

		let poseNet = ml5.poseNet(video, () => {
			console.log("Model Loaded!")
		})

		poseNet.on("pose", (poses) => {
			if (poses.length > 0) {
				this.poses = poses
				this.keypoints = poses[0].pose.keypoints
			} else {
				this.poses = []
				this.keypoints = []
			}
		})

		this.runtime.ioDevices.video.enableVideo()
	}

	getInfo() {
		this._locale = this.setLocale()
		return {
			id: "posenet",
			name: "Human Pose",
			// blockIconURI: blockIconURI,
			blocks: [
				{
					opcode: "getX",
					blockType: BlockType.REPORTER,
					text: Message.getX[this._locale],
					arguments: {
						PERSON_NUMBER: {
							type: ArgumentType.STRING,
							menu: "personNumbers",
							defaultValue: "1",
						},
						PART: {
							type: ArgumentType.STRING,
							menu: "parts",
							defaultValue: "0",
						},
					},
				},
				{
					opcode: "getY",
					blockType: BlockType.REPORTER,
					text: Message.getY[this._locale],
					arguments: {
						PERSON_NUMBER: {
							type: ArgumentType.STRING,
							menu: "personNumbers",
							defaultValue: "1",
						},
						PART: {
							type: ArgumentType.STRING,
							menu: "parts",
							defaultValue: "0",
						},
					},
				},
				{
					opcode: "getPeopleCount",
					blockType: BlockType.REPORTER,
					text: Message.peopleCount[this._locale],
				},
				{
					opcode: "getNoseX",
					blockType: BlockType.REPORTER,
					text: Message.nose[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getNoseY",
					blockType: BlockType.REPORTER,
					text: Message.nose[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftEyeX",
					blockType: BlockType.REPORTER,
					text: Message.leftEye[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftEyeY",
					blockType: BlockType.REPORTER,
					text: Message.leftEye[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightEyeX",
					blockType: BlockType.REPORTER,
					text: Message.rightEye[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightEyeY",
					blockType: BlockType.REPORTER,
					text: Message.rightEye[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftEarX",
					blockType: BlockType.REPORTER,
					text: Message.leftEar[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftEarY",
					blockType: BlockType.REPORTER,
					text: Message.leftEar[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightEarX",
					blockType: BlockType.REPORTER,
					text: Message.rightEar[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightEarY",
					blockType: BlockType.REPORTER,
					text: Message.rightEar[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftShoulderX",
					blockType: BlockType.REPORTER,
					text: Message.leftShoulder[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftShoulderY",
					blockType: BlockType.REPORTER,
					text: Message.leftShoulder[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightShoulderX",
					blockType: BlockType.REPORTER,
					text: Message.rightShoulder[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightShoulderY",
					blockType: BlockType.REPORTER,
					text: Message.rightShoulder[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftElbowX",
					blockType: BlockType.REPORTER,
					text: Message.leftElbow[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftElbowY",
					blockType: BlockType.REPORTER,
					text: Message.leftElbow[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightElbowX",
					blockType: BlockType.REPORTER,
					text: Message.rightElbow[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightElbowY",
					blockType: BlockType.REPORTER,
					text: Message.rightElbow[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftWristX",
					blockType: BlockType.REPORTER,
					text: Message.leftWrist[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftWristY",
					blockType: BlockType.REPORTER,
					text: Message.leftWrist[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightWristX",
					blockType: BlockType.REPORTER,
					text: Message.rightWrist[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightWristY",
					blockType: BlockType.REPORTER,
					text: Message.rightWrist[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftHipX",
					blockType: BlockType.REPORTER,
					text: Message.leftHip[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftHipY",
					blockType: BlockType.REPORTER,
					text: Message.leftHip[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightHipX",
					blockType: BlockType.REPORTER,
					text: Message.rightHip[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightHipY",
					blockType: BlockType.REPORTER,
					text: Message.rightHip[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftKneeX",
					blockType: BlockType.REPORTER,
					text: Message.leftKnee[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftKneeY",
					blockType: BlockType.REPORTER,
					text: Message.leftKnee[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightKneeX",
					blockType: BlockType.REPORTER,
					text: Message.rightKnee[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightKneeY",
					blockType: BlockType.REPORTER,
					text: Message.rightKnee[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getLeftAnkleX",
					blockType: BlockType.REPORTER,
					text: Message.leftAnkle[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getLeftAnkleY",
					blockType: BlockType.REPORTER,
					text: Message.leftAnkle[this._locale] + Message.y[this._locale],
				},
				{
					opcode: "getRightAnkleX",
					blockType: BlockType.REPORTER,
					text: Message.rightAnkle[this._locale] + Message.x[this._locale],
				},
				{
					opcode: "getRightAnkleY",
					blockType: BlockType.REPORTER,
					text: Message.rightAnkle[this._locale] + Message.y[this._locale],
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
			],
			menus: {
				personNumbers: {
					acceptReporters: true,
					items: this.PERSON_NUMBERS_MENU,
				},
				parts: {
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

	getX(args) {
		if (
			this.poses[parseInt(args.PERSON_NUMBER, 10) - 1] &&
			this.poses[parseInt(args.PERSON_NUMBER, 10) - 1].pose.keypoints[
				parseInt(args.PART, 10)
			]
		) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return (
					-1 *
					(240 -
						this.poses[parseInt(args.PERSON_NUMBER, 10) - 1].pose.keypoints[
							parseInt(args.PART, 10)
						].position.x)
				)
			} else {
				return (
					240 -
					this.poses[parseInt(args.PERSON_NUMBER, 10) - 1].pose.keypoints[
						parseInt(args.PART, 10)
					].position.x
				)
			}
		} else {
			return ""
		}
	}

	getY(args) {
		if (
			this.poses[parseInt(args.PERSON_NUMBER, 10) - 1] &&
			this.poses[parseInt(args.PERSON_NUMBER, 10) - 1].pose.keypoints[
				parseInt(args.PART, 10)
			]
		) {
			return (
				180 -
				this.poses[parseInt(args.PERSON_NUMBER, 10) - 1].pose.keypoints[
					parseInt(args.PART, 10)
				].position.y
			)
		} else {
			return ""
		}
	}

	getPeopleCount() {
		return this.poses.length
	}

	getNoseX() {
		if (this.keypoints[0]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[0].position.x)
			} else {
				return 240 - this.keypoints[0].position.x
			}
		} else {
			return ""
		}
	}

	getNoseY() {
		if (this.keypoints[0]) {
			return 180 - this.keypoints[0].position.y
		} else {
			return ""
		}
	}

	getLeftEyeX() {
		if (this.keypoints[1]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[1].position.x)
			} else {
				return 240 - this.keypoints[1].position.x
			}
		} else {
			return ""
		}
	}

	getLeftEyeY() {
		if (this.keypoints[1]) {
			return 180 - this.keypoints[1].position.y
		} else {
			return ""
		}
	}

	getRightEyeX() {
		if (this.keypoints[2]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[2].position.x)
			} else {
				return 240 - this.keypoints[2].position.x
			}
		} else {
			return ""
		}
	}

	getRightEyeY() {
		if (this.keypoints[2]) {
			return 180 - this.keypoints[2].position.y
		} else {
			return ""
		}
	}

	getLeftEarX() {
		if (this.keypoints[3]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[3].position.x)
			} else {
				return 240 - this.keypoints[3].position.x
			}
		} else {
			return ""
		}
	}

	getLeftEarY() {
		if (this.keypoints[3]) {
			return 180 - this.keypoints[3].position.y
		} else {
			return ""
		}
	}

	getRightEarX() {
		if (this.keypoints[4]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[4].position.x)
			} else {
				return 240 - this.keypoints[4].position.x
			}
		} else {
			return ""
		}
	}

	getRightEarY() {
		if (this.keypoints[4]) {
			return 180 - this.keypoints[4].position.y
		} else {
			return ""
		}
	}

	getLeftShoulderX() {
		if (this.keypoints[5]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[5].position.x)
			} else {
				return 240 - this.keypoints[5].position.x
			}
		} else {
			return ""
		}
	}

	getLeftShoulderY() {
		if (this.keypoints[5]) {
			return 180 - this.keypoints[5].position.y
		} else {
			return ""
		}
	}

	getRightShoulderX() {
		if (this.keypoints[6]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[6].position.x)
			} else {
				return 240 - this.keypoints[6].position.x
			}
		} else {
			return ""
		}
	}

	getRightShoulderY() {
		if (this.keypoints[6]) {
			return 180 - this.keypoints[6].position.y
		} else {
			return ""
		}
	}

	getLeftElbowX() {
		if (this.keypoints[7]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[7].position.x)
			} else {
				return 240 - this.keypoints[7].position.x
			}
		} else {
			return ""
		}
	}

	getLeftElbowY() {
		if (this.keypoints[7]) {
			return 180 - this.keypoints[7].position.y
		} else {
			return ""
		}
	}

	getRightElbowX() {
		if (this.keypoints[8]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[8].position.x)
			} else {
				return 240 - this.keypoints[8].position.x
			}
		} else {
			return ""
		}
	}

	getRightElbowY() {
		if (this.keypoints[8]) {
			return 180 - this.keypoints[8].position.y
		} else {
			return ""
		}
	}

	getLeftWristX() {
		if (this.keypoints[9]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[9].position.x)
			} else {
				return 240 - this.keypoints[9].position.x
			}
		} else {
			return ""
		}
	}

	getLeftWristY() {
		if (this.keypoints[9]) {
			return 180 - this.keypoints[9].position.y
		} else {
			return ""
		}
	}

	getRightWristX() {
		if (this.keypoints[10]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[10].position.x)
			} else {
				return 240 - this.keypoints[10].position.x
			}
		} else {
			return ""
		}
	}

	getRightWristY() {
		if (this.keypoints[10]) {
			return 180 - this.keypoints[10].position.y
		} else {
			return ""
		}
	}

	getLeftHipX() {
		if (this.keypoints[11]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[11].position.x)
			} else {
				return 240 - this.keypoints[11].position.x
			}
		} else {
			return ""
		}
	}

	getLeftHipY() {
		if (this.keypoints[11]) {
			return 180 - this.keypoints[11].position.y
		} else {
			return ""
		}
	}

	getRightHipX() {
		if (this.keypoints[12]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[12].position.x)
			} else {
				return 240 - this.keypoints[12].position.x
			}
		} else {
			return ""
		}
	}

	getRightHipY() {
		if (this.keypoints[12]) {
			return 180 - this.keypoints[12].position.y
		} else {
			return ""
		}
	}

	getLeftKneeX() {
		if (this.keypoints[13]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[13].position.x)
			} else {
				return 240 - this.keypoints[13].position.x
			}
		} else {
			return ""
		}
	}

	getLeftKneeY() {
		if (this.keypoints[13]) {
			return 180 - this.keypoints[13].position.y
		} else {
			return ""
		}
	}

	getRightKneeX() {
		if (this.keypoints[14]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[14].position.x)
			} else {
				return 240 - this.keypoints[14].position.x
			}
		} else {
			return ""
		}
	}

	getRightKneeY() {
		if (this.keypoints[14]) {
			return 180 - this.keypoints[14].position.y
		} else {
			return ""
		}
	}

	getLeftAnkleX() {
		if (this.keypoints[15]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[15].position.x)
			} else {
				return 240 - this.keypoints[15].position.x
			}
		} else {
			return ""
		}
	}

	getLeftAnkleY() {
		if (this.keypoints[15]) {
			return 180 - this.keypoints[15].position.y
		} else {
			return ""
		}
	}

	getRightAnkleX() {
		if (this.keypoints[16]) {
			if (this.runtime.ioDevices.video.mirror === false) {
				return -1 * (240 - this.keypoints[16].position.x)
			} else {
				return 240 - this.keypoints[16].position.x
			}
		} else {
			return ""
		}
	}

	getRightAnkleY() {
		if (this.keypoints[16]) {
			return 180 - this.keypoints[16].position.y
		} else {
			return ""
		}
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

	setLocale() {
		let locale = formatMessage.setup().locale
		if (AvailableLocales.includes(locale)) {
			return locale
		} else {
			return "en"
		}
	}
}

module.exports = Scratch3Posenet2ScratchBlocks
