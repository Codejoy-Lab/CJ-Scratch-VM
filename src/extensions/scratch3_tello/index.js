const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
const AdapterBaseClient = require("../scratch3_eim/codelab_adapter_base.js");

const blockIconURI = require('./icon_logo.png');
const menuIconURI = blockIconURI;
/**
 * Enum for button parameter values.
 * @readonly
 * @enum {string}
 */

const NODE_ID = "eim/tello";
const HELP_URL = 'https://adapter.codelab.club/extension_guide/tello/';

// 翻译
const FormHelp = {
  en: "help",
  "zh-cn": "帮助",
};

class Client {
  onAdapterPluginMessage(msg) {
      this.node_id = msg.message.payload.node_id;
      if (this.node_id === this.NODE_ID) {
          // json 数据, class

          this.adapter_node_content_hat = msg.message.payload.content;
          this.adapter_node_content_reporter = msg.message.payload.content;
          console.log("content ->", msg.message.payload.content);
      }
  }

  constructor(node_id, help_url) {
      this.NODE_ID = node_id;
      this.HELP_URL = help_url;

      this.adapter_base_client = new AdapterBaseClient(
          null, // onConnect,
          null, // onDisconnect,
          null, // onMessage,
          this.onAdapterPluginMessage.bind(this), // onAdapterPluginMessage,
          null, // update_nodes_status,
          null, // node_statu_change_callback,
          null, // notify_callback,
          null, // error_message_callback,
          null // update_adapter_status
      );
  }
}

class Scratch3TelloBlocks {
  constructor(runtime) {
    this.client = new Client(NODE_ID, HELP_URL);
  }

  /**
   * The key to load & store a target's test-related state.
   * @type {string}
   */
  static get STATE_KEY() {
    return "Scratch.cxtello";
  }

