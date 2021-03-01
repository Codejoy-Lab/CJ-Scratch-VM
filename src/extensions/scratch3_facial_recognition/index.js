const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const log = require("../../util/log");
const canvas = require("canvas");
const faceapi = require("face-api.js");

//const { tinyFaceDetector, resizeResults } = require("face-api.js");

//import "@tensorflow/tfjs-node";
//import * as canvas from "canvas";
//import * as faceapi from "face-api.js";

const { Canvas, Image, ImageData } = canvas;

class FacialRecognitionBlock {
  constructor(runtime) {
    this.runtime = runtime;

    this.canvas = document.querySelector("canvas");

    this.interval = 250;

    this.shouldClassify = false;
    this.drawLandmark = false;
    this.faceBox = false;
    this.drawExpression = false;
    this.drawAgeAndGender = false;

    faceapi.env.monkeyPatch({
      Canvas,
      Image,
      ImageData,
      createCanvasElement: () => document.createElement("canvas"),
    });
    //log.log(faceapi.nets);

    this.drawCanvas = null;
    this.displaySize = null;
    this.runtime.ioDevices.video.enableVideo().then(() => {
      this.video = this.runtime.ioDevices.video.provider.video;
      this.runtime.ioDevices.video.mirror = false;
    });

    // const MODEL_URL = "/static/models";
    // https://cdn.jsdelivr.net/gh/sgszha17/models/
    const MODEL_URL = "https://cdn.jsdelivr.net/gh/sgszha17/models/"
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      this.timer = setInterval(() => {
        this.classify();
      }, this.interval);
    });

    this.detections = null;
  }

  getInfo() {
    return {
      id: "facialRecognitionBlock",
      name: "Facial Recognition Block",
      blocks: [
        // Toggle classify
        {
          opcode: "toggleClassify",
          text: "Enable Classify [CLASSIFY_STATE]",
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFY_STATE: {
              type: ArgumentType.STRING,
              menu: "on_off_menu",
              defaultValue: "off",
            },
          },
        },
        // Toggle Landmark
        {
          opcode: "togglefaceBox",
          text: "Enable Face Detection Box [BOX_STATE]",
          blockType: BlockType.COMMAND,
          arguments: {
            BOX_STATE: {
              type: ArgumentType.STRING,
              menu: "on_off_box",
              defaultValue: "off",
            },
          },
        },
        // Toggle Landmark
        {
          opcode: "toggleLandmark",
          text: "Detect Landmark [CLASSIFY_STATE]",
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFY_STATE: {
              type: ArgumentType.STRING,
              menu: "on_off_menu",
              defaultValue: "off",
            },
          },
        },
        // Toggle Expression
        {
          opcode: "toggleExpression",
          text: "Detect Expression [CLASSIFY_STATE]",
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFY_STATE: {
              type: ArgumentType.STRING,
              menu: "on_off_menu",
              defaultValue: "off",
            },
          },
        },
        // Toggle Age and Gender
        {
          opcode: "toggleAgeAndGender",
          text: "Detect Age and Gender [CLASSIFY_STATE]",
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFY_STATE: {
              type: ArgumentType.STRING,
              menu: "on_off_menu",
              defaultValue: "off",
            },
          },
        },
        {
          opcode: "getAgeLabel",
          text: "Age",
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "getGenderLabel",
          text: "Gender",
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "getconfidenceLabel",
          text: "Confidence",
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "getExpressionLabel",
          text: "Expression",
          blockType: BlockType.REPORTER,
        },
        // Clear Canvas
        {
          opcode: "clearCanvas",
          text: "Clear Canvas",
          blockType: BlockType.COMMAND,
        },
      ],
      menus: {
        on_off_menu: [
          {
            text: "On",
            value: "on",
          },
          {
            text: "Off",
            value: "off",
          },
        ],
        on_off_box:[
          {
            text: "On",
            value: "on",
          },
          {
            text: "Off",
            value: "off",
          },
        ]
      },
    };
  }

  classify() {
    if (this.drawCanvas == null) {
      this.setCanvas();
    }

    if (this.shouldClassify) {
      //log.log("classifying ....");
      //this.video.mirror = false;
      faceapi
        .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .then((detections) => {
          this.detections = detections;
          //this.video.mirror = true;
          const resizedDetections = faceapi.resizeResults(
            detections,
            this.displaySize
          );
          console.log(' this.detections', this.detections)
          this.clearCanvas();
          // draw face dectection box
          if(this.faceBox){
            faceapi.draw.drawDetections(this.drawCanvas, resizedDetections);
          }
          
          // draw face landmarks
          if (this.drawLandmark) {
            faceapi.draw.drawFaceLandmarks(this.drawCanvas, resizedDetections);
          }

          // draw expression
          if (this.drawExpression) {
            faceapi.draw.drawFaceExpressions(
              this.drawCanvas,
              resizedDetections,
              0.5
            );
          }
          // draw Age and Gender
          if (this.drawAgeAndGender) {
            const ageAndGender = [
              `Age: ${Math.round(detections[0].age)}`,
              `Gender: ${detections[0].gender}`,
            ];
            const bottomLeft = detections[0].detection.box.bottomLeft;
            const anchor = { x: 0, y: 0 };
            log.log(anchor);
            const drawOptions = {
              anchorPosition: "TOP_LEFT",
            };
            const drawBox = new faceapi.draw.DrawTextField(
              ageAndGender,
              anchor,
              drawOptions
            );
            drawBox.draw(this.drawCanvas);
          }

          //log.log(detections);
        });
    }
  }

  getAgeLabel() {
    return this.detections && this.detections.length > 0
      ? Math.round(this.detections[0].age)
      : 0;
  }

  getGenderLabel() {
    return this.detections && this.detections.length > 0
      ? this.detections[0].gender
      : 0;
  }

  toggleClassify(input) {
    let state = input.CLASSIFY_STATE;
    this.shouldClassify = state === "on";
  }

  toggleLandmark(input) {
    let state = input.CLASSIFY_STATE;
    this.drawLandmark = state === "on";
  }

  toggleExpression(input) {
    let state = input.CLASSIFY_STATE;
    this.drawExpression = state === "on";
  }

  togglefaceBox(input){
    let state = input.BOX_STATE;
    this.faceBox = state === "on";
  }

  toggleAgeAndGender(input) {
    let state = input.CLASSIFY_STATE;
    this.drawAgeAndGender = state === "on";
  }
  getconfidenceLabel(){
    if(this.detections && this.detections.length>0){
      return this.detections[0].detection.score
    }else{
      return 0
    }
    
  }
  getExpressionLabel(){
    var expression = {name:"",val:0}
    if(this.detections && this.detections.length>0){
      
      for (const [key, value] of Object.entries(this.detections[0].expressions)) {
        if(value>expression.val){
          expression.name=key
          expression.val=value
        }
      }
        
    }
    return expression.name
  }
  setCanvas() {
    this.drawCanvas = faceapi.createCanvasFromMedia(this.video);
    // log.log(this.canvas);
    // log.log(this.drawCanvas);
    parentNode = this.canvas.parentNode;

    parentNode.style.position = "relative";

    this.drawCanvas.style.position = "absolute";
    this.drawCanvas.style.top = "0";
    this.drawCanvas.style.left = "0";
    this.drawCanvas.width = 480;
    this.drawCanvas.height = 360;

    parentNode.append(this.drawCanvas);

    this.displaySize = {
      width: 480,
      height: 360,
    };
    faceapi.matchDimensions(this.drawCanvas, this.displaySize);
  }

  clearCanvas() {
    if (this.drawCanvas) {
      this.drawCanvas
        .getContext("2d")
        .clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }
  }
}

module.exports = FacialRecognitionBlock;