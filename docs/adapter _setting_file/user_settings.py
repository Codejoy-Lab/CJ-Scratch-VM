# doc: https://adapter.codelab.club/user_guide/settings/
ADAPTER_MODE = 1  # user client
AUTO_OPEN_WEBUI = True
DEFAULT_ADAPTER_HOST = "codelab-adapter.codelab.club"
IS_WEBSOCKET_SAFE = False  # open for wss client
KEEP_LAST_CLIENT = False
OPEN_MESSAGE_HUB = False
OPEN_EIM_API = True
OPEN_REST_API = False
OPEN_WEBSOCKET_API = True
PYTHON3_PATH = None
RC_EXTENSIONS = []  # like linux rc.local, Run-ControlFiles
# TOKEN = "a7ffd955700b49f3"
TOKEN = None
USE_SSL = True
# USE_CN_PIP_MIRRORS = False
USER_WHITELIST_HOSTNAME = ["learn.codejoyai.com"] # ["codelab.club"]

import os, sys, pathlib, platform
if getattr(sys, 'frozen', False):
    executable_path = sys.executable

    app_dir = pathlib.Path(executable_path).parents[0]

    sys.path.insert(0, str(app_dir))
    try:
        from app_settings import *
    except Exception as e:
        print(str(e))

    try:
        sys.path.remove(str(app_dir))
    except Exception as e:
        print(str(e))
