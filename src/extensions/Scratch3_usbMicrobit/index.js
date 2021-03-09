const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
const cast = require("../../util/cast");
const log = require("../../util/log");
const AdapterBaseClient = require("../scratch3_eim/codelab_adapter_base.js");

/*
https://github.com/LLK/scratch-vm/blob/develop/src/extensions/scratch3_microbit/index.js#L84
放弃Scratch愚蠢丑陋的UI连接
*/

const blockIconURI = 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABjCAYAAABQdcSKAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIK2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjcwMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+NjU1MzU8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjM2ODwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo0YzVmZGM4OS0xZjIzLTQ2MWQtYjBkZC05NTY4OWMyYWVmYTM8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTgtMDctMTlUMjE6MTU6MTktMDQ6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6NGM1ZmRjODktMWYyMy00NjFkLWIwZGQtOTU2ODljMmFlZmEzPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOjRjNWZkYzg5LTFmMjMtNDYxZC1iMGRkLTk1Njg5YzJhZWZhMzwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+eG1wLmRpZDo0YzVmZGM4OS0xZjIzLTQ2MWQtYjBkZC05NTY4OWMyYWVmYTM8L3ht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'
const menuIconURI = blockIconURI;

const NODE_ID = "eim/extension_usb_microbit";
const HELP_URL = "https://adapter.codelab.club/extension_guide/microbit/";

const FormHelp = {
    en: "help",
    "zh-cn": "帮助",
};

const Form_update_ports = {
    en: "update ports",
    "zh-cn": "更新串口信息",
};
const Form_connect = {
    en: "connect port [port]",
    "zh-cn": "连接到 [port]",
};

const FormFlash = {
    en: "flash firmware",
    "zh-cn": "刷入固件",
};

var ButtonParam = {
    A: "A",
    B: "B",
    A_B: "A+B",
};

var analogPin = {
    one: "1",
    two: "2",
};

var gesture = {
    face_up: "face up",
    face_down: "face down",
    shake: "shake",
};

var AccelerometerParam = {
    X: "X",
    Y: "Y",
    Z: "Z",
};

const MicroBitTiltDirection = {
    FRONT: "front",
    BACK: "back",
    LEFT: "left",
    RIGHT: "right",
    ANY: "any",
};

var IconParam = {
    HEART: "heart",
    HEART_SMALL: "heart_small",
    HAPPY: "happy",
    SMILE: "smile",
    SAD: "sad",
    CONFUSED: "confused",
    ANGRY: "angry",
    ASLEEP: "asleep",
    SURPRISED: "surprised",
    SILLY: "silly",
    FABULOUS: "fabulous",
    MEH: "meh",
    YES: "yes",
    NO: "no",
};
const whenButtonIsPressed={
    en: "When Button [BUTTON_PARAM] Is Pressed",
    "zh-cn": "当按钮 [BUTTON_PARAM] 被按下",
}
const buttonIsPressed={
    en: "Button [BUTTON_PARAM] Is Pressed?",
    "zh-cn": "按钮 [BUTTON_PARAM] 是否被按下?",
}
const say={
    en: "say [TEXT]",
    "zh-cn": "说 [TEXT]",
}
const displaySymbol={
    en: "display [MATRIX]",
    "zh-cn": "显示 [MATRIX]",
}
const showIcon={
    en: "show icon [ICON_PARAM]",
    "zh-cn": "显示图标 [ICON_PARAM]",
}
const clearScreen={
    en: "clear screen",
    "zh-cn": "清空屏幕",
}
const get_gesture={
    en: "gesture is[gesture]?",
    "zh-cn": "手势是 [gesture]吗?",
}
const get_accelerometer={
    en: "Accelerometer [ACCELEROMETER_PARAM]",
    "zh-cn": "加速器 [ACCELEROMETER_PARAM]",
}
class Client {
    onAdapterPluginMessage(msg) {
        this.node_id = msg.message.payload.node_id;
        if (
            this.node_id === this.NODE_ID ||
            this.node_id === "ExtensionManager"
        ) {
            this.adapter_node_content_hat = msg.message.payload.content;
            this.adapter_node_content_reporter = msg.message.payload.content;
            console.log(
                `${this.NODE_ID} message->`,
                msg.message.payload.content
            );
            if(this.adapter_node_content_reporter && this.adapter_node_content_reporter.ports){
                this.ports = this.adapter_node_content_reporter.ports;
            }

            this.button_a = msg.message.payload.content.button_a;
            this.button_b = msg.message.payload.content.button_b;
            this.x = msg.message.payload.content.x;
            this.y = msg.message.payload.content.y;
            this.z = msg.message.payload.content.z;
            this.gesture = msg.message.payload.content.gesture;
            this.pin_one = msg.message.payload.content.pin_one_analog_input;
            this.pin_two = msg.message.payload.content.pin_two_analog_input;
        }
    }