  get CMDMENU_INFO () {
    return [
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.up',
            default: 'up',
            description: ''
          }),
          value: 'up'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.down',
            default: 'down',
            description: ''
          }),
          value: 'down'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.left',
            default: 'left',
            description: ''
          }),
          value: 'left'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.right',
            default: 'right',
            description: ''
          }),
          value: 'right'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.forward',
            default: 'forward',
            description: ''
          }),
          value: 'forward'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.back',
            default: 'back',
            description: ''
          }),
          value: 'back'
        }
    ];
  }

  get CWMENU_INFO () {
    return [
      {
        name: formatMessage({
          id: 'cxtello.cwmenu.cw',
          default: 'cw',
          description: ''
        }),
        value: 'cw'
      },
      {
        name: formatMessage({
          id: 'cxtello.cwmenu.ccw',
          default: 'ccw',
          description: ''
        }),
        value: 'ccw'
      }
    ]
  }

  get DIRECTIONMENU () {
    return [
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.l',
          default: 'left',
          description: ''
        }),
        value: 'l'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.r',
          default: 'right',
          description: ''
        }),
        value: 'r'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.b',
          default: 'back',
          description: ''
        }),
        value: 'b'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.f',
          default: 'forward',
          description: ''
        }),
        value: 'f'
      }
    ]
  }

  _buildMenu (info) {
    return info.map((entry, index) => {
        const obj = {};
        obj.text = entry.name;
        obj.value = entry.value || String(index + 1);
        return obj;
    });
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
  /**
   * @returns {object} metadata for this extension and its blocks.
   */
  getInfo() {
    let the_locale = this._setLocale();
    return {
      id: "cxtello",
      name: "tello",
      colour: '#ff641d',
      colourSecondary: '#c94f18',
      colourTertiary: '#c94f18',
      menuIconURI: menuIconURI,
      blockIconURI: blockIconURI,
      blocks: [
        {
          opcode: "open_help_url",
          blockType: BlockType.COMMAND,
          text: FormHelp[the_locale],
          arguments: {},
        },
        {
          opcode: "verify_the_SSL_certificate",
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: "verify [hass_https]",
            id: "tello.verify",
            description: "verify the SSL certificate"
          }),
          arguments: {
            hass_https: {
              type: ArgumentType.STRING,
              defaultValue: `https://${this.client.adapter_base_client.adapterHost}:12358`
            }
          }
        },
        {
          opcode: "control_extension",
          blockType: BlockType.COMMAND,
          text: formatMessage({
              id: "cxtello.control_extension",
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
                  defaultValue: "extension_tello",
              },
          },
      },
        {
          opcode: 'command',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.command',
              default: 'enable SDK',
              description: 'command'
            }),
            description: ''
          })
        },
        {
          opcode: 'takeoff',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.takeoff',
              default: 'take off',
              description: 'takeoff'
            }),
            description: ''
          })
        },
        {
          opcode: 'land',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.land',
              default: 'land',
              description: 'land'
            }),
            description: ''
          })
        },
        {
          opcode: 'streamon',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.streamon',
              default: 'video stream on',
              description: 'streamon'
            }),
            description: ''
          })
        },
        {
          opcode: 'streamoff',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.streamoff',
              default: 'video stream off',
              description: 'streamoff'
            }),
            description: ''
          })
        },
        {
          opcode: 'emergency',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.emergency',
              default: 'emergency',
              description: 'emergency'
            }),
            description: ''
          })
        },
        {
          opcode: 'movecmd',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.up',
              default: 'move [CMD] [DISTANCE] cm',
              description: 'up'
            }),
            description: ''
          }),
          arguments: {
            DISTANCE: {
              type: ArgumentType.STRING,
              defaultValue: formatMessage({
                  id: 'cxtello.actionMenu.DISTANCE',
                  default: '20',
                  description: 'cxtello.actionMenu.DISTANCE'
              })
            },
            CMD: {
              type: ArgumentType.STRING,
              menu: 'cmdmenu',
              defaultValue: 'up'
            }
          }
        },
        {
          opcode: 'cwcmd',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.cw',
              default: 'clockwise/anticlockwise [CMD] [DEGREE] °',
              description: 'cw'
            }),
            description: '转向飞 x °'
          }),
          arguments: {
            DEGREE: {
              type: ArgumentType.STRING,
              defaultValue: formatMessage({
                  id: 'cxtello.actionMenu.DEGREE',
                  default: '45',
                  description: 'cxtello.actionMenu.DEGREE'
              })
            },
            CMD: {
              type: ArgumentType.STRING,
              menu: 'cwcmdmenu',
              defaultValue: 'cw'
            }
          }
        },
        {
          opcode: 'flip',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.direction',
              default: 'flip [DIRECTION]',
              description: 'direction'
            }),
            description: 'flip'
          }),
          arguments: {
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: 'directionmenu',
              defaultValue: 'l'
            }
          }
        },
        {
          opcode: 'go',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.go',
              default: 'go x:[X] y:[Y] z:[Z] speed:[SPEED]',
              description: 'go'
            }),
            description: 'go'
          }),
          arguments: {
            X: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            Y: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            Z: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            SPEED: {
              type: ArgumentType.STRING,
              defaultValue: '10'
            }
          }
        },
        {
          opcode: 'setspeed',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setspeed',
              default: 'set speed [SPEED]',
              description: 'setspeed'
            }),
            description: 'go'
          }),
          arguments: {
            SPEED: {
              type: ArgumentType.STRING,
              defaultValue: '10'
            }
          }
        },
        {
          opcode: 'setwifi',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setwifi',
              default: 'set wifi:[WIFI] pass:[PASS]',
              description: 'setwifi'
            }),
            description: 'setwifi'
          }),
          arguments: {
            WIFI: {
              type: ArgumentType.STRING,
              defaultValue: 'wifi'
            },
            PASS: {
              type: ArgumentType.STRING,
              defaultValue: 'password'
            }
          }
        },
        {
          opcode: 'setrc',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setrc',
              default: 'set roll:[A] pitch:[B] accelerator:[C] rotation:[D]',
              description: 'setrc'
            }),
            description: 'setrc'
          }),
          arguments: {
            A: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            B: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            C: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            D: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            }
          }
        },
        {
          opcode: 'getspeed',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getspeed',
              default: 'get speed',
              description: 'getspeed'
            }),
            description: 'getspeed'
          })
        },
        {
          opcode: 'getbattery',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getbattery',
              default: 'get battery',
              description: 'getbattery'
            }),
            description: 'getbattery'
          })
        },
        {
          opcode: 'gettime',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettime',
              default: 'get time',
              description: 'gettime'
            }),
            description: 'gettime'
          })
        },
        {
          opcode: 'getheight',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getheight',
              default: 'get height',
              description: 'getheight'
            }),
            description: 'getheight'
          })
        },
        {
          opcode: 'gettemp',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettemp',
              default: 'get temp',
              description: 'gettemp'
            }),
            description: 'gettemp'
          })
        },
        {
          opcode: 'getattitude',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getattitude',
              default: 'get attitude',
              description: 'getattitude'
            }),
            description: 'getattitude'
          })
        },
        {
          opcode: 'getbaro',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getbaro',
              default: 'get baro',
              description: 'getbaro'
            }),
            description: 'getbaro'
          })
        },
        {
          opcode: 'getacceleration',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getacceleration',
              default: 'get acceleration',
              description: 'getacceleration'
            }),
            description: 'getacceleration'
          })
        },
        {
          opcode: 'gettof',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettof',
              default: 'get tof',
              description: 'gettof'
            }),
            description: 'gettof'
          })
        },
        {
          opcode: 'getwifi',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getwifi',
              default: 'get wifi',
              description: 'getwifi'
            }),
            description: 'getwifi'
          })
        }
      ],
      menus: {
        cmdmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.CMDMENU_INFO)
        },
        cwcmdmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.CWMENU_INFO),
        },
        directionmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.DIRECTIONMENU)
        },
        turn: {
          acceptReporters: true,
          items: ["start", "stop"],
        },
      }
    };
  }

  command(args, util) {
    const content = 'command'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  takeoff(args, util) {
    const content = 'takeoff'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  land(args, util) {
    const content = 'land'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  streamon(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'streamon')
  }

  streamoff(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'streamoff')
  }

  emergency(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'emergency')

  }

  movecmd(args, util) {
    const content = args.CMD + ' ' + args.DISTANCE
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  cwcmd(args, util) {
    const content = args.CMD + ' ' + args.DEGREE
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  flip(args, util) {
    const content = 'flip ' + args.DIRECTION
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  go(args, util) {
    const content = `go ${args.X} ${args.Y} ${args.Z} ${args.SPEED}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setspeed(args, util) {
    const content = `speed ${args.SPEED}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setwifi() {
    const content =`wifi ${args.WIFI} ${args.PASS}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setrc() {
    const content = `rc ${args.A} ${args.B} ${args.C} ${args.D}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  getspeed() {
    const content = 'speed?'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  getbattery() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'battery?')
  }

  gettime() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'time?')
  }

  getheight() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'height?')
  }

  gettemp() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'temp?')
  }

  getattitude() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'attitude?')
  }

  getbaro() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'baro?')
  }


  getacceleration() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'acceleration?')

  }

  gettof() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'tof?')
  }

  getwifi() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'wifi?')
  }

  open_help_url(args) {
    window.open(HELP_URL);
  }

  verify_the_SSL_certificate(args) {
    window.open(args.hass_https);
  }

  control_extension(args) {
  const content = args.turn;
  const ext_name = args.ext_name;
  return this.client.adapter_base_client.emit_with_messageid_for_control(
      NODE_ID,
      content,
      ext_name,
      "extension"
  );
  }

}

module.exports = Scratch3TelloBlocks;