    constructor(node_id, help_url, runtime) {
        this.NODE_ID = node_id;
        this.HELP_URL = help_url;
        this._runtime = runtime;

        this.adapter_base_client = new AdapterBaseClient(
            null, // onConnect,
            null, // onDisconnect,
            null, // onMessage,
            this.onAdapterPluginMessage.bind(this), // onAdapterPluginMessage,
            null, // update_nodes_status,
            null, // node_statu_change_callback,
            null, // notify_callback,
            null, // error_message_callback,
            null, // update_adapter_status
            60,
            runtime
        );
    }

    formatPorts() {
        // text value list
        console.log("ports -> ", this.ports);
        if (Array.isArray(this.ports) && this.ports.length) {
            // list
            // window.extensions_statu = this.exts_statu;
            let ports = this.ports.map((x) => ({ text: x, value: x }));
            return ports;
        }
        return [
            {
                text: "",
                value: "",
            },
        ];
    }
}

class UsbMicroBit {
    // https://github.com/LLK/scratch-vm/blob/develop/src/extensions/scratch3_microbit/index.js#L62
    constructor(runtime, extensionId) {
        this._adapter_client = new Client(NODE_ID, HELP_URL, runtime); // 把收到的信息传递到runtime里
        this._runtime = runtime;
        /*
        this._runtime = runtime;
        this._runtime.registerPeripheralExtension(extensionId, this); // 主要使用UI runtime
        this._extensionId = extensionId;
        this.reset = this.reset.bind(this);
        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._timeoutID = null;
        this._busy = false;
        */
    }

    // https://github.com/LLK/scratch-vm/blob/5f101256434b21035e55183d4e0e4c2d1e5936fa/src/io/ble.js#L171
    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */

    start_extension(){
        // todo: disconnect
        const content = 'start';
        const ext_name = 'extension_usb_microbit';
        return this._adapter_client.adapter_base_client.emit_with_messageid_for_control(
            NODE_ID,
            content,
            ext_name,
            "extension"
        ).then(() => {
            console.log("start extension_usb_microbit")
            //todo update_ports
        })
    }

    scan() {
        if (window.socketState !== undefined && !window.socketState) {
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
                message: `Codelab adapter 未连接`,
                extensionId: this.extensionId
            });
            return
        }
        let promise = Promise.resolve()

        //  自动打开插件
        promise = promise.then(() => {
            return this.start_extension()
        })


        const code = `microbitHelper.update_ports()`; // 广播 , 收到特定信息更新变量
        promise.then(() => {
            return this._adapter_client.adapter_base_client.emit_with_messageid(
                NODE_ID,
                code
            )
        }).then(() => {
            let ports = this._adapter_client.formatPorts()
            let portsObj = ports
                .filter(port => !!port.value)
                .map(port => ({"name":port.value,"peripheralId": port.value,"rssi":-0}))
                .reduce((prev, curr) => {
                    prev[curr.peripheralId] = curr
                    return prev
                }, {})
            this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                portsObj
            );
        }).catch(e => console.error(e))
        // todo 打开插件
        // 发送请求，要求后端返回 device list
        /*
        scan
        from scratch {"jsonrpc":"2.0","method":"discover","params":{"filters":[{"services":["10b20100-5b3b-4571-9508-cf3efcd7bbae"]}]},"id":0}
        from adapter {"method":"didDiscoverPeripheral","params":{"name":"toio Core Cube","peripheralId":"385C2678-9C23-482A-A40F-627D77EB3CFD","rssi":-70},"jsonrpc":"2.0"}

        connect
            {"jsonrpc":"2.0","method":"connect","params":{"peripheralId":"385C2678-9C23-482A-A40F-627D77EB3CFD"},"id":1}
            rep {"id":1,"result":null,"jsonrpc":"2.0"}
            */
        console.log("scan");
        /*
        this._availablePeripherals = {};
        this._availablePeripherals[params.peripheralId] = params;
        this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                this._availablePeripherals
            );
        */
    }

    _onConnect() {
        console.log(`_onConnect`);
    }

    _onMessage(msg) {
        console.log("_onMessage");
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */

    connect(id) {
        // UI 触发
        console.log("connect");
        if (this._adapter_client) {
            const port = id;
            const code = `microbitHelper.connect("${port}")`; // disconnect()

            this._adapter_client.adapter_base_client.emit_with_messageid(
                NODE_ID,
                code
            ).then(() => {
                this.connected = true
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
            })
        }
    }

    disconnect() {
        // todo: disconnect: `microbitHelper.disconnect()`;
        this.reset();

        if (!this._adapter_client.adapter_base_client.connected) {
            return
        }

        const code = `microbitHelper.disconnect()`; // disconnect()
        this._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            code
        ).then((res) => {
            // 这个消息没有 resolve
           console.log(res)
        }).catch(e => console.error(e))
    }

    reset() {
        console.log("reset");
        this.connected = false
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
        // 断开
    }

    isConnected() {
        let connected = false;
        if (this._adapter_client) {
            connected = this._adapter_client.adapter_base_client.connected && this.connected;
        }
        return connected;
    }
}

class Scratch3UsbMicrobitBlocks {
    static get TILT_THRESHOLD() {
        return 15;
    }
    static get STATE_KEY() {
        return "Scratch.usbMicrobit";
    }

    static get EXTENSION_ID() {
        return "usbMicrobit";
    }

    constructor(runtime) {
        // Create a new MicroBit peripheral instance
        this._runtime = runtime
        this._peripheral = new UsbMicroBit(
            runtime,
            Scratch3UsbMicrobitBlocks.EXTENSION_ID
        );
        this._runtime.registerPeripheralExtension(Scratch3UsbMicrobitBlocks.EXTENSION_ID, this._peripheral); // 主要使用UI runtime
    }

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

    getInfo() {
        let the_locale = this._setLocale();
        return {
            id: "usbMicrobit",
            name: "usbMicrobit",
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            color1: "#3eb6fd",
            showStatusButton: true,
            blocks: [
                {
                    opcode: "open_help_url",
                    blockType: BlockType.COMMAND,
                    text: FormHelp[the_locale],
                    arguments: {},
                },
                {
                    opcode: "flash_firmware",
                    blockType: BlockType.COMMAND,
                    text: FormFlash[the_locale],
                    arguments: {},
                },
                /*
                {
                    opcode: "control_extension",
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "python.control_extension",
                        default: "[turn] [ext_name]",
                        description:
                            "turn on/off the extension of codelab-adapter",
                    }),
                    arguments: {
                        turn: {
                            type: ArgumentType.STRING,
                            defaultValue: "start",
                            menu: "turn",
                        },
                        ext_name: {
                            type: ArgumentType.STRING,
                            defaultValue: "extension_usb_microbit",
                            menu: "extensions_name",
                        },
                    },
                },
                {
                    opcode: "update_ports",
                    blockType: BlockType.COMMAND,
                    text: Form_update_ports[the_locale],
                    arguments: {},
                },
                {
                    opcode: "connect",
                    blockType: BlockType.COMMAND,
                    text: Form_connect[the_locale],
                    arguments: {
                        port: {
                            type: ArgumentType.STRING,
                            defaultValue: "",
                            menu: "ports",
                        },
                    },
                },
                */
                {
                    opcode: "whenButtonIsPressed",
                    blockType: BlockType.HAT,
                    text: whenButtonIsPressed[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.whenbuttonispressed",
                    //     default: "When Button [BUTTON_PARAM] Is Pressed",
                    //     description: "pass hello by socket",
                    // }),
                    arguments: {
                        BUTTON_PARAM: {
                            type: ArgumentType.STRING,
                            menu: "buttonParam",
                            defaultValue: ButtonParam.A,
                        },
                    },
                },
                {
                    opcode: "buttonIsPressed",
                    blockType: BlockType.BOOLEAN,
                    // blockType: BlockType.REPORTER,
                    text: buttonIsPressed[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.buttonispressed",
                    //     default: "Button [BUTTON_PARAM] Is Pressed?",
                    //     description: "pass hello by socket",
                    // }),
                    arguments: {
                        BUTTON_PARAM: {
                            type: ArgumentType.STRING,
                            menu: "buttonParam",
                            defaultValue: ButtonParam.A,
                        },
                    },
                },
                "---",
                {
                    opcode: "say",
                    blockType: BlockType.COMMAND,
                    text: say[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.say",
                    //     default: "say [TEXT]",
                    //     description: "pass hello by socket",
                    // }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: "Hello!",
                        },
                    },
                },

                {
                    opcode: "displaySymbol",
                    text: displaySymbol[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.displaySymbol",
                    //     default: "display [MATRIX]",
                    //     description:
                    //         "display a pattern on the micro:bit display",
                    // }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX,
                            defaultValue: "0101010101100010101000100",
                        },
                    },
                },
                {
                    opcode: "showIcon",
                    blockType: BlockType.COMMAND,
                    text: showIcon[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.showIcon",
                    //     default: "showIcon [ICON_PARAM]",
                    //     description: "change the icon of microbit",
                    // }),
                    arguments: {
                        ICON_PARAM: {
                            type: ArgumentType.STRING,
                            menu: "iconParam",
                            defaultValue: IconParam.HAPPY,
                        },
                    },
                },
                {
                    opcode: "clearScreen",
                    blockType: BlockType.COMMAND,
                    // blockType: BlockType.REPORTER,
                    text: clearScreen[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.clearScreen",
                    //     default: "clear screen",
                    //     description: "clear screen",
                    // }),
                    arguments: {},
                },
                "---",
                {
                    opcode: "get_gesture",
                    // blockType: BlockType.BOOLEAN,
                    blockType: BlockType.BOOLEAN,
                    // blockType: BlockType.COMMAND,
                    text: get_gesture[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.get_gesture",
                    //     default: "gesture is[gesture]?",
                    //     description: "gesture is?",
                    // }),
                    arguments: {
                        gesture: {
                            type: ArgumentType.STRING,
                            menu: "gesture",
                            defaultValue: gesture.face_up,
                        },
                    },
                },
                {
                    opcode: "get_accelerometer",
                    // blockType: BlockType.BOOLEAN,
                    blockType: BlockType.REPORTER,
                    // blockType: BlockType.COMMAND,
                    text: get_accelerometer[the_locale],
                    // formatMessage({
                    //     id: "usbMicrobit.get_accelerometer",
                    //     default: "Accelerometer [ACCELEROMETER_PARAM]",
                    //     description: "pass hello by socket",
                    // }),
                    arguments: {
                        ACCELEROMETER_PARAM: {
                            type: ArgumentType.STRING,
                            menu: "accelerometerParam",
                            defaultValue: AccelerometerParam.X,
                        },
                    },
                },
                {
                    opcode: "getTiltAngle",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "usbMicrobit.get_TiltAngle",
                        default: "tilt angle [tiltDirection]",
                        description: "pass hello by socket",
                    }),
                    arguments: {
                        tiltDirection: {
                            type: ArgumentType.STRING,
                            menu: "tiltDirection",
                            defaultValue: MicroBitTiltDirection.FRONT,
                        },
                    },
                },
                {
                    opcode: "isTilted",
                    text: formatMessage({
                        id: "usbMicrobit.isTilted",
                        default: "tilted [tiltDirectionAny]?",
                        description:
                            "is the micro:bit is tilted in a direction?",
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        tiltDirectionAny: {
                            type: ArgumentType.STRING,
                            menu: "tiltDirectionAny",
                            defaultValue: MicroBitTiltDirection.ANY,
                        },
                    },
                },
                "---",
                {
                    opcode: "get_analog_input",
                    // blockType: BlockType.BOOLEAN,
                    blockType: BlockType.REPORTER,
                    // blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "usbMicrobit.get_analog_input",
                        default: "Analog pin [ANALOG_PIN] value",
                        description: "pass hello by socket",
                    }),
                    arguments: {
                        ANALOG_PIN: {
                            type: ArgumentType.STRING,
                            menu: "analogPin",
                            defaultValue: analogPin.one,
                        },
                    },
                },
                "---",
                {
                    opcode: "python_exec",
                    // 前端打上标记 危险
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "usbMicrobit.python_exec",
                        default: "exec [CODE]",
                        description: "run python code.",
                    }),
                    arguments: {
                        CODE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'display.show("c")',
                        },
                    },
                },
            ],
            menus: {
                buttonParam: {
                    acceptReporters: true,
                    items: this.initButtonParam(),
                },
                tiltDirection: {
                    acceptReporters: true,
                    items: this.TILT_DIRECTION_MENU,
                },
                tiltDirectionAny: {
                    acceptReporters: true,
                    items: this.TILT_DIRECTION_ANY_MENU,
                },
                analogPin: {
                    acceptReporters: true,
                    items: this.initAnalogPin(),
                },
                gesture: {
                    acceptReporters: true,
                    items: this.initgesture(),
                },
                accelerometerParam: {
                    acceptReporters: true,
                    items: this.initAccelerometerParam(),
                },
                iconParam: {
                    acceptReporters: true,
                    items: this.initColorParam(),
                },
                extensions_name: {
                    acceptReporters: true,
                    items: ["extension_usb_microbit"],
                },
                turn: {
                    acceptReporters: true,
                    items: ["start", "stop"],
                },
                ports: {
                    acceptReporters: true,
                    items: "_formatPorts",
                },
            },
        };
    }

    _formatPorts() {
        return this._peripheral._adapter_client.formatPorts();
    }

    python_exec(args) {
        const python_code = `${args.CODE}`;
        this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            python_code
        );
        return;
    }

    initButtonParam() {
        return [
            {
                text: "A",
                value: ButtonParam.A,
            },
            {
                text: "B",
                value: ButtonParam.B,
            },
            {
                text: "A+B",
                value: ButtonParam.A_B,
            },
        ];
    }

    initColorParam() {
        return [
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.happy",
                    default: "happy",
                    description:
                        "label for color element in color picker for pen extension",
                }),
                value: IconParam.HAPPY,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.smile",
                    default: "smile",
                    description:
                        "label for saturation element in color picker for pen extension",
                }),
                value: IconParam.SMILE,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.sad",
                    default: "sad",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.SAD,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.heart",
                    default: "heart",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.HEART,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.heart_small",
                    default: "heart_small",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.HEART_SMALL,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.yes",
                    default: "yes",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.YES,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.confused",
                    default: "confused",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.CONFUSED,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.angry",
                    default: "angry",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.ANGRY,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.asleep",
                    default: "asleep",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.ASLEEP,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.surprised",
                    default: "surprised",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.SURPRISED,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.silly",
                    default: "silly",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.SILLY,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.meh",
                    default: "meh",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.MEH,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.fabulous",
                    default: "fabulous",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.FABULOUS,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.iconMenu.no",
                    default: "no",
                    description:
                        "label for brightness element in color picker for pen extension",
                }),
                value: IconParam.NO,
            },
        ];
    }

    initAccelerometerParam() {
        return [
            {
                text: "X",
                value: AccelerometerParam.X,
            },
            {
                text: "Y",
                value: AccelerometerParam.Y,
            },
            {
                text: "Z",
                value: AccelerometerParam.Z,
            },
        ];
    }

    initAnalogPin() {
        return [
            {
                text: "1",
                value: analogPin.one,
            },
            {
                text: "2",
                value: analogPin.two,
            },
        ];
    }

    initgesture() {
        return [
            {
                text: formatMessage({
                    id: "usbMicrobit.gesture.face_up",
                    default: "face up",
                    description:
                        "label for front element in tilt direction picker for micro:bit extension",
                }),
                value: gesture.face_up,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.gesture.face_down",
                    default: "face down",
                    description:
                        "label for front element in tilt direction picker for micro:bit extension",
                }),
                value: gesture.face_down,
            },
            {
                text: formatMessage({
                    id: "usbMicrobit.gesture.shake",
                    default: "shake",
                    description:
                        "label for front element in tilt direction picker for micro:bit extension",
                }),
                value: gesture.shake,
            },
        ];
    }

    get TILT_DIRECTION_MENU() {
        return [
            {
                text: formatMessage({
                    id: "microbit.tiltDirectionMenu.front",
                    default: "front",
                    description:
                        "label for front element in tilt direction picker for micro:bit extension",
                }),
                value: MicroBitTiltDirection.FRONT,
            },
            {
                text: formatMessage({
                    id: "microbit.tiltDirectionMenu.back",
                    default: "back",
                    description:
                        "label for back element in tilt direction picker for micro:bit extension",
                }),
                value: MicroBitTiltDirection.BACK,
            },
            {
                text: formatMessage({
                    id: "microbit.tiltDirectionMenu.left",
                    default: "left",
                    description:
                        "label for left element in tilt direction picker for micro:bit extension",
                }),
                value: MicroBitTiltDirection.LEFT,
            },
            {
                text: formatMessage({
                    id: "microbit.tiltDirectionMenu.right",
                    default: "right",
                    description:
                        "label for right element in tilt direction picker for micro:bit extension",
                }),
                value: MicroBitTiltDirection.RIGHT,
            },
        ];
    }

    get TILT_DIRECTION_ANY_MENU() {
        return [
            ...this.TILT_DIRECTION_MENU,
            {
                text: formatMessage({
                    id: "microbit.tiltDirectionMenu.any",
                    default: "any",
                    description:
                        "label for any direction element in tilt direction picker for micro:bit extension",
                }),
                value: MicroBitTiltDirection.ANY,
            },
        ];
    }

    showIcon(args) {
        // todo 不够平坦
        var convert = {
            happy: "Image.HAPPY",
            smile: "Image.SMILE",
            sad: "Image.SAD",
            heart: "Image.HEART",
            heart_small: "Image.HEART_SMALL",
            yes: "Image.YES",
            no: "Image.NO",
            confused: "Image.CONFUSED",
            angry: "Image.ANGRY",
            asleep: "Image.ASLEEP",
            surprised: "Image.SURPRISED",
            silly: "Image.SILLY",
            meh: "Image.MEH",
            fabulous: "Image.FABULOUS",
        };
        //microbitHelper.send_command('''${args.CODE}''')
        var python_code = `display.show(${
            convert[args.ICON_PARAM]
        }, wait = True, loop = False)`; // console.log(args.ICON_PARAM);

        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            python_code
        );
    }
    getHats() {
        return {
            microbit_whenbuttonaispressed: {
                restartExistingThreads: false,
                edgeActivated: true,
            },
        };
    }

    getMonitored() {
        return {
            microbit_buttonispressed: {},
        };
    }

    whenButtonIsPressed(args) {
        if (args.BUTTON_PARAM === "A") {
            return this._peripheral._adapter_client.button_a;
        } else if (args.BUTTON_PARAM === "B") {
            return this._peripheral._adapter_client.button_b;
        } else if (args.BUTTON_PARAM === "A+B") {
            return (
                this._peripheral._adapter_client.button_a &&
                this._peripheral._adapter_client.button_b
            );
        }
    }

    get_analog_input(args) {
        if (args.ANALOG_PIN === "1") {
            return this._peripheral._adapter_client.pin_one;
        } else if (args.ANALOG_PIN === "2") {
            return this._peripheral._adapter_client.pin_two;
        }
    }

    get_accelerometer(args) {
        if (args.ACCELEROMETER_PARAM === "X") {
            return this._peripheral._adapter_client.x;
        } else if (args.ACCELEROMETER_PARAM === "Y") {
            return this._peripheral._adapter_client.y;
        } else if (args.ACCELEROMETER_PARAM === "Z") {
            return this._peripheral._adapter_client.z;
        }
    }
    buttonIsPressed(args) {
        if (args.BUTTON_PARAM === "A") {
            return this._peripheral._adapter_client.button_a;
        } else if (args.BUTTON_PARAM === "B") {
            return this._peripheral._adapter_client.button_b;
        } else if (args.BUTTON_PARAM === "A+B") {
            return (
                this._peripheral._adapter_client.button_a &&
                this._peripheral._adapter_client.button_b
            );
        }
    }
    say(args) {
        var python_code = `display.scroll('${args.TEXT}', wait=False, loop=False)`;
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            python_code
        );
    }

    displaySymbol(args) {
        // console.log("MATRIX->", args.MATRIX);
        const symbol = cast.toString(args.MATRIX).replace(/\s/g, "");
        //console.log("symbol->", symbol);
        var symbol_code = "";
        for (var i = 0; i < symbol.length; i++) {
            if (i % 5 == 0 && i != 0) {
                symbol_code = symbol_code + ":";
            }
            if (symbol[i] != "0") {
                symbol_code = symbol_code + "7";
            } else {
                symbol_code = symbol_code + "0";
            }
        }

        var python_code = `display.show(Image("${symbol_code}"), wait=True, loop=False)`;
        // console.log(python_code);
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            python_code
        );
    }
    clearScreen(args) {
        var python_code = `display.clear()`;
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            python_code
        );
    }

    isTilted(args) {
        return this._isTilted(args.tiltDirectionAny);
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     */
    getTiltAngle(args) {
        return this._getTiltAngle(args.tiltDirection);
    }

    _getTiltAngle(args) {
        switch (args) {
            case MicroBitTiltDirection.FRONT:
                return Math.round(this._peripheral._adapter_client.y / -10);
            case MicroBitTiltDirection.BACK:
                return Math.round(this._peripheral._adapter_client.y / 10);
            case MicroBitTiltDirection.LEFT:
                return Math.round(this._peripheral._adapter_client.x / -10);
            case MicroBitTiltDirection.RIGHT:
                return Math.round(this._peripheral._adapter_client.x / 10);
            default:
                log.warn(`Unknown tilt direction in _getTiltAngle: ${args}`);
        }
    }

    _isTilted(args) {
        switch (args) {
            case MicroBitTiltDirection.ANY:
                return (
                    Math.abs(this._peripheral._adapter_client.x / 10) >=
                        Scratch3UsbMicrobitBlocks.TILT_THRESHOLD ||
                    Math.abs(this._peripheral._adapter_client.y / 10) >=
                        Scratch3UsbMicrobitBlocks.TILT_THRESHOLD
                );
            default:
                console.log(args);
                return (
                    this._getTiltAngle(args) >=
                    Scratch3UsbMicrobitBlocks.TILT_THRESHOLD
                );
        }
    }

    get_gesture(args) {
        switch (args.gesture) {
            case this._peripheral._adapter_client.gesture:
                return true;
            default:
                return false;
        }
    }

    control_extension(args) {
        const content = args.turn;
        const ext_name = args.ext_name;
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid_for_control(
            NODE_ID,
            content,
            ext_name,
            "extension"
        );
    }

    open_help_url(args) {
        window.open(HELP_URL);
    }

    flash_firmware(args) {
        return new Promise((resolve) => {
            fetch(
                `https://codelab-adapter.codelab.club:12358/api/message/flash`,
                {
                    body: JSON.stringify({
                        message: "flash_usb_microbit",
                    }),
                    headers: {
                        "content-type": "application/json",
                    },
                    method: "POST",
                }
            )
                .then((res) => res.json())
                .then((ret) => {
                    const poem = ret.status;
                    resolve(`${poem}`);
                });
        });
    }

    update_ports(args) {
        // 更新到一个变量里
        const code = `microbitHelper.update_ports()`; // 广播 , 收到特定信息更新变量
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            code
        );
    }

    connect(args) {
        const port = args.port;
        const code = `microbitHelper.connect("${port}")`;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this._peripheral._adapter_client.adapter_base_client.emit_with_messageid(
            NODE_ID,
            code
        );
    }

}

module.exports = Scratch3UsbMicrobitBlocks;
