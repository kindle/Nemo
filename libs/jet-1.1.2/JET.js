/* JET: version = 1.1.2, released date = 30/4/2014 */

//to do - internalize this
if (!("JET" in window)) {
    // Check if iframe. Don't use "!==", it does not work in IE.
    if (window != window.top)
    {
        // Check if top already has JET, mirror if it's the case
        if ("JET" in window.top)
            JET = window.top.JET;
        else
        {
            (function(w,d,script) {
                // Inject JET.js in top frame
                // Get JET source url
                var scripts = document.getElementsByTagName('script');
                var JETScript = scripts[scripts.length - 1];

                // XHR JET.js
                var xhr = null;
                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                } else if (window.ActiveXObject){ //if IE 8 and older
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }

                xhr.open('GET', JETScript.src, false);
                xhr.send();
                if (xhr.status === 200) {
                    // Run JET.js in top frame
                    if (window.top.eval) {
                        window.top.eval(xhr.responseText);
                    } else if (window.top.execScript) { //IE8 doesn't have window.top.eval()
                        window.top.execScript(xhr.responseText);
                    } else {
                        throw new Error("Unable to install JET to the parent frame");
                    }
                    // Mirror top frame JET to this one
                    window.JET = window.top.JET;
                }
            }(window,window.top.document));
        }
    }
    else
    {
        JET = function () {
            var _api_version = 0;

            // reference onto Eikon container
            var container = null;

            // utils internal api   
            var _u = {};

            function setLogOptions(logLevel, logger) {
                if (logger == undefined) {
                    logger = window.console;
                }

                if (!logger) {
                    logLevel = 10; //disable logging if there is no logger defined
                }
                var noLog = function () { };

                // Standard console doesn't have a trace log level, by the external logger should have it
                var traceFunction, debugFunction;
                if (logger) {
                    if (logger == window.console) {
                        traceFunction = "log"; // No browsers has console.trace funtion. IE doesn't has console.debug function.
                        debugFunction = "log";
                    } else {
                        traceFunction = "trace";
                        debugFunction = "debug";
                    }
                } else {
                    logLevel = 10; //disable logging if there is no logger defined          
                }

                function wrapLogCall(methodName) {
                    return function () {
                        var params = Array.prototype.slice.call(arguments);
                        for (var n = 0; n < params.length; n++) {
                            if (typeof (params[n]) == "function") {
                                params[n] = params[n]();
                            }

                            if (typeof (params[n]) == "object") {
                                params[n] = _u.toJson(params[n]);
                            }
                        }
                        Function.prototype.apply.call(logger[methodName], logger, params);
                    }
                }

                _u.trace = logLevel <= 0 ? wrapLogCall(traceFunction) : noLog;
                _u.debug = logLevel <= 1 ? wrapLogCall(debugFunction) : noLog;
                _u.info = logLevel <= 2 ? wrapLogCall("info") : noLog;
                _u.warn = logLevel <= 3 ? wrapLogCall("warn") : noLog;
                _u.error = logLevel <= 4 ? wrapLogCall("error") : noLog;
            }

            setLogOptions(3); // Log warnings and higher by default

            /* String prototype mixin to support trim() in old browsers */
            if(typeof String.prototype.trim !== 'function') {
              String.prototype.trim = function() {
                return this.replace(/^\s+|\s+$/g, ''); 
              }
            }

            // helper functions
            _u.isString = function (it) {
                return (typeof it == "string" || it instanceof String); // Boolean
            };

            // check for array type
            _u.isArray = function (it) {
				return Object.prototype.toString.call(it) === '[object Array]';
            };

            _u.isFunction = function (it) {
                return Object.prototype.toString.call(it) === "[object Function]";
            };

            // check if bitwise flag is ON or not
            _u.isFlagOn = function (value, flag) {
                return ((value & flag) != 0);
            }

            // evaluate code
            _u.eval = function (code) {
                return eval("(" + code + ")");
            };
            // iterate cycles, .each( function(element, index) )
            _u.each = function (arr, callback, defRet) {
                if (arr && arr.length) {
                    for (var i = 0; i < arr.length; i++) {
                        var res = callback(arr[i], i);
                        if ("undefined" != typeof res)
                            return res;
                    }
                }
                return defRet;
            };

            _u.add = function (arr, item) {
                if (!arr)
                    throw new Error("Array is empty!");
                arr[arr.length] = item;
            };

            _u.toJson = window.JSON && JSON.stringify ? JSON.stringify : function (it) {
                var opts = Object.prototype.toString;

                var isString = function (it) {
                    return (typeof it == "string" || it instanceof String); // Boolean
                };

                var isFunction = function (it) {

                    return opts.call(it) === "[object Function]";
                };

                var _escapeString = function (/*String*/str) {
                    //summary:
                    //      Adds escape sequences for non-visual characters, double quote and
                    //      backslash and surrounds with double quotes to form a valid string
                    //      literal.
                    return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
                    replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
                    replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
                };

                var map = function (arr, callback, thisObject) {
                    var _getParts = function (arr, obj, cb) {
                        return [
                        (typeof arr == "string") ? arr.split("") : arr,
                        obj || window,
                        // FIXME: cache the anonymous functions we create here?
                        (typeof cb == "string") ? new Function("item", "index", "array", cb) : cb
                        ];
                    };
                    var _p = _getParts(arr, thisObject, callback); arr = _p[0];
                    var outArr = (arguments[3] ? (new arguments[3]()) : []);
                    for (var i = 0, l = arr.length; i < l; ++i) {
                        outArr.push(_p[2].call(_p[1], arr[i], i, arr));
                    }
                    return outArr; // Array
                };

                if (it === undefined) {
                    return "undefined";
                }
                var objtype = typeof it;
                if (objtype == "number" || objtype == "boolean") {
                    return it + "";
                }
                if (it === null) {
                    return "null";
                }
                if (isString(it)) {
                    return _escapeString(it);
                }
                // recurse
                var recurse = arguments.callee;
                // short-circuit for objects that support "json" serialization
                // if they return "self" then just pass-through...
                var newObj;
                var tf = it.__json__ || it.json;
                if (isFunction(tf)) {
                    newObj = tf.call(it);
                    if (it !== newObj) {
                        return recurse(newObj);
                    }
                }
                if (it.nodeType && it.cloneNode) { // isNode
                    // we can't seriailize DOM nodes as regular objects because they have cycles
                    // DOM nodes could be serialized with something like outerHTML, but
                    // that can be provided by users in the form of .json or .__json__ function.
                    throw new Error("Can't serialize DOM nodes");
                }

                var sep = "";
                var newLine = "";

                // array
                if (_u.isArray(it)) {
                    var res = map(it, function (obj) {
                        var val = recurse(obj);
                        if (typeof val != "string") {
                            val = "undefined";
                        }
                        return val;
                    });
                    return "[" + res.join(",") + "]";
                }
                // it's a function with no adapter, skip it
                if (objtype == "function") {
                    return null; // null
                }
                // generic object code path
                var output = [], key;
                for (key in it) {
                    var keyStr, val;
                    if (typeof key == "number") {
                        keyStr = '"' + key + '"';
                    } else if (typeof key == "string") {
                        keyStr = _escapeString(key);
                    } else {
                        // skip non-string or number keys
                        continue;
                    }
                    val = recurse(it[key]);
                    if (typeof val != "string") {
                        // skip non-serializable values
                        continue;
                    }
                    // FIXME: use += on Moz!!
                    //   MOW NOTE: using += is a pain because you have to account for the dangling comma...
                    output.push(keyStr + ":" + val);
                }
                return "{" + output.join(",") + "}";

            };

            _u.mixin = function (obj, props) {

                var extraNames, extraLen, empty = {};

                var __mixin = function (/*Object*/target, /*Object*/source) {
                    // summary:
                    //      Adds all properties and methods of source to target. This addition
                    //      is "prototype extension safe", so that instances of objects
                    //      will not pass along prototype defaults.
                    var name, s, i;
                    for (name in source) {
                        // the "tobj" condition avoid copying properties in "source"
                        // inherited from Object.prototype.  For example, if target has a custom
                        // toString() method, don't overwrite it with the toString() method
                        // that source inherited from Object.prototype
                        s = source[name];
                        if (!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))) {
                            target[name] = s;
                        }
                    }
                    // IE doesn't recognize some custom functions in for..in
                    if (extraLen && source) {
                        for (i = 0; i < extraLen; ++i) {
                            name = extraNames[i];
                            s = source[name];
                            if (!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))) {
                                target[name] = s;
                            }
                        }
                    }
                    return target; // Object
                };
                if (!obj) { obj = {}; }
                for (var i = 1, l = arguments.length; i < l; i++) {
                    __mixin(obj, arguments[i]);
                }
                return obj; // Object
            };

            // prepare a string for array of parameters
            var _getString = function (ar) {
                var res = "";
                // does ar have an array type?
                if (!_u.isArray(ar))
                    // convert to array
                    ar = [ar];
                _u.each(ar, function (par) {
                    // do we have a function as parameter?
                    if (_u.isFunction(par))
                        // run it and get string message
                        res += _getString(par());
                    else if (_u.isString(par))
                        res += par;
                    else {
                        if (par.toString) {
                            var s = par.toString();
                            res += s.slice(0, 8) != "[object " ? s : _u.toJson(par);
                        } else res += _u.toJson(par);
                    }
                });
                return res;
            }

            _u.addOnUnload = function (func) {
                _u.attachEvent(window, "unload", function () {
                    func.apply(window, arguments);
                });
            };

            _u.position = function (node, includeScroll) {
                var n;
                var isIE = parseFloat(navigator.appVersion.split("MSIE ")[1])
                var isQuirks = document.compatMode == "BackCompat";
                var _docScroll = function () {
                    var n = window;
                    return "pageXOffset" in n ? { x: window.pageXOffset, y: window.pageYOffset } :
                        (n = document.documentElement, window.clientHeight ? { x: window.scrollLeft, y: window.scrollTop } :
                        (n = document.body, { x: window.scrollLeft || 0, y: window.scrollTop || 0 }));
                };


                var _getIeDocumentElementOffset = function () {

                    var de = document.documentElement; // only deal with HTML element here, _abs handles body/quirks 

                    if (isIE < 8) {
                        var r = de.getBoundingClientRect(); // works well for IE6+
                        //console.debug('rect left,top = ' + r.left+','+r.top + ', html client left/top = ' + de.clientLeft+','+de.clientTop + ', rtl = ' + (!d._isBodyLtr()) + ', quirks = ' + d.isQuirks);
                        var l = r.left,
                        t = r.top;
                        if (isIE < 7) {
                            l += de.clientLeft; // scrollbar size in strict/RTL, or,
                            t += de.clientTop; // HTML border size in strict
                        }
                        return {
                            x: l < 0 ? 0 : l, // FRAME element border size can lead to inaccurate negative values
                            y: t < 0 ? 0 : t
                        };
                    } else {
                        return {
                            x: 0,
                            y: 0
                        };
                    }

                };

                var db = document.body, dh = db.parentNode, ret;
                //node = byId(node);
                if (node["getBoundingClientRect"]) {
                    // IE6+, FF3+, super-modern WebKit, and Opera 9.6+ all take this branch
                    ret = node.getBoundingClientRect();
                    ret = { x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top };
                    // On IE there's a 2px offset that we need to adjust for, see _getIeDocumentElementOffset()
                    var offset = _getIeDocumentElementOffset();

                    // fixes the position in IE, quirks mode
                    ret.x -= offset.x + (isQuirks ? db.clientLeft + db.offsetLeft : 0);
                    ret.y -= offset.y + (isQuirks ? db.clientTop + db.offsetTop : 0);


                }
                // account for document scrolling
                // if offsetParent is used, ret value already includes scroll position
                // so we may have to actually remove that value if !includeScroll
                if (includeScroll) {
                    var scroll = _docScroll();
                    ret.x += scroll.x;
                    ret.y += scroll.y;
                }

                return ret; // Object
            };

            // set of calls ordered for one queue
            _u.queue = function () {
                var resolved = false;
                var data;
                var list = [];
                var api = {};
                var goNext = function () {
                    if (list.length && resolved) {
                        resolved = false;
                        var res = (list.shift())(data);
                        if (res && res.then)
                            res.then(function (d) { api.resolve(d); });
                        else api.resolve(res);
                    }
                };
                // resolve queue
                api.resolve = function (res) {
                    resolved = true;
                    if ("undefined" != typeof res) data = res;
                    goNext();
                    return api;
                };
                // add subscription for next call
                api.then = function (callback) {
                    list[list.length] = callback;
                    goNext();
                    return api;
                };
                return api;
            };

            // stop event bubbling
            _u.stopBubbling = function () {
                if (window.event) {
                    window.event.cancelBubble = true;
                    window.event.returnValue = false;
                }
            };


            /************************************************************
            Subscription Helpers
            ************************************************************/
            //private functions
            var _subId = 0;
            // add subscription
            _u.subscribe = function (obj, key, handler, context, onunsubscribe) {
                if (!handler) throw new Error("Handler is not specified!");
                if (!context) context = window;
                if (typeof (handler) == "string") {
                    handler = _u.eval(handler);
                }
                var h = { id: _subId++, handler: handler, context: context };
                var ar = (key in obj) ? obj[key] : (obj[key] = []);
                _u.add(ar, h);
                return {
                    // function for unsubscribe
                    unsubscribe: function () {
                        if (key in obj) {
                            for (var i = 0; i < ar.length; i++) {
                                if (ar[i].id === h.id) {
                                    ar.splice(i, 1);
                                    if (onunsubscribe) onunsubscribe(obj, key);
                                    else if (obj[key].length == 0)
                                        delete obj[key];
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                };
            };
            _u.callSubscriptions = function (obj, key, args) {
                if (key in obj) {
                    var res;
                    var hlist = obj[key];
                    for (var i = 0; i < hlist.length; i++) {
                        var h = hlist[i];
                        var r = h.handler.apply(h.context, args);
                        // if there is any result
                        if ("undefined" != typeof r)
                            // story/update it for returning
                            res = r;
                    }
                    // if there is any result
                    if ("undefined" != typeof res)
                        // return it
                        return res;
                }
            };

            // attach event handler
            _u.attachEvent = function (node, event, f) {
                var active = true;
                var sav_f = f;
                // a function to do default detach
                var _detach = function () {
                    if (!active) throw new Error("Can't detach event more than one time!");
                    active = false;
                };
                // wrap the passed function
                f = function () {
                    return active ? sav_f.apply(this, arguments) : undefined;
                };
                if (node.addEventListener) {
                    node.addEventListener(event, f, false);
                    return {
                        detachEvent: function () {
                            _detach();
                            node.removeEventListener(event, f, false);
                        }
                    };
                }
                else {
                    node.attachEvent('on' + event, f);
                    return {
                        detachEvent: function () {
                            _detach();
                            node.detachEvent('on' + event, f);
                        }
                    };
                }
            };

            // timeout for querying data
            var _defaultTimeout = 2000;
            // timeout for registration
            var _registerTimeout = 9966;

            var _loggingEnabled = false;

            //version #
            var _version = "3.3.0";

            var _decodeEikonVersion = function () {
                var c = JET.ContainerDescription;
                var g = /EIKON([0-9]*)\.([0-9]*)\.([0-9]*),/i.exec(c.userAgent);
                if (g && g.length == 4) {
                    c.major = parseInt(g[1]);
                    c.minor = parseInt(g[2]);
                    c.build = parseInt(g[3]);
                }
            }

            //JET Properties exposed to the Container - beyond cannonical properties like 'title' and 'summary'
            var _properties = [];
            // component toolbar
            var _toolbar = null;            
            var _apptitlebar = null;
            var _appmenu = null;

            var _initializeQueue = null;

            // Public JET API and Properties
            var _default_properties = {
                // ID of the Component
                ID: null,
                // A title for representing the Component
                Title: null,
                // A summary for the Component
                Summary: null,
                // An URL to a page with help information for the Component
                HelpURL: null,
                // Service Access Point for the view - views.cp. for Views, eikon. for pointcarbon
                // is set via JET.init({SAP:"views.cp.", ...}); or JET.init({SAP:"pointcarbon.", ...}); for Views or PointCarbon 3rd party.
                SAP: null,
                // A sing that JET component is initialized
                Initialized: false,
                // A sing that JET component is loaded and connected to the Container
                Loaded: false,
                // Determines who gets input capture, if true, container will let component control input events (e.g. CTR+C, drop, etc)
                IsInputOwner: false,
                // Json structure with context of the Component
                Context: [],
                // Persist data json object for the Component
                Archive: [],
                // An URL for persist Data for the Component
                PersistURL: null,
                // Navigation Support flags
                NavigationSupport: null
            };
            // Public JET API and Properties
            var api = {};
            // add initial properties
            _u.mixin(api, _default_properties);

            // extend JET namespace
            api.extend = function (ver, namespace, declaration) {

                if (ver != _api_version)
                    throw new Error("Specified version (" + ver + ") is not supported. Expected: " + _api_version);
                if (!JET[namespace]) {
                    JET[namespace] = declaration(_u);
                } else _u.error("A plug-in with namespace " + namespace + " was loaded more than once!");
            };

            /*******************************************************************
            ENUMERATIONS
            *******************************************************************/

            //Navigation Support Flags
            api.NavigationSupport = {
                //Show Related/Trade menu in Toolbar
                ShowRelatedTradeInToolbar: 1,

                //Show Related/Trade menu in Right Click menu
                ShowRelatedTradeOnRightClick: 2,

                //App has the ‘read’ capabilities (can accept the linked in context from another app)
                CanPublishContext: 32,

                //App has the ‘write’ capabilities (can send out its context to another app)
                CanReceiveContext: 64
            };

            /*******************************************************************
            VIEW EVENTS
            These helpers send events to Container, from the View
            take a data object (json format) as input
            *******************************************************************/

            // get Node for an event
            function getNodeForAnEvent(ev) {
                var n = null;
                if (!ev) var ev = window.event;
                if (!ev) return null;
                if (ev.target) n = ev.target;
                else if (ev.srcElement) n = ev.srcElement;
                if (n.nodeType == 3) { // defeat Safari bug
                    n = n.parentNode;
                }

                return n;
            }

            // get context info
            function getLinkContextForNode(targetNode) {
                var res = {};
                if (targetNode) {
                    var n = targetNode;
                    if (n.nodeName == 'IMG') {
                        res.imgUrl = n.src;
                    }

                    while (n) {
                        if (n.nodeName == 'A') {
                            res.aUrl = n.href;
                            break;
                        }
                        var parent = n.parentNode;
                        if (parent && n != parent && !parent.documentElement) {
                            n = parent;
                        } else break;
                    }
                }

                return res;
            }

            // Directs Eikon to draw a context menu using context and/or menu items provided
            api.contextMenu = function (data) {
                var res = getLinkContextForNode(getNodeForAnEvent());
                _u.mixin(data, res);
                _u.debug("JET.contextMenu called. Data: ", data);
                _processEvent({ name: "onContextMenu", data: data });
                _u.stopBubbling();
            };

            // Notifies Eikon of a click on a contextual item
            api.click = function (data) {
                _u.debug("JET.onClick called. Data: ", data);
                _processEvent({ name: "onClick", data: data });
                _u.stopBubbling();
            };

            // Directs Eikon to navigate to a particular View or Component
            api.navigate = function (data) {
                _u.debug("JET.onNavigate called. Data: ", data);
                _processEvent({ name: "onNavigate", data: data });
                _u.stopBubbling();
            };

            // Notifies Eikon of the beginning of a drag operation
            api.dragStart = function (data) {
                _u.debug("JET.dragStart called. Data:", data);

                // set dnd data
                if (_dndManager) _dndManager.setDropData(data);

                //bug with onDragStart/transferdata right now, hack the data structure and send onContextDragStart instead
                var context = null;
                if (data.entities && data.entities.length) {
                    context = data.entities;
                }
                if (context != null) {
                    _processEvent({ name: "onContextDragStart", data: context });
                    _u.stopBubbling();
                    return true;
                }
                return false;
            };

            // Notifies Eikon of a context change in the View
            api.contextChange = function (data) {
                _u.debug("JET.contextChange called. Data: ", data);
                _processEvent({ name: "onContextChange", data: data });
            };

            // Directs Eikon to copy data provided
            api.copy = function (data) {
                _u.debug("JET.onCopy called. Data: ", data);
                _processEvent({ name: "onCopy", data: data });
            };

            // Directs Eikon to update command bars using menu items provided
            api.updateCommandBars = function (data) {
                _u.debug("JET.updateCommandBars called. Data: ", data);
                _processEvent({ name: "onUpdateCommandBars", data: data });
            };

            // Directs Eikon to store data provided
            //TODO - Add converting!
            api.saveToStore = function (data, category) {
                _u.debug("JET.saveToStore called. Data: ", data);
                var e = { name: "onSaveToStore", data: data };
                if (category) e.category = category;
                _processEvent(e);
            };

            // Directs Eikon to put data provided to system clipboard
            api.copyToClipboard = function (data) {
                _u.debug("JET.copyToClipboard called. Data: ", data);
                _processEvent({ name: "onCopyToClipboard", data: data });
            };

            // Directs Eikon to put data provided to Eikon log
            api.log = function (data) {
                _u.debug("JET.log called. Data: ", data);
                _processEvent({ name: "onLog", data: data });
            };

            api.loggingOptions = setLogOptions;

            // add more log functions
            var _logNames = ["debug", "information", "warning", "high", "critical"];
            _u.each(_logNames, function (name) {
                // add a subscription to the Container event
                api[name] = function (message) {
                    api.log({ messages: [{ severity: name, text: message }] })
                }
            });


            // Directs Eikon to hide its window
            api.hide = function () {
                _processEvent({ name: "onHide", data: null });
            };

            // Directs Eikon to show its window
            api.show = function () {
                _processEvent({ name: "onShow", data: null });
            };

            // Directs Eikon to flash its button in the system taskbar
            api.flash = function (data) {
                _container.processEvent({ name: "onFlash", xmlData: data });
            };

            // Directs Eikon to stop flashing its button in the system taskbar
            api.stopFlash = function () {
                _processEvent({ name: "onStopFlash", data: null });
            };

            // Directs Eikon to create a "toast" message UI.  Clicking on the message will invoke the callback handler specified in the ToastData object
            api.toast = function (data) {
                _processEvent({ name: "onToast", data: data });
            };

            // Directs Eikon to take a screenshot and send it to messenger
            api.screenshot = function () {
                _u.debug("JET.screenshot called.");
                JET.navigate({ url: "lac://TR.Screenshot.PROGID", name: "Eikon Library Object" });
                _u.stopBubbling();
            };

            // Directs Eikon to construct a mail with provided data
            api.sendByMail = function (data) {
                _u.debug("JET.sendByMail called.");
                _container.processEvent({ name: "onSendByMail", xmlData: data })
            };

            // Directs Eikon to construct a mail with provided data
            api.sendToMessenger = function (data) {
                _u.debug("JET.sendToMessenger called.");
                _container.processEvent({ name: "onsendToMessenger", xmlData: data })
            };

            // Directs Eikon to unregister the JET component from its container
            api.unload = function () {

                // call unload callbacks
                _callOnUnloadCallbacks();
                // clean up initial properties
                delete _default_properties.Archive; // Don't clear Archive
                _u.mixin(api, _default_properties);
                // delete container type
                delete api.ContainerType;
                // delete ContainerDescription
                delete JET.ContainerDescription;
                // unsubscribe all channels
                api.unsubscribeAll();
                _unsubscribeAllHandlers();
                // notify desktop container
                _processEvent({ name: "onUnload", data: _getArchiveData() });
                // clean container
                container = null;
            };

            // Provide Eikon with persist data update
            api.archive = function () {
                _processEvent({ name: "persistdata", data: _getArchiveData() });
            };

            // Log in Eikon App Usage
            api.appHit = function (appName, subProduct, feature) {
                var error = function (varname, varlen) { throw new Error(varname + " should be a string not exceeding " + varlen + " chars"); };
                if (!_u.isString(appName, "string") || !appName.trim() || appName.length > 40) error("appName", 40);
                if (!_u.isString(subProduct, "string") || !subProduct.trim() || subProduct.length > 40) error("subProduct", 40);
                if (feature) {
                    if (!_u.isString(feature, "string") || !feature.trim() || feature.length > 40) error("feature", 40);
                } else feature = "";

                JET.publish("/desktop/usagelog", JSON.stringify({ "AppHitsCode": appName.trim() + "@" + subProduct.trim(), "Feature": feature.trim() }));
            };

            // Subscribe to Active Symbol channel
            api.subscribeActiveSymbol = function (handler) {
                JET.subscribe("/eikon/activeSymbol", function (xmlData) {
                    // convert from XML to JSON
                    var entities = JET.Convert.FromContainer.Result("ActiveSymbol", xmlData);
                    handler.call(window, entities[0]);
                });
            };

            // Unsubscribe to Active Symbol channel
            api.unsubscribeActiveSymbol = function () {
                JET.unsubscribe("/eikon/activeSymbol");
            };


            /*************************************************
            Working with properties
            **************************************************/

            // Gets the value for a View property exposed to Eikon
            /*api.getProperty = function (name) {
            return _properties[name];
            };*/

            // Sets properties for the View to expose to Eikon
            /*api.setProperties = function (data) {
            for (var i = 0; i < data.properties.length; i++) {
            var p = data.properties[i];
            //clean up types...
            if (p.type == "string" || p.type == "number" || p.type == "data" || p.type == "boolean")
            p.type = ("xs:" + p.type);
            _properties[p.name] = p;
            }
    
            //_u.trace("event = onPropertyChange, data= ", data);
            _processEvent({ name: "onPropertyChange", data: data });
            };*/

            /****************************************************************
            VIEW ACTIONS
            These call actions on the container
            use more "strongly typed" signatures than View Events
            ****************************************************************/

            //collection of subscription handlers (for pub/sub)
            var _subHandlers = {};

            // Publishes data to a channel on Eikon’s pub/sub system
            api.publish = function (channel, data) {
                //_u.trace("event name = 'Publish', channel = ", channel, ", data = ", data);
                _processEvent({ name: "Publish", data: data, channel: channel });
            };

            //route an incoming "Publish" event to correct handler
            var _publishHandler = function (eventObj) {
                var c = eventObj.channel;
                var res = _u.callSubscriptions(_subHandlers, c, [eventObj.data, c]);
                return "undefined" != typeof res ? res : false;
            };

            // Subscribes a handler to a channel on Eikon’s pub/sub system
            api.subscribe = function (channel, handler, context) {
                var res = _u.subscribe(_subHandlers, channel, handler, context, function (obj, key) {
                    if (key in obj) {
                        if (obj[key].length == 0) {
                            //_u.trace("event name = 'Unsubscribe', channel = ", channel);
                            _processEvent({ name: "Unsubscribe", data: "", channel: key });
                            delete obj[key];
                        }
                    } else _u.warn("Subscription was already unsubscribed for " + key);
                });
                // call subscribe only for the 1st internal subscription
                if (_subHandlers[channel].length == 1) {
                    //_u.trace("event name = 'Subscribe', channel = ", channel);
                    _processEvent({ name: "Subscribe", data: "", channel: channel });
                }
                return res;
            };

            // Unsubscribes from all channel on Eikon’s pub/sub system
            api.unsubscribeAll = function () {
                for (var name in _subHandlers) {
                    delete _subHandlers[name];
                    //_u.trace("event name = 'Unsubscribe', channel = ", channel);
                    _processEvent({ name: "Unsubscribe", data: "", channel: name });
                }
            };

            // Unsubscribes from a channel on Eikon’s pub/sub system
            api.unsubscribe = function (channelName) {
                delete _subHandlers[channelName];
                _processEvent({ name: "Unsubscribe", data: "", channel: channelName });
            };

            /*******************************************************************
            CONTAINER EVENTS
            *******************************************************************/

            // collection of arrays of event handlers
            var _eventHandlers = {};

            // add new event handler to registered list
            var _addEventHandler = function (name, handler, limitScopeToEventData) {
                handler = typeof (handler) == "string" ? _u.eval(handler) : handler;
                return _u.subscribe(_eventHandlers, name, limitScopeToEventData ? function (event) { return handler.call(window, event.data); } : handler);
            };

            var _callEventHandler = function (eventObj) {
                var res = _u.callSubscriptions(_eventHandlers, eventObj.name, [eventObj]);
                return "undefined" != typeof res ? res : false;
            };

            //handle 'processEvent' calls from the container, route to the appropriate handler - set directly on the JET object
            var _onContainerEvent = function (eventObj) {
                eventObj = JET.Convert.FromContainer.Message(eventObj);
                _u.debug("Container event ", eventObj.name);
                return _callEventHandler(eventObj);
            };

            var _unsubscribeAllHandlers = function () {
                _eventHandlers = {};
            }

            /*******************************************************************
            CONTAINER COMMANDS
            *******************************************************************/

            /* handlers for onCommand events */
            var _commandHandlers = {};

            var _addCommandHandler = function (id, handler) {
                _commandHandlers[id] = handler;
            };

            var _onCommand = function (data) {
                var h = _commandHandlers[data.id];
                if (h) {
                    if (typeof (h) == "string") {
                        h = _u.eval(h);
                    }
                    h.call(window, data.value);
                }
            };

            /*********************************************************************
            Container Event Handlers
            add handlers with your own logic
            *********************************************************************/

            // add a subscription functions for predefined Container events to API
            var _eventNames = ["onSendObject", "onContextChange", "onPropertyChange", "onCommand", "onDragEnter", "onDragOver", "onDragLeave", "onDrop", "onPaste", "onActivate", "onDeactivate"/*, "onBeforeStart", "onLoad"*/];
            _u.each(_eventNames, function (name) {
                // add a subscription to the Container event
                api[name] = function (handler) {
                    return _addEventHandler(name, handler, true);
                }
            });

            // callback functions are delayed until JET.Loaded is set to true
            var _onLoadedCallbacks = [];
            // set JET.Loaded to true and call all the registered callback functions
            var _setLoadedAndCallOnLoadCallbacks = function () {
                JET.Loaded = true;
                _u.each(_onLoadedCallbacks, function (f) { f.call(window); })
                _onLoadedCallbacks = [];
            }
            // refister a callback function to be called just before JET initialization starts
            api.onBeforeStart = function (handler) {
                return _addEventHandler("onBeforeStart", handler, true);
            }
            // postpone calling of the specified function until JET.Loaded is set
            api.onLoad = function (handler) {
                if (JET.Loaded)
                    handler.call(window);
                else _u.add(_onLoadedCallbacks, handler);
            }
            // callback functions are delayed until JET unloading start
            var _onUnloadCallbacks = [];
            // call registered handler for JET.unload
            var _callOnUnloadCallbacks = function () {
                _u.each(_onUnloadCallbacks, function (f) { f.call(window); })
                _onUnloadCallbacks = [];
            }
            // postpone calling of the specified function until JET is jest before unloaded
            api.onUnload = function (handler) {
                _u.add(_onUnloadCallbacks, handler);
            }


            /*******************************************************************
            VIEW REQUESTS
            These synchronously require data from Container
            *******************************************************************/
            // get properties from container by sending sync request
            api.getProperties = function () {
                _u.debug("JET.getProperties called.");
                var res = _getDataSync("description");
                _u.debug("JET.getProperties call result: ", res);
                return res;
            };

            // get persist data from container by sending sync request
            api.getSavedState = function () {
                _u.debug("JET.getSavedState called.");
                var res = _getDataSync("persistdata");
                _u.debug("JET.getSavedState call result: ", res);
                return res;
            };

            // get paste data from container by sending sync request
            api.getPasteData = function () {
                _u.debug("JET.getPasteData called.");
                var res = _getDataSync("getPasteData");
                _u.debug("JET.getPasteData call result: ", res);
                return res;
            };

            // get a sing from container by sending sync request that the current view is active
            api.isActive = function () {
                _u.debug("JET.isActive called.");
                var res = _getDataSync("isActive", "Boolean");
                if ("boolean" != typeof res)
                    throw new Error("Invalid data type returned from container: " + typeof res);
                _u.debug("JET.isActive call result: ", res);
                return res;
            };

            // get a sing from container by sending sync request that the current view has focus
            api.hasFocus = function () {
                _u.debug("JET.hasFocus called.");
                var res = _getDataSync("hasFocus");
                if ("boolean" != typeof res)
                    throw new Error("Invalid data type returned from container: " + typeof res);
                _u.debug("JET.hasFocus call result: ", res);
                return res;
            };

            // get json object with available user information
            api.getUserInfo = function () {
                _u.debug("JET.getUserInfo called.");
                var res = _getDataSync("UserInfo");
                _u.debug("JET.getUserInfo call result: ", res);
                return res;
            }

            // get an XML from the container containing the active symbol
            api.getActiveSymbol = function () {
                _u.debug("JET.getActiveSymbol called.");
                var res = _getDataSync("ActiveSymbol");
                _u.debug("JET.getActiveSymbol call result: ", res[0]);
                return res[0];
            }

            // get clipboard data from container by sending sync request
            api.getClipboardData = function () {
                _u.debug("JET.getClipboardData called.");
                var res = _getDataSync("ClipboardData");
                _u.debug("JET.getClipboardData call result: ", res);
                return res;
            };

            /*******************************************************************
            CONTAINER REQUESTS
            *******************************************************************/

            /********************************************************************
            handling for Container events/requests
            ********************************************************************/


            // assemble the JET properties
            var _getComponentProperties = function () {
                var data = [];
                for (var i = 0; i < _properties.length; i++) {
                    var p = _properties[i];
                    var o = {};
                    o["type"] = p.type || "xs:string";
                    o["access"] = p.access || "rw";

                    if (p.name) {
                        o[p.name] = p.text || p.value || "";
                    }
                    else {
                        for (var attr in p) {
                            if (p.hasOwnProperty(attr)) {
                                o[attr] = p[attr];
                            }
                        }
                    }

                    data.push(o);
                }

                //add cannonical Properties to 'property bag'
                data.push({ type: "xs:string", access: "ro", Title: JET.Title || "" });
                data.push({ type: "xs:string", access: "ro", Summary: JET.Summary || "" });
                //add default properties...
                data.push({ type: "xs:string", access: "rw", NavigationSupport: JET.NavigationSupport || "" });

                return data;
            };
            // assemble the JET description
            var _getComponentDescription = function () {
                var data = { properties: _getComponentProperties(), entities: JET.Context };

                if (_toolbar) {
                    data["toolbar"] = _toolbar;
                }
                                
                if (_apptitlebar) {
                    data["apptitlebar"] = _apptitlebar;
                }
                
                if (_appmenu) {
                    data["appmenu"] = _appmenu;
                }
                return data;
            };
            // replace url with Service Access Point value
            var _getPersistCpUrl = function (url, cpUrl) {
                return url.replace(/^(?:[^:\/\\?#]+:(?=\/\/))?(?:\/\/)?(?:[^:\/\\?#]*(?::[^\/\\?#]*)?)?/, "cpurl://" + cpUrl);
            };
            var _getArchiveData = function () {
                var url = JET.PersistURL || document.location.href;
                var data = { url: url, data: [] };
                if (JET.SAP) {
                    data.cpurl = _getPersistCpUrl(url, JET.SAP);
                }
                if (JET.Archive)
                    data.data = JET.Archive;
                //to do, remove this "PData" wrapper once fix is done on container side!
                if (JET.Context != null && JET.Context.length > 0)
                    _u.add(data.data, { name: "context", value: "<![CDATA[" + JET.Convert.ToContainer.Type("ContextData", JET.Context) + "\]\]\>" });

                return data;
            };
            // assemble the inputOwner answer
            var _getInputOwner = function () {
                var r = JET.IsInputOwner ? "component" : "container";
                return r;
            };

            // all possible data providers
            var _dataProviders = {
                // Returns a copy of the current context (JET.ContextData) of the Component to the Container
                context: function () { return JET.Context; },
                // returns a copy of Component description (Description)
                description: function () { return _getComponentDescription(); },
                // returns a copy of the components current state (ArchiveData) 
                persistdata: function () { return _getArchiveData(); },
                // returns current values (Properties) of all the Component properties
                properties: function () { return _getComponentProperties(); },
                // returns a copy of the help URL that was provided in the HelpURL property
                helpurl: function () { return JET.HelpURL; },
                // returns who owns of user input - either component or container
                inputowner: function () { return _getInputOwner(); }
            };

            var _callDataProvider = function (requestObj) {
                var h = _dataProviders[requestObj.name];

                if (h != null) {

                    var r = h.call(this, requestObj.xmlData);
                    return JET.Convert.ToContainer.Result(requestObj.name, r);
                }
                else
                    return null;
            };

            //handle 'getData' calls from the container, route to the appropriate handler
            var _onContainerGetData = function (requestObj) {
                _u.trace("Data request.  Name: ", requestObj.name);
                var result = _callDataProvider(requestObj);
                _u.trace("Data request.  Name: ", requestObj.name, " Result:", result);
                return result;
            };

            /*************************************************************************************
            JET.Social Extension
            namespace for collaboration specific APIs
            *************************************************************************************/
            api.Social = {};

            /***************************************
            Directs Eikon to open a dialog for authoring a Commentary on the View
            Uses the ArchiveData, and Context for the View to pre-populate the commentary
            ***************************************/
            api.Social.addCommentary = function () {
                _u.debug("JET.Social.addCommentary called.")
                var data = { mouse: {} };
                data.entities = JET.Context;
                data.archive = _getArchiveData();
                _processEvent({ name: 'onAddCommentary', data: data });
            };

            /*********************************************************************
            BELOW ARE HIDDEN HELPERS
            *********************************************************************/

            /************************************************************** 
            New Drag/Drop Handling 
    
            for now, just handling inputs
    
            todo: add support for Nodes having an onDrop handler added through JETOnDrop
            for example:
    
            <div JETOnDrop="handleMyDrop();">
            **************************************************************/

            //drag state variables:
            var _dragData = null;
            var _dropLocations = [];

            // Drag & Drop for chrome!
            var _dndManager = null;
            var _initChromeDnD = function () {
                "use strict";

                var _dropData = null;
                var _dndState = "noDragStarted"; //["noDragStarted","dataAvailable","noValidDragData","pending","getDropDataFailed"]
                var _dropEffect = "copy";

                var _manager = {
                    setDropData: function (data) {
                        _dropData = data;
                        _dndState = "dataAvailable";
                    }
                };

                window.setDragData = function (data) {
                    _dropData = JET.Convert.FromContainer.Result("getDropData", data);
                    _dndState = "dataAvailable";
                }

                // Methods to fire actual JET events.
                function fireJETDragEnter(dropData, coords) {
                    var data = dropData;
                    data.mouse = coords;
                    _callEventHandler({ name: "onDragEnter", data: data });
                }

                function fireJETDragOver(dropData, coords) {
                    _callEventHandler({ name: "onDragOver", data: { x: coords.clientX, y: coords.clientY } });
                }

                function fireJETDragLeave(dropData) {
                    _callEventHandler({ name: "onDragLeave", data: null });
                }

                function fireJETContextChanged(dropData) {
                    _callEventHandler({ name: "onContextChange", data: dropData });
                }

                function fireJETDrop(dropData, coords) {
                    var data = dropData;
                    data.mouse = coords;
                    _callEventHandler({ name: "onDrop", data: data });
                    var contextData = extractContextData(dropData);

                    if (contextData) {
                        fireJETContextChanged(contextData);
                    }
                }

                // get drop data
                function getDropData(callback, errorCallback, coords) {
                    _getData({
                        name: "getDropData", xmlData: coords.eventData, async:
                        function (data) {
                            if (typeof (data) !== 'undefined' && data != null) {
                                callback(data);
                            } else {
                                errorCallback("null or undefinded received");
                            }
                        }
                    });
                    /*// Fake data for testing
                    var fakeData = "<TransferData screenx=\"111\" screeny=\"111\" clientx=\"111\" clienty=\"111\">\r\n"
                    + "<Data type=\"ContextData\"><Entities>\r\n"
                    + "<Entity datasource=\"Q\"><Identifier namespace=\"RIC\">.DJI</Identifier></Entity></Entities></Data>\r\n"
                    + "</TransferData>";
                    setTimeout(callback(fakeData), 2000);*/
                }

                function callResetDragDrop() {
                    if (window.externalHost != null) _getData({ name: "resetDragDrop", xmlData: null, async: function () { } });
                }

                function callDragEnter(coords) {
                    if (window.externalHost != null) _getData({ name: "windowDragEnter", xmlData: coords.eventData, async: function () { } });
                }

                function callDragLeave(coords) {
                    if (window.externalHost != null) _getData({ name: "windowDragLeave", xmlData: coords.eventData, async: function () { } });
                }

                function callCancelDragDrop(coords) {
                    if (window.externalHost != null) _getData({ name: "cancelDragDrop", xmlData: coords.eventData, async: function () { } });
                }

                // Implementation.

                // Several functions to manipulate XML data.

                function extractContextData(data) {
                    if (data === null) {
                        return null;
                    }

                    return data.entities;
                }

                // DOM Events handling and state managing.

                var dataRequestID = 0;
                var enterLeaveCounter = 0;

                function getCoords(e) {
                    return { clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, eventData: e.screenX + "," + e.screenY };
                }

                document.addEventListener("dragstart", function (e) {
                    // If drop is started inside the window, jetComponent should call _manager.setDropData() 
                    // and pass drop data from DOM node (if it is not done this already)

                    // DnD state is set to "noValidDragData" and will remain in this state until it will be set by the jetComponent (if there is some JET info in the node dragged) 
                    // or it will remain in this state till the end of the drag operation
                    if (_dndState !== "dataAvailable") {
                        _dndState = "noValidDragData";
                    }
                });

                document.addEventListener("dragenter", function (e) {
                    if (_dndState === "noDragStarted") {

                        // If we don't have drop data already, then
                        // drag'n'drop is started outside of the window.
                        // Send async request to container to obtain the drop data.

                        _dndState = "pending";

                        // Requests counter is used to avoid race conditions 
                        // (when response received from a previous request)
                        dataRequestID = dataRequestID + 1;
                        var rqID = dataRequestID;

                        var coords = getCoords(e);

                        if (window.externalHost != null)
                            getDropData(
                        function (data) {
                            if (_dndState === "pending" && rqID === dataRequestID) {
                                _manager.setDropData(data);
                                _dndState = "dataAvailable";

                                // Actual drag enter is fired here, after some delay caused by async operation
                                fireJETDragEnter(data, coords);
                            }
                        },
                        function (error) {
                            _u.error("Error getting drop data: " + error);
                            _dndState = "getDropDataFailed";
                        },
                        getCoords(e)
                    );
                    } else if (_dndState === "dataAvailable" && enterLeaveCounter === 0) {
                        // Drag'n'drop is started inside the window.
                        // The drop data is already set by the jetComponent. 
                        // Fire dragEnter immidiately (but only once)
                        fireJETDragEnter(_dropData, getCoords(e));
                    }

                    if (enterLeaveCounter === 0) {
                        callDragEnter(getCoords(e));
                    }

                    enterLeaveCounter++;

                    if (_dndState === "dataAvailable") {
                        (e.dataTransfer || e.fakeDataTransfer).dropEffect = _dropEffect;
                    }
                    else {
                        (e.dataTransfer || e.fakeDataTransfer).dropEffect = "none";
                    }

                    e.preventDefault();
                });

                document.addEventListener("dragleave", function (e) {
                    enterLeaveCounter--;

                    if (enterLeaveCounter === 0) {
                        finishDrag(true, e);
                    }

                    e.preventDefault();
                });


                document.addEventListener("drop", function (e) {
                    enterLeaveCounter = 0;

                    if (_dndState === "dataAvailable") {
                        fireJETDrop(_dropData, getCoords(e));
                    }

                    finishDrag(false, e);

                    e.preventDefault();
                });

                document.addEventListener("dragover", function (e) {
                    if (_dndState === "dataAvailable") {
                        (e.dataTransfer || e.fakeDataTransfer).dropEffect = _dropEffect;
                        fireJETDragOver(_dropData, getCoords(e));
                    } else {
                        (e.dataTransfer || e.fakeDataTransfer).dropEffect = "none";
                    }
                    e.preventDefault();
                });

                function finishDrag(dropAborted, e) {
                    if (dropAborted && _dndState === "dataAvailable") {
                        fireJETDragLeave();
                        callDragLeave(getCoords(e));
                    }

                    if (!dropAborted) {
                        callResetDragDrop(getCoords(e));
                    } else {
                        callCancelDragDrop(getCoords(e));
                    }
                    _dropData = null;
                    _dndState = "noDragStarted";
                }

                return _manager;
            };

            /****************************************************************************************
            Private Properties and Methods
            ***********************************************************************************/

            var _cloneEvent = function (e) {
                var e1 = { name: e.name };
                if (typeof e.channel != "undefined") e1.channel = e.channel;
                // TODO - find use-cases!
                //if (typeof e.category != "undefined") e1.category = e.category;
                if (typeof e.xmlData != "undefined") e1.xmlData = e.xmlData;
                if (typeof e.data != "undefined") e1.data = e.data;
                return e1;
            };

            /****************************************************************************
            Utilities
            ****************************************************************************/

            /*********************************************************************
            Container Interface Override
            *********************************************************************/

            //reference to Eikon container
            var _container = null;

            var _chkContainer = function () {
                if (!_container)
                    throw new Error("No container found!");
            }

            var _wrapAsync = function (msg) {
                if (msg && msg.async) {
                    var oldAsync = msg.async;
                    msg.async = function (res) { oldAsync(res ? JET.Convert.FromContainer.Result(msg.name, res) : res); };
                }
            }

            var _getData = function (msg) {
                _chkContainer();
                _wrapAsync(msg);
                var res = _container.getData(msg);
                // convert data to needed format
                if (res) res = JET.Convert.FromContainer.Result(msg.name, res);
                return res;
            };

            var _processEvent = function (msg) {
                _chkContainer();
                _wrapAsync(msg);
                var s = JET.Convert.ToContainer.Message(_addEventCommandHandlers(msg));
                _container.processEvent(s);
            };

            // does container support synchronous getting data
            var _isSyncDataRequestAllowed = function () {
                return JET.ContainerType == "Sync" || JET.ContainerType == "Async" && JET.ContainerDescription && JET.ContainerDescription.capabilities && "httpGetData" in JET.ContainerDescription.capabilities;
            };

            // be sure container supports synchronous getting data
            var _checkSyncDataRequestAllowed = function () {
                if (!_isSyncDataRequestAllowed())
                    throw new Error("Synchronous requests are not supported by the Container!");
            };

            // get data synchronously
            var _getDataSync = function (name) {
                _checkSyncDataRequestAllowed();
                var res = _getData({ name: name, xmlData: "" });
                if ("undefined" == typeof res)
                    throw new Error("Synchronous requests are not supported by the Container!");
                return res;
            };

            var _addEventCommandHandlers = function (data) {
                var _addItemHandlers = function (it) {
                    if (it.item) {
                        switch (it.item) {
                            case "SplitButton":
                                if (it.items) {
                                    for (var i = 0; i < it.items.length; i++)
                                        _addItemHandlers(it.items[i]);
                                }
                                break;
                            case "Menu":
                                if (it.items) {
                                    for (var i = 0; i < it.items.length; i++)
                                        _addItemHandlers(it.items[i]);
                                }
                                return;
                            case "Print":
                                if (it.handler)
                                    _addCommandHandler("PRINT", it.handler);
                                return;
                        }
                    }
                    if (typeof (it.id) != "undefined" && it.handler) {
                        _addCommandHandler(it.id, it.handler);
                    }
                };
                var _addBarHandlers = function (bar) {
                    if (bar.commandBars) {
                        for (var i = 0; i < bar.commandBars.length; i++) {
                            var b = bar.commandBars[i];
                            if (b.items) {
                                for (var n = 0; n < b.items.length; n++) {
                                    _addItemHandlers(b.items[n]);
                                }
                            }
                        }
                    }
                };
                switch (data.name) {
                    case "onContextMenu":
                        if (data.data.menu)
                            _addBarHandlers(data.data.menu);
                        break;
                    case "onToast":
                        _addItemHandlers(data.data);
                        break;
                    case "onLoad":
                        if (data.data.toolbar)
                            _addBarHandlers(data.data.toolbar);
                        if (data.data.serviceMenu)
                            _addBarHandlers(data.data.serviceMenu);
                        if (data.data.apptitlebar)
                            _addBarHandlers(data.data.apptitlebar);
                        if (data.data.appmenu)
                            _addBarHandlers(data.data.appmenu);                         
                        break;
                }
                return data;
            };

            //_getSession
            var _getSession = function () {
                return {
                    version: _version,
                    id: JET.ID
                };
            };

            //init
            //arguments:initialization object - use this to quickly set properties on the JET object
            //returns data structure w/container description and
            api.init = function (initObj) {

                _initializeQueue = _u.queue().resolve();
                var props = null;

                if (window.DOMParser) {
                    JET.DOMParser = new DOMParser();
                }
                else { // Internet Explorer
                    JET.XMLDOM = new ActiveXObject("Microsoft.XMLDOM");
                }

                if (initObj != null) {
                    //separate any properties out to mixin separatly...
                    if (initObj.Properties != null) {
                        var props = initObj.Properties;
                        delete initObj.Properties;
                        _properties = props;
                    }

                    if (initObj.Toolbar != null) {
                        _toolbar = initObj.Toolbar;
                        delete initObj.Toolbar;
                    }
                                        
                    if (initObj.AppTitleBar != null) {
                        _apptitlebar = initObj.AppTitleBar;
                        delete initObj.AppTitleBar
                    }
                    
                    if (initObj.AppMenu != null) {
                        _appmenu = initObj.AppMenu;
                        delete initObj.AppMenu
                    }

                    //If NavigationSupport property is not passed in, default to "2" (backward compatible)
                    //which is for turning on only showing Related/Trade menu at right click
                    if (initObj.NavigationSupport === undefined || initObj.NavigationSupport === null) {
                        initObj.NavigationSupport = "2";
                    } else {
                        if (!_u.isFlagOn(initObj.NavigationSupport, JET.NavigationSupport.CanPublishContext) &&
                            !_u.isFlagOn(initObj.NavigationSupport, JET.NavigationSupport.CanReceiveContext)) {
                            //Set special flag to Disable Color Icon if the app doesn't support both
                            //Publbishing and Receiving
                            initObj.NavigationSupport |= 128;
                        }
                        initObj.NavigationSupport = initObj.NavigationSupport.toString();
                    }

                    //mixin initObj with JET
                    _u.mixin(JET, initObj);
                }

                _addEventHandler("onCommand", _onCommand, true);
                _addEventHandler("Publish", _publishHandler);
                _addEventHandler("SendAddCommentary", JET.Social.addCommentary);
                //call onBeforeStart
                _callEventHandler({ name: "onBeforeStart" });

                var defInitialized = _u.queue();

                _initializeQueue.then(function () {
                    var c = null;
                    var jsAsyncContainer = "registerWithAsyncCCFContainer" in window;
                    if (jsAsyncContainer || window.externalHost != null || ("registerWithJET" in window) || ("eikonLinkReady" in window)) {
                        // register chrome support
                        var asyncContainer = { postMessage: function (o) { _u.warn("Jet not loaded, skipping " + o) } };
                        //if (!jsAsyncContainer) {
                        _dndManager = _initChromeDnD();
                        //}
                        JET.ContainerType = "Async";
                        c = function () {
                            var uid = 0;
                            var pm = function (m) {
                                var msg = _u.toJson(m);
                                _u.trace("To container: ", msg);

                                // process message
                                asyncContainer.postMessage(msg);
                            };
                            var rm = function () {
                                var l = {};
                                return {
                                    register: function (id, timeout) {
                                        //resolve(id, null);
                                        var it = {
                                            d: _u.queue(),
                                            t: setTimeout(function () {
                                                if (id in l) {
                                                    it.d.resolve(null);
                                                    delete l[id];
                                                }
                                            }, timeout || _defaultTimeout)
                                        };
                                        l[id] = it;
                                        return it.d;
                                    },
                                    resolve: function (id, res) {
                                        var r = id in l;
                                        if (r) {
                                            var it = l[id];
                                            clearTimeout(it.t);
                                            it.d.resolve(res);
                                            delete l[id];
                                        }
                                        return r;
                                    }
                                }
                            }();
                            var _sendAsync = function (r, timeout) {
                                var d = rm.register(r.id = ("request" + uid++), timeout);
                                pm(r);
                                return d;
                            };
                            var _sendDataSync = jsAsyncContainer ?
                            function (r) {
                                var r1 = { name: r.name, data: r.xmlData, method: "getData" };
                                _u.trace("Calling asyncContainer.getDataSync. Data: ", r1);
                                var result = asyncContainer.getDataSync(r1);
                                _u.trace("asyncContainer.getDataSync call result: ", result);
                                return result;
                            } :
                            function (r) {
                                if (_isSyncDataRequestAllowed()) {

                                    var r1 = { name: r.name, data: r.xmlData, method: "getData" };
                                    _u.trace("Sending a request to container url for data: ", r1);

                                    var xhr = new XMLHttpRequest();
                                    xhr.open('POST', JET.ContainerDescription.capabilities.httpGetData.value, false);
                                    var sentTxt = _u.toJson(r1);
                                    xhr.send("GUID=" + JET.ContainerDescription.GUID + "&METHOD=getData&CTXTLEN=" + sentTxt.length + "&CTXT=" + sentTxt); // string to send
                                    var res = xhr.responseText;
                                    _u.trace("Got an answer with status: " + xhr.status + " for httpRequest. Result: ", res);
                                    return res;
                                }
                            };
                            var fc = function (r) {
                                var r1 = _u.eval(r);

                                _u.trace("From container: ", r1);
                                return r1;
                            }
                            var onGetData = function (r) {
                                var r1 = fc(r);
                                if (!r1.name) {
                                    _u.error("No name in message!");
                                    return null;
                                }
                                var res = _onContainerGetData(r1);
                                return res;
                            };
                            var onProcessEvent = function (e) {
                                var e1 = fc(e);
                                if (!e1.name) _u.error("No name in message!");
                                else _onContainerEvent(e1);
                            };
                            var onMessage = function (m) {
                                var msg = fc(m.data);

                                if (!msg.method && msg.name) {
                                    msg.method = "undefined" == typeof msg.id ? "processEvent" : "getData";
                                }

                                if (msg.method) {
                                    var res;
                                    switch (msg.method.toLowerCase()) {
                                        case "getdata":
                                            // got a request
                                            res = _onContainerGetData(msg);
                                            break;
                                        case "processevent":
                                            // got an event
                                            res = _onContainerEvent(msg);
                                            break;
                                        default:
                                            throw new Error("Unsupported method: ", msg.method);
                                    }
                                    if (msg.id != undefined) {
                                        var m1 = { id: msg.id, xmlData: res };
                                        pm(m1);
                                    }
                                }
                                else if (msg.id != null) {
                                    if (!rm.resolve(msg.id, msg.xmlData))
                                        _u.warn("Got outdated response: ", msg);
                                }
                            };

                            var initContainer = function (xmlData) {
                                JET.Initialized = true;

                                if (xmlData != null) {
                                    JET.ContainerDescription = JET.Convert.FromContainer.Type("Description", xmlData);
                                    _decodeEikonVersion();

                                    _u.info("Container Description: ", JET.ContainerDescription);
                                }

                                if (JET.ContainerDescription && JET.ContainerDescription.plugin) {
                                    var initPlugin = function () {
                                        
                                        // poor's man cleanup
                                        if (container != null) container = null;
                                        
                                        var plugin = null;
                                        if (window.EikonJET != null) {
                                            container = window.EikonJET;
                                            _u.trace("Container is EikonJET");
                                        } else {
                                            plugin = document.createElement("embed");
                                            plugin.type = "application/x-jetPlugin";
                                            plugin.width = 0;
                                            plugin.height = 0;
                                            plugin.id = "jetPlugin";
                                            document.body.appendChild(plugin);
                                            
                                            if (plugin != null) container = plugin.jetPlugin();
                                        }
                                        
                                        if (container != null) {
                                            container.onMessage(onProcessEvent);
                                            container.onRequest(onGetData);
                                            container.init(JET.ContainerDescription.plugin.channel);
                                        }

                                        plugin = null;
                                    }

                                    initPlugin();

                                    var verrue = function (fn) {
                                        try { fn.apply(); }
                                        catch (e) {
                                            if (e.message == "NPObject deleted") {
                                                initPlugin();
                                                fn.apply();
                                            } else throw e;
                                        }
                                    }

                                    if (container != null) {
                                        // CEF plugin detected
                                        JET.ContainerType = "Sync";
                                        _container.getData = function (r) {
                                            var r1 = { name: r.name, data: r.xmlData, method: "getData" };
                                            var msg = _u.toJson(r1);
                                            _u.trace("Data request. Name: ", r.name);
                                            var res = null;
                                            try {
                                                verrue(function () {
                                                    res = container.send(msg);
                                                });
                                            } catch (e) {
                                                _u.error(function () { return 'getData({"name":"' + r.name + '"} throws Exception : "' + e.message + '"' });
                                            }
                                            _u.trace("Data request. Name: ", r.name, " Result: ", res);
                                            if (r.async) {
                                                r.async(res);
                                            }
                                            return res;
                                        }
                                        _container.processEvent = function (e) {
                                            var m1 = { name: e.name, data: e.xmlData, method: "processEvent" };
                                            if (e.channel) m1.channel = e.channel;
                                            var msg = _u.toJson(m1);
                                            _u.trace("To container: ", msg);
                                            verrue(function () {
                                                container.post(msg);
                                            });
                                        }
                                    }
                                    else JET.Initialized = false;
                                }

                                defInitialized.resolve();

                                _u.info("JETComponent register with container finished");
                            };
                            return {
                                init: function () {
                                    var reqObj = { xmlData: JET.Convert.ToContainer.Type("Session", _getSession()), method: "registerWithCCF" };
                                    var _registerWithJET = function () {
                                        window.onCEFChannel = initContainer;
                                        window.registerWithJET(_u.toJson(reqObj).replace(/\\/g, '\\\\\\'));
                                    }
                                    if ("registerWithJET" in window) {
                                        _registerWithJET();
                                    }
                                    else if ("eikonLinkReady" in window) {
                                        window.eikonLinkReady ? _registerWithJET() : (window.onEikonLinkReady = _registerWithJET);
                                    }
                                    else {
                                        _u.info("JETComponent starting register with Chrome container. Session: ", function () { return _getSession(); });

                                        var newMessageHandler = onMessage;
                                        if (window.externalHost.onmessage != null && window.externalHost.onmessage != undefined) {
                                            var otherMessageHanlder = window.externalHost.onmessage;
                                            newMessageHandler = function (m) {
                                                otherMessageHanlder(m);
                                                onMessage(m);
                                            };
                                        }

                                        if (jsAsyncContainer) {
                                            asyncContainer = window.registerWithAsyncCCFContainer(newMessageHandler);
                                            JET.ContainerType = "Sync";
                                        }
                                        else {
                                            asyncContainer.onmessage = newMessageHandler;
                                        }

                                        _sendAsync(reqObj, _registerTimeout).then(initContainer);
                                    }
                                },
                                getData: function (r) {
                                    if (r.async) {

                                        var m1 = { name: r.name, xmlData: r.xmlData, id: r.id, method: "getData" };
                                        _sendAsync(m1).then(function (res) { r.async(res); });

                                    } else {
                                        return _sendDataSync(r);
                                    }
                                    return null;
                                },
                                processEvent: function (e) {
                                    var m1 = { name: e.name, data: e.xmlData, method: "processEvent" };
                                    if (e.channel) m1.channel = e.channel;
                                    pm(m1);
                                }
                            }
                        };
                    } else {
                        var co = null;
                        if ("registerWithCCFContainer" in window) co = window;
                        if (window.external && "registerWithCCFContainer" in window.external) co = window.external;
                        if (co) {
                            JET.ContainerType = "Sync";
                            var uid = 0;
                            // register IE support
                            c = function () {
                                var onGetData = function (r) {
                                    var r1 = _cloneEvent(r);

                                    _u.trace("From container: ", r1);
                                    if (!r.name) {
                                        _u.error("No name in message!");
                                        return;
                                    }
                                    var res = _onContainerGetData(r1);
                                    return res;
                                };
                                var onProcessEvent = function (e) {
                                    var e1 = _cloneEvent(e);

                                    _u.trace("From container: ", e1);
                                    if (!e.name) {
                                        _u.error("No name in message!");
                                        return;
                                    }
                                    var res = _onContainerEvent(e1);
                                    return res;
                                };
                                return {
                                    init: function () {
                                        _u.info("JETComponent starting register with IE container. Session: ", function () { return _getSession(); });

                                        var xmlData = JET.Convert.ToContainer.Type("Session", _getSession());

                                        container = co.registerWithCCFContainer({ getData: onGetData, processEvent: onProcessEvent }, xmlData);

                                        JET.Initialized = container != null;

                                        defInitialized.resolve();

                                        _u.info("JETComponent register with container finished");
                                    },
                                    getData: function (r) {
                                        _u.trace("Data request. Name: ", r.name);
                                        var res = null;
                                        try {
                                            res = container.getData(r);
                                        } catch (e) {
                                            _u.error(function () { return 'getData({"name":"' + r.name + '"} throws Exception : "' + e.message + '"' });
                                        }
                                        _u.trace("Data request. Name: ", r.name, " Result: ", res);
                                        if (r.async) {
                                            r.async(res);
                                        }
                                        return res;
                                    },
                                    processEvent: function (e) {
                                        _u.trace("To container: ", e);
                                        container.processEvent(e);
                                    }
                                };
                                co = null;
                            };
                        }
                        else {
                            JET.ContainerType = "Absent";
                            c = function () {
                                // register fake support
                                return {
                                    init: function () {
                                        _u.info("JETComponent starting register with fake container.");
                                        _u.error("No JET Container is found!");
                                        // do not resolve initialize queue
                                        //defInitialized.resolve();
                                    },
                                    getData: function (r) {
                                        _u.trace("To fake container: ", r);
                                        _u.error("getData failed! No JET Container is found!");
                                    },
                                    processEvent: function (e) {
                                        _u.trace("To fake container: ", e);
                                        _u.error("processEvent failed! No JET Container is found!");
                                    }
                                };
                            };
                        }
                    };

                    //register with container
                    (_container = new c()).init();

                    return defInitialized;
                });

                // initialize document.oncontext menu property for a chrome container
                if (window.externalHost) {
                    _u.add(_onLoadedCallbacks, function () {
                        document.oncontextmenu = function (e) {
                            var e = window.event;
                            var data = { context: {} };

                            if (e) {
                                data.mouse = { screenX: e.screenX, screenY: e.screenY, clientX: e.clientX, clientY: e.clientY };
                            }

                            JET.contextMenu(data);

                            // hide original context menu
                            return false;
                        };
                    });
                    _u.add(_onUnloadCallbacks, function () {
                        document.oncontextmenu = null;
                    });
                }

                //set handler to fire JET 'onUnload' when page unloads
                _u.addOnUnload(function () { JET.unload() });
                //get ArchiveData

                _initializeQueue.then(function () {
                    _u.debug("Requesting archive data from container.")
                    _getData({
                        name: "persistdata", xmlData: null, async: function (persist) {
                            _u.debug("Received archive data: ", persist);
                            if (persist && persist.data) {
                                JET.Archive = persist.data;
                            }

                            if (JET.ContainerDescription == null) {
                                // require description only for IE case - as for other container there should be already information
                                var data = _getData({ name: "description", xmlData: "" });
                                if (data != null) {
                                    JET.ContainerDescription = data;
                                    _decodeEikonVersion();
                                    _u.trace("Container Description: ", JET.ContainerDescription);
                                }

                                // get GUID by addtition request
                                if (JET.ContainerDescription && !JET.ContainerDescription.GUID) {
                                    // require ContainerInformation
                                    var info = _getData({ name: "ContainerInformation", xmlData: null });
                                    // have we received GUID?
                                    if (info && info.GUID)
                                        // save the GUID in JET.ContainerDescription object
                                        JET.ContainerDescription.GUID = info.GUID;
                                }
                            }

                            //call JET onLoad
                            var descData = _getComponentDescription();
                            _u.info("Sending onLoad. Data:", descData);
                            _processEvent({ name: "onLoad", data: descData });
                            _setLoadedAndCallOnLoadCallbacks();

                            if (api.Context && api.Context.length) {
                                // set context if we have it
                                api.contextChange(api.Context);
                            }
                        }
                    });
                });
            };

            return api;
        }();

        /*Serializing json into xml*/
        JET.extend(0, "Convert", function (_u) {
            var _present = function (v, t) {
                var tv = typeof v;
				if (_u.isArray(v)) {
					tv = "array";
				}
                if ("undefined" != tv) {
                    if (t && t != tv)
                        throw new Error("Type \"" + tv + "\" used instead of \"" + t + "\" for: " + v);
                    return true;
                }
                return false;
            }
            var _req = function (item, propNames, type) {
				if (!_u.isArray(propNames)) {
					propNames = [propNames];
				}

                _u.each(propNames, function (p) {
                    if (!_present(item[p], type))
                        throw new Error(p + " field is not specified!");
                });
            }
            var _reqa = function (item, propNames, min, max) {
                if (min == undefined) {
                    min = 1;
                }
                if (max == undefined) {
                    max = Number.POSITIVE_INFINITY;
                }
				if (!_u.isArray(propNames)) {
					propNames = [propNames];
				}

                _u.each(propNames, function (p) {
                    if (_present(item[p], "array")) {
                        if (item[p].length < min || item[p].length > max) {
                            throw new Error("Array " + p + " out of range(" + min + ", " + max + ")");
                        }
                    }
                });
            }
            var _oneOf = function (v, values) {
                for (var i = 0; i < values.length; i++) {
                    if (v == values[i])
                        return;
                }
                throw new Error("Field has invalid value: " + v);
            }
            var _escapeString = function (/*String*/str) {
                if (str.indexOf("<![CDATA[") > -1) return str;
                // summary: function escapeString. author: David Joham djoham@yahoo.com
                // str: string
                //      The string to be escaped
                // returns: The escaped string
                str = str.replace(/&/g, "&amp;");
                str = str.replace(/</g, "&lt;");
                str = str.replace(/>/g, "&gt;");
                str = str.replace(/"/g, "&quot;");
                str = str.replace(/'/g, "&apos;");
                return str; // String
            };
            // base types
            var _getMouseXML = function (nodeName, mouseData) {
                var xml = "<" + nodeName;
                if (_present(mouseData.screenX, "number"))
                    xml += " screenx=\"" + mouseData.screenX + "\"";
                if (_present(mouseData.screenY, "number"))
                    xml += " screeny=\"" + mouseData.screenY + "\"";
                if (_present(mouseData.clientX, "number"))
                    xml += " clientx=\"" + mouseData.clientX + "\"";
                if (_present(mouseData.clientY, "number"))
                    xml += " clienty=\"" + mouseData.clientY + "\"";
                return xml + " />";
            };
            var _getLocationXML = function (nodeName, locationData) {
                var xml = "<" + nodeName;
                if (_present(locationData.x, "number"))
                    xml += " x=\"" + locationData.x + "\"";
                if (_present(locationData.y, "number"))
                    xml += " y=\"" + locationData.y + "\"";
                if (_present(locationData.width, "number"))
                    xml += " width=\"" + locationData.width + "\"";
                if (_present(locationData.height, "number"))
                    xml += " height=\"" + locationData.height + "\"";
                xml += " />";
                return xml;
            };
            var _getEntityXML = function (nodeName, e) {
                var entity = {};
                _u.mixin(entity, e);
                var xml = "<" + nodeName;
                if (_present(entity.type, "string"))
                    xml += (" type=\"" + _escapeString(entity.type) + "\"");
                delete entity.type;
                if (_present(entity.dataSource, "string"))
                    xml += (" datasource=\"" + _escapeString(entity.dataSource) + "\"");
                xml += ">";
                delete entity.dataSource;
                if (entity.fields) {
                    for (var name in entity.fields) {
                        xml += "<Field name=\"" + _escapeString(name) + "\">";
                        if (_present(entity.fields[name], "string"))
                            xml += _escapeString(entity.fields[name]);
                        xml += "</Field>";
                    }
                }
                delete entity.fields;
                if (entity.entities) {
                    _req(entity, "entities", "array");
                    _u.each(entity.entities, function (item) {
                        //switch (item.item) {
                        //case "Entity":
                        xml += _getEntityXML("Entity", item);
                        //break;
                        //}
                    });
                }
                delete entity.entities;
                for (var name in entity) {
                    if (name in { "NavigationNS": "", "SelectionNS": "", "Transaction": "" }) {
                        xml += "<Field name=\"" + _escapeString(name) + "\">";
                        if (_present(entity[name], "string"))
                            xml += _escapeString(entity[name]);
                        xml += "</Field>";
                    }
                    else {
                        xml += "<Identifier namespace=\"" + _escapeString(name) + "\">";
                        if (_present(entity[name], "string"))
                            xml += _escapeString(entity[name]);
                        xml += "</Identifier>";
                    }
                }

                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getContextDataXML = function (nodeName, contextData) {
                var xml = "<" + nodeName + ">";
                if (contextData.length > 0) {
                    _u.each(contextData, function (e) {
                        xml += _getEntityXML("Entity", e);
                    });
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getCommandBarDefaultAttrsXML = function (item) {
                _req(item, "id", "string");
                var xml = " ID=\"" + _escapeString(item.id) + "\"";
                if (_present(item.tooltip, "string"))
                    xml += " tooltip=\"" + _escapeString(item.tooltip) + "\"";
                if (_present(item.icon, "string"))
                    xml += " icon=\"" + _escapeString(item.icon) + "\"";
                if (_present(item.enabled, "boolean"))
                    xml += " enabled=\"" + item.enabled + "\"";
                if (_present(item.description, "string"))
                    xml += " description=\"" + _escapeString(item.description) + "\"";
                if (_present(item.iconURL, "string"))
                    xml += " iconURL=\"" + _escapeString(item.iconURL) + "\"";
                return xml;
            };
            var _getButtonAttrsXML = function (item) {
                var xml = _getCommandBarDefaultAttrsXML(item);
                _req(item, "caption", "string");
                xml += " caption=\"" + _escapeString(item.caption) + "\"";
                if (_present(item.checked, "boolean"))
                    xml += " checked=\"" + item.checked + "\"";
                if (_present(item.type, "string")) {
                    _oneOf(item.type, ["iconOnly", "iconAndCaption", "captionOnly"]);
                    xml += " type=\"" + item.type + "\"";
                }
                return xml;
            };
            var _getControlAttrsXML = function (control) {
                var xml = _getCommandBarDefaultAttrsXML(control);
                if (_present(control.caption, "string"))
                    xml += " caption=\"" + _escapeString(control.caption) + "\"";
                return xml;
            };
            var _getButtonXML = function (button) {
                var xml = "<Button" + _getButtonAttrsXML(button) + " />";
                return xml;
            };
            
            var _getSystemMenuXML = function (button) {
                var xml = "<SystemMenu" + _getSystemMenuAttrsXML(button) + " />";
                return xml;
            };
            
            var _getComboBoxXML = function (comboBox) {
                var xml = "<ComboBox" + _getControlAttrsXML(comboBox);
                if (_present(comboBox.type, "string")) {
                    _oneOf(comboBox.type, ["dropDown", "comboBox"]);
                    xml += " type=\"" + comboBox.type + "\"";
                }
                if (_present(comboBox.dropDownWidth, "number"))
                    xml += " maxlength=\"" + comboBox.dropDownWidth + "\"";
                xml += " >";
                if (comboBox.items) {
                    _u.each(comboBox.items, function (item) {
                        _req(item, "caption", "string");
                        xml += "<ListItem caption=\"" + _escapeString(item.caption) + "\"";
                        if (_present(item.selected, "boolean"))
                            xml += " selected=\"" + item.selected + "\"";
                        if (_present(item.id, "string"))
                            xml += " ID=\"" + _escapeString(item.id) + "\"";
                        xml += " />";
                    });
                }
                xml += "</ComboBox>";
                return xml;
            };
            var _getMenuControlsXML = function (menuItem) {
                var xml = "";
                if (menuItem.items) {
                    _u.each(menuItem.items, function (item) {
                        _req(item, "item", "string");
                        switch (item.item) {
                            case "Button":
                                xml += _getButtonXML(item);
                                break;
                            case "SplitButton":
                                xml += _getSplitButtonXML(item);
                                break;
                            case "Menu":
                                xml += _getMenuXML(item);
                                break;
                            case "Separator":
                                xml += _getSeparatorXML(item);
                                break;
                            default:
                                throw new Error("Invalid item type specified: " + item.item);
                        }
                    });
                }
                return xml;
            };
            var _getSplitButtonXML = function (splitButton) {
                var xml = "<SplitButton" + _getButtonAttrsXML(splitButton) + ">";
                _req(splitButton, "items", "array");
                _reqa(splitButton, "items");
                if (splitButton.items)
                    xml += _getMenuControlsXML(splitButton);
                xml += "</SplitButton>";
                return xml;
            };
            var _getMenuXML = function (menu) {
                var xml = "<Menu" + _getButtonAttrsXML(menu) + ">";
                _req(menu, "items", "array");
                _reqa(menu, "items");
                if (menu.items)
                    xml += _getMenuControlsXML(menu);
                xml += "</Menu>";
                return xml;
            };
            
            var _getSystemMenuAttrsXML = function (menu) {
                                
                _req(menu, "id", "string");
                var xml = " ID=\"" + _escapeString(menu.id) + "\"";                
                                
                if (_present(menu.enabled, "boolean"))
                    xml += " enabled=\"" + menu.enabled + "\"";
                
                if (_present(menu.visible, "boolean"))
                    xml += " visible=\"" + menu.visible + "\"";             
                
                xml + ">";
                
                _reqa(menu, "items");
                if (menu.items)
                    xml += _getSystemMenuXML(menu);
                
                return xml;
            };
            
            
            var _getSearchXML = function (search) {
                var xml = "<Search";
                if (_present(search.id, "string"))
                    xml += " ID=\"" + _escapeString(search.id) + "\"";
                xml += "/>";
                return xml;
            };
            var _getSeparatorXML = function (separator) {
                var xml = "<Separator />";
                return xml;
            };
            var _getEditXML = function (edit) {
                var xml = "<Edit" + _getControlAttrsXML(edit);
                if (_present(edit.text, "string"))
                    xml += " text=\"" + _escapeString(edit.text) + "\"";
                if (_present(edit.maxLength, "number")) {
                    if (edit.maxLength < 0)
                        throw new Error("Negative value was used for maxLength: " + edit.maxLength);
                    xml += " maxlength=\"" + edit.maxLength + "\"";
                }
                xml += " />";
                return xml;
            };
            var _getPrintXML = function (print) {
                _req(print, "id", "string");
                _oneOf(print.id, ["PRINT"]);
                var xml = "<Print ID=\"PRINT\" />";
                return xml;
            };
            var _getCommandBarXML = function (nodeName, commandBar) {
                var xml = "<" + nodeName;
                if (_present(commandBar.caption, "string"))
                    xml += " caption=\"" + _escapeString(commandBar.caption) + "\"";
                if (_present(commandBar.category, "number"))
                    xml += " category=\"" + commandBar.category + "\"";
                xml += ">";
                _req(commandBar, "items", "array");
                _reqa(commandBar, "items");
                if (commandBar.items) {
                    _u.each(commandBar.items, function (item) {
                        _req(item, "item", "string");
                        switch (item.item) {
                            case "Button":
                                xml += _getButtonXML(item);
                                break;
                            case "SplitButton":
                                xml += _getSplitButtonXML(item);
                                break;
                            case "Menu":
                                xml += _getMenuXML(item);
                                break;
                            case "Separator":
                                xml += _getSeparatorXML(item);
                                break;
                            case "Search":
                                xml += _getSearchXML(item);
                                break;
                            case "Edit":
                                xml += _getEditXML(item);
                                break;
                            case "ComboBox":
                                xml += _getComboBoxXML(item);
                                break;
                            case "Print":
                                xml += _getPrintXML(item);
                                break;
                            case "System":
                                xml += _getSystemMenuXML(item);
                                break;
                            default:
                                throw new Error("Invalid item type specified: " + item.item);
                        }
                    });
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            
            var _getUpdateCommandBarsXML = function (commandBars) {                   
                var xml = "<UpdateCommandBars>";                   
                
                _req(commandBars, "commandBarType", "string");              
                _req(commandBars, "commandBars", "array");
                _reqa(commandBars, "commandBars");
                
                xml += "<" + commandBars.commandBarType + ">";
                
                if (commandBars.commandBars) {
                    _u.each(commandBars.commandBars, function (cb) {
                        xml += _getCommandBarXML("CommandBar", cb);
                    });
                }
                
                xml += "</" +  commandBars.commandBarType + ">";
                xml += "</UpdateCommandBars>";
                return xml;
            };
            
            var _getCommandBarsXML = function (nodeName, commandBars) {
                var xml = "<" + nodeName + ">";
                _req(commandBars, "commandBars", "array");
                _reqa(commandBars, "commandBars");
                if (commandBars.commandBars) {
                    _u.each(commandBars.commandBars, function (cb) {
                        xml += _getCommandBarXML("CommandBar", cb);
                    });
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getPropertyXML = function (d) {
                var data = {};
                _u.mixin(data, d);
                var xml = "<Property";

                if (_present(data.type, "string"))
                    xml += " type=\"" + _escapeString(data.type) + "\"";
                delete data.type;

                if (_present(data.access, "string")) {
                    _oneOf(data.access, ["ro", "rw"]);
                    xml += " access=\"" + data.access + "\"";
                }
                delete data.access;

                var _getPropertyName = function (_d) {
                    for (var _n in _d) {
                        return _n;
                    }
                    return null;
                }
                var name = _getPropertyName(data);
                if (name) {
                    xml += " name=\"" + _escapeString(name) + "\">";
                    if (_present(data[name], "string"))
                        xml += _escapeString(data[name]);
                }
                else {
                    throw new Errr("Property should be declared.");
                }

                xml += "</Property>";
                return xml;
            };
            var _getEnumeratedTypeXML = function (data) {
                var xml = "<EnumeratedType";
                if (_present(data.name, "string"))
                    xml += " name=\"" + _escapeString(data.name) + "\"";
                xml += ">";
                if (data.items) {
                    _u.each(data.items, function (item) {
                        xml += "<Item";
                        if (_present(item.value, "string"))
                            xml += " value=\"" + _escapeString(item.value) + "\"";
                        if (_present(item.caption, "string"))
                            xml += " caption=\"" + _escapeString(item.caption) + "\"";
                        xml += " />";
                    });
                }
                xml += "</EnumeratedType>";
                return xml;
            };
            var _getPropertiesXML = function (nodeName, data) {
                var xml = "<" + nodeName + ">";
                if (data.length > 0) {
                    _u.each(data, function (p) {
                        xml += _getPropertyXML(p);
                    });
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getPDataXML = function (data) {
                var xml = "<PData";
                if (_present(data.name, "string"))
                    xml += " name=\"" + _escapeString(data.name) + "\"";
                xml += ">";
                if (_present(data.value, "string"))
                    xml += data.value;
                xml += "</PData>";
                return xml;
            };
            var _getArchiveDataXML = function (nodeName, data) {
                var xml = "<" + nodeName;
                if (_present(data.service, "string"))
                    xml += " service=\"" + _escapeString(data.service) + "\"";
                if (_present(data.title, "string"))
                    xml += " title=\"" + _escapeString(data.title) + "\"";
                if (_present(data.extension, "string"))
                    xml += " extension=\"" + _escapeString(data.extension) + "\"";
                xml += ">";
                if (_present(data.cpurl, "string")) {
                    xml += "<Url cpurl=\"" + _escapeString(data.cpurl) + "\">";
                    xml += _escapeString(_present(data.url, "string") ? data.url : data.cpurl);
                    xml += "</Url>";
                }
                else if (_present(data.url, "string"))
                    xml += "<Url>" + _escapeString(data.url) + "</Url>";
                if (_present(data.data)) {
                    _u.each(data.data, function (p) {
                        xml += _getPDataXML(p);
                    });
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getEventDataXML = function (nodeName, data) {
                var xml = "<" + nodeName + ">";
                if (data.aUrl)
                    xml += ("<Anchor url=\"" + _escapeString(data.aUrl) + "\" />");
                if (data.imgUrl)
                    xml += ("<Image url=\"" + _escapeString(data.imgUrl) + "\" />");
                if (data.mouse)
                    xml += _getMouseXML("Mouse", data.mouse);
                if (data.entities && data.entities.length)
                    xml += _getContextDataXML("Entities", data.entities);
                if (data.menu)
                    xml += _getCommandBarsXML("ContextMenu", data.menu);
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getNavigationXML = function (nodeName, nav) {
                // In order to restore an archived object, it's possible to navigate with the archive data
                if (nav.data)
                    return _getArchiveDataXML("PersistData", nav);
                var xml = "<" + nodeName;
                if (_present(nav.url, "string"))
                    xml += " url=\"" + _escapeString(nav.url) + "\"";
                if (_present(nav.name, "string"))
                    xml += " name=\"" + _escapeString(nav.name) + "\"";
                if (_present(nav.target, "string")) {
                    _oneOf(nav.target, ["new", "popup", "replace", "tab"]);
                    xml += " target=\"" + nav.target + "\"";
                }
                xml += ">";
                if (nav.entities)
                    xml += _getContextDataXML("Entities", nav.entities);
                if (nav.archive)
                    xml += _getArchiveDataXML("PersistData", nav.archive);
                if (nav.location)
                    xml += _getLocationXML("Location", nav.location);
                if (nav.properties)
                    xml += _getPropertiesXML("Properties", nav.properties);
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getTransferDataXML = function (nodeName, data) {
                var xml = "<" + nodeName;
                if (data.mouse) {
                    if (_present(data.mouse.screenX, "number"))
                        xml += " screenx=\"" + data.mouse.screenX + "\"";
                    if (_present(data.mouse.screenY, "number"))
                        xml += " screeny=\"" + data.mouse.screenY + "\"";
                }
                xml += ">";
                if (data.entities && data.entities.length) {
                    xml += "<Data type=\"ContextData\">";
                    xml += _getContextDataXML("Entities", data.entities);
                    xml += "</Data>";
                }
                if (data.archive) {
                    xml += "<Data type=\"PersistData\">";
                    xml += _getArchiveDataXML("PersistData", data.archive);
                    xml += "</Data>";
                }
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getToastXML = function (nodeName, data) {
                _req(data, "id", "string");
                var xml = "<" + nodeName + " ID=\"" + _escapeString(data.id) + "\"";
                if (_present(data.value, "string"))
                    xml += " value=\"" + _escapeString(data.value) + "\"";
                if (_present(data.duration, "number"))
                    xml += " duration=\"" + data.duration + "\"";
                xml += ">";
                _req(data, "title", "string");
                xml += "<Title>" + _escapeString(data.title) + "</Title>";
                if (_present(data.message, "string"))
                    xml += "<Message>" + _escapeString(data.message) + "</Message>";
                if (_present(data.icon, "string"))
                    xml += "<Icon>" + _escapeString(data.icon) + "</Icon>";
                if (_present(data.iconUrl, "string"))
                    xml += "<IconUrl>" + _escapeString(data.iconUrl) + "</IconUrl>";
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getSearchTargetXML = function (nodeName, data) {
                var xml = "<" + nodeName;
                if (_present(data.multipleMatches, "boolean"))
                    xml += " multipleMatches=\"" + data.multipleMatches + "\"";
                if (_present(data.contextResolution, "boolean"))
                    xml += " contextResolution=\"" + data.contextResolution + "\"";
                xml += ">";
                if (data.constraints) {
                    _u.each(data.constraints, function (c) {
                        _req(c, "namespace", "string");
                        xml += "<Constraint namespace=\"" + c.namespace + "\">";
                        if (c.contextDataTransformation != null)
                            xml += "<ContextDataTransformation>" + c.contextDataTransformation + "</ContextDataTransformation>";
                        if (c.definitions) {
                            _u.each(c.definitions, function (d) {
                                xml += "<Definition";
                                if (_present(d.name, "string"))
                                    xml += " name=\"" + _escapeString(d.name) + "\"";
                                xml += ">";
                                if (_present(d.value, "string"))
                                    xml += _escapeString(d.value);
                                xml += "</Definition>";
                            });
                        }
                        xml += "</Constraint>";
                    });
                }
                return xml;
            };
            var _getDescriptionXML = function (nodeName, data) {
                var xml = "<" + nodeName + ">";
                if (_present(data.summary, "string"))
                    xml += "<Summary>" + _escapeString(data.summary) + "</Summary>";
                if (data.toolbar)
                    xml += _getCommandBarsXML("Toolbar", data.toolbar);
                if (data.serviceMenu)
                    xml += _getCommandBarsXML("ServiceMenu", data.serviceMenu);
                if (data.apptitlebar)
                    xml += _getCommandBarsXML("AppTitleBar", data.apptitlebar);
                if (data.appmenu)
                    xml += _getCommandBarsXML("AppMenu", data.appmenu); 
                    
                if (data.entities && data.entities.length)
                    xml += _getContextDataXML("Context", data.entities);
                if (data.searchTarget)
                    xml += _getSearchTargetXML("SearchTarget", data.searchTarget);
                if (data.properties)
                    xml += _getPropertiesXML("Properties", data.properties);
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getLogXML = function (nodeName, data) {
                var xml = "<" + nodeName + ">";
                _req(data, "messages", "array");
                _reqa(data, "messages");
                _u.each(data.messages, function (m) {
                    _req(m, "text", "string");
                    xml += "<Message";
                    if (_present(m.severity, "string")) {
                        _oneOf(m.severity, ["critical", "high", "warning", "information", "debug"]);
                        xml += " severity=\"" + m.severity + "\"";
                    }
                    if (_present(m.text, "string"))
                        xml += " text=\"" + _escapeString(m.text) + "\"";
                    xml += " />";
                });
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getClipboardDataXML = function (nodeName, data) {
                var xml = "<" + nodeName + ">";
                _u.each(data.entries, function (e) {
                    _req(e, "name", "string");
                    xml += "<Entry name=\"" + _escapeString(e.name) + "\">";
                    if (_present(e.value, "string"))
                        xml += _escapeString(e.value);
                    xml += "</Entry>";
                });
                xml += "</" + nodeName + ">";
                return xml;
            };
            var _getSessionXML = function (nodeName, data) {
                _req(data, "version", "string");
                _req(data, "id", "string");
                var r = new RegExp("^[0-9]+\.[0-9]+\.[0-9]+$");
                if (!r.test(data.version))
                    throw new Error("Invalid version was specified: " + data.version);
                var xml = "<" + nodeName + " version=\"" + data.version + "\" ID=\"" + _escapeString(data.id) + "\"/>";
                return xml;
            };

            /*
            XML 2 JSON transformation
            */
            var _stringToRootNode = function (str) {
                var res = null;
                if (typeof str != "string")
                    throw new Error("Invalid xml string passed!");
                if (JET.DOMParser) {
                    res = JET.DOMParser.parseFromString(str, "text/xml");
                }
                else { // Internet Explorer
                    if (JET.XMLDOM.loadXML(str))
                        res = JET.XMLDOM;
                    else throw new Error("xml string is not parsed!");
                    //return null;
                }
                if (!res || !res.documentElement)
                    throw new Error("xml document couldn't be prepared!");
                return res.documentElement;
            };
            var _loadAttr = function (node, attrName, req, object, propName) {
                if (!propName) propName = attrName;
                var value = node.getAttribute(attrName);
                if (_u.isString(value))
                    object[propName] = value;
                else
                    if (req)
                        throw new Error("Mandatory attribute " + attrName + " is not specified for node " + node.tagName);
            };
            var _getEntityJson = function (entityNode) {
                var entity = {};
                _loadAttr(entityNode, "type", false, entity);
                _loadAttr(entityNode, "datasource", false, entity, "dataSource");
                _u.each(entityNode.childNodes, function (node) {
                    switch (node.tagName) {
                        case "Identifier":
                            var item = {};
                            _loadAttr(node, "namespace", true, item);
                            entity[item.namespace] = node.text || node.textContent || "";
                            break;
                        case "Field":
                            if (entity.fields == undefined)
                                entity.fields = {};
                            var item = {};
                            _loadAttr(node, "name", true, item);
                            var name = item.name;
                            delete item.name;
                            item[name] = node.text || node.textContent || "";
                            switch (name) {
                                case "SelectionNS":
                                case "NavigationNS":
                                case "Transaction":
                                    entity[name] = item[name];
                                    break;
                                default:
                                    entity.fields[name] = item[name];
                            }
                            break;
                        case "Entity":
                            if (entity.entities == undefined)
                                entity.entities = [];
                            _u.add(entity.entities, _getEntityJson(node));
                            break;
                        default:
                            return;
                    }
                });
                return entity;
            }
            var _getContextDataJson = function (root) {
                var data = [];
                _u.each(root.childNodes, function (node) {
                    switch (node.nodeName) {
                        case "Entity":
                            _u.add(data, _getEntityJson(node));
                            break;
                    }
                });
                return data;
            };
            var _getCommandDataJson = function (root) {
                var data = {};
                _loadAttr(root, "itemID", false, data, "itemId");
                _loadAttr(root, "value", false, data);
                _loadAttr(root, "ID", true, data, "id");
                return data;
            };
            var _getPropertiesJson = function (root) {
                var data = [];
                if (root.tagName != "Properties")
                    throw new Error("Properties node expected!");
                var props = [];
                _u.each(root.childNodes, function (node) {
                    switch (node.nodeName) {
                        case "Property":
                            var property = {};
                            var name = node.getAttribute("name");
                            _loadAttr(node, "type", false, property);
                            _loadAttr(node, "access", false, property);
                            property[name] = node.text || node.textContent || "";
                            _u.add(props, property);
                            break;
                    }
                });
                if (props.length > 0)
                    data = props;
                return data;
            };
            var _getArchiveDataJson = function (root) {
                var data = {};
                if (root.tagName != "PersistData")
                    throw new Error("PersistData node expected!");
                _loadAttr(root, "url", false, data);
                _loadAttr(root, "service", false, data);
                _loadAttr(root, "title", false, data);
                _loadAttr(root, "extension", false, data);
                var pdatas = [];
                _u.each(root.childNodes, function (node) {
                    switch (node.nodeName) {
                        case "Url":
                            data.url = node.text || node.textContent || "";
                            _loadAttr(node, "cpurl", false, data);
                            break;
                        case "PData":
                            var pdata = {};
                            _loadAttr(node, "name", false, pdata);
                            var fc = node.firstChild;
                            if (pdata.name == "context") {
                                if (fc != null && fc.xml)
                                    pdata.value = fc.xml;
                                else {
                                    pdata.value = "";
                                    var s = new XMLSerializer();
                                    _u.each(node.childNodes, function (n) {
                                        pdata.value += s.serializeToString(n);
                                    });
                                }
                            }
                            else {
                                if (fc != null) {
                                    pdata.value = node.text || node.textContent || "";
                                    if (fc.nodeType == 4) pdata.value = "<![CDATA[" + pdata.value + "]]>";
                                } else pdata.value = "";
                            }
                            _u.add(pdatas, pdata);
                            break;
                    }
                });
                if (pdatas.length > 0)
                    data.data = pdatas;
                return data;
            };
            var _getDescriptionJson = function (root) {
                var data = {};
                if (root.tagName != "Description")
                    throw new Error("Description node expected!");
                _loadAttr(root, "name", false, data);
                _loadAttr(root, "logLevel", false, data);
                _loadAttr(root, "version", true, data);
                _loadAttr(root, "containerVersion", false, data);
                _loadAttr(root, "productVersionInfo", false, data);
                _loadAttr(root, "userAgent", false, data);
                _loadAttr(root, "guid", false, data);
                if ("guid" in data) { data.GUID = data.guid.replace(/-/g, ""); delete data.guid; }
                data.capabilities = {};
                _u.each(root.childNodes, function (node) {
                    switch (node.nodeName) {
                        case "Capabilities":
                            _u.each(node.childNodes, function (n) {
                                var capability = {};
                                _loadAttr(n, "name", true, capability);
                                _loadAttr(n, "namespace", false, capability);
                                _loadAttr(n, "type", false, capability);
                                if (_present(capability.type, "string"))
                                    _oneOf(capability.type, ["SYNC", "ASYNC", "BOTH"]);
                                var value = n.text || n.textContent || "";
                                if (value.length > 0)
                                    capability.value = value;
                                data.capabilities[capability.name] = capability;
                                delete capability.name;
                            });
                            break;
                        case "JetPluginInfo":
                            var plugin = {};
                            _loadAttr(node, "ChannelName", true, plugin, "channel");
                            data.plugin = plugin;
                            break;
                        case "HttpHandler":
                            var capability = {};
                            _loadAttr(node, "url", true, capability, "value");
                            data.GUID = capability.value.substring(capability.value.indexOf("id=") + 3);
                            capability.value = capability.value.substring(0, capability.value.indexOf("?id="));
                            data.capabilities["httpGetData"] = capability;
                            break;
                            // Thanks to Yana Kadiyska for rescuing the properties! 
                        case "Properties":
                            data.properties = _getPropertiesJson(node);
                            break;
                    }
                });
                return data;
            };
            var _getUserInfoJson = function (root) {
                var data = {};
                if (root.tagName != "UserInfo")
                    throw new Error("UserInfo node expected!");
                _u.each(root.childNodes, function (node) {
                    // process element nodes
                    if (node.nodeType == 1) {
                        var value = node.text || node.textContent || "";
                        data[node.tagName] = value;
                    }
                });
                return data;
            };
            var _getContainerInformationJson = function (root) {
                var data = {};
                if (root.tagName != "ContainerInfo")
                    throw new Error("ContainerInfo node expected!");
                _loadAttr(root, "GUID", true, data);
                _loadAttr(root, "RootPersistencyFolder", true, data);
                return data;
            };
            var _getTransferDataJson = function (root) {
                var data = {};
                if (root.tagName != "TransferData")
                    throw new Error("TransferData node expected!");
                var mouse = {};
                _loadAttr(root, "screenx", false, mouse, "screenX");
                _loadAttr(root, "screeny", false, mouse, "screenY");
                var xPresent = _present(mouse.screenX, "string") && mouse.screenX;
                var yPresent = _present(mouse.screenY, "string") && mouse.screenY;
                if (xPresent || yPresent) {
                    if (xPresent) mouse.screenX = _u.eval(mouse.screenX);
                    if (yPresent) mouse.screenY = _u.eval(mouse.screenY);
                    data.mouse = mouse;
                }
                _u.each(root.childNodes, function (node) {
                    switch (node.nodeName) {
                        case "Data":
                            var dataType = node.getAttribute("type");
                            if (dataType == "ContextData" || dataType == "PersistData") {
                                _u.each(node.childNodes, function (n) {
                                    switch (n.nodeName) {
                                        case "Entities":
                                            if (dataType != "ContextData")
                                                throw new Error("ContextData data type expected instead of " + dataType);
                                            data.entities = _getContextDataJson(n);
                                            break;
                                        case "PersistData":
                                            if (dataType != "PersistData")
                                                throw new Error("PersistData data type expected instead of " + dataType);
                                            data.archive = _getArchiveDataJson(n);
                                            break;
                                            //default: 
                                            //  throw new Error("Unknown data type specified " + data.type); 
                                    };
                                });
                            }
                            break;
                    };
                });
                return data;
            };
            var _getBoolean = function (str) {
                var res = _u.eval(str);
                if ("boolean" != typeof res)
                    throw new Error("Invalid boolean value specified: " + str);
                return res;
            };
            var _getXYJson = function (str) {
                var data = {};
                var coords = str.split(",");
                var regex = new RegExp("^[0-9]+,[0-9]+$");
                if (!regex.test(str) || coords.length != 2)
                    throw new Error("Invalid data format used!");
                data.x = _u.eval(coords[0]);
                data.y = _u.eval(coords[1]);
                return data;
            };

            return {
                ToContainer: {
                    Message: function (event) {
                        var map = {
                            "onContextMenu": "EventData",
                            "onContextChange": "ContextData",
                            "onClick": "ContextData",
                            "onNavigate": "Navigation",
                            "onDragStart": "TransferData",
                            "onAddCommentary": "TransferData",
                            "onCopy": "TransferData",
                            "onToast": "Toast",
                            "onPropertyChange": "Properties",
                            "onLoad": "Description",
                            "onUnload": "ArchiveData",
                            "persistdata": "ArchiveData",
                            "onLog": "Log",
                            "onUpdateCommandBars": "UpdateCommandBars", 
                            "onCopyToClipboard": "ClipboardData",
                            "onContextDragStart": "ContextData"//Obsolette!
                        };
                        event.xmlData = event.name in map ? JET.Convert.ToContainer.Type(map[event.name], event.data) : event.data;
                        delete event.data;
                        return event;
                    },
                    Type: function (type, data) {
                        switch (type) {
                            case "Log":
                                return _getLogXML("Log", data);
                            case "Description":
                                return _getDescriptionXML("Description", data);
                            case "Properties":
                                return _getPropertiesXML("Properties", data);
                            case "Toast":
                                return _getToastXML("Toast", data);
                            case "TransferData":
                                return _getTransferDataXML("TransferData", data);
                            case "Navigation":
                                return _getNavigationXML("Navigation", data);
                            case "EventData":
                                return _getEventDataXML("EventData", data);
                            case "ContextData":
                                return _getContextDataXML("Entities", data);
                            case "ArchiveData":
                                return _getArchiveDataXML("PersistData", data);
                                // not yet used
                            case "UpdateCommandBars":                                
                                return _getUpdateCommandBarsXML(data);
                            case "ClipboardData":
                                return _getClipboardDataXML("ClipboardData", data);
                            case "Session":
                                return _getSessionXML("Session", data);
                            default:
                                throw new Error("Invalid type was used: " + type);
                        }
                    },
                    Result: function (msgName, data) {
                        var map = {
                            "context": "ContextData",
                            "description": "Description",
                            "persistdata": "ArchiveData",
                            "properties": "Properties"
                            //,"helpurl":"String",
                            //"inputowner":"String"
                        };
                        return msgName in map ? JET.Convert.ToContainer.Type(map[msgName], data) : data;
                    }
                },
                FromContainer: {
                    Message: function (event) {
                        var map = {
                            "onContextChange": "ContextData",
                            "onPropertyChange": "Properties",
                            "onCommand": "CommandData",
                            "onDragEnter": "TransferData",
                            "onDragOver": "x,y",
                            //"onDragLeave":"",
                            "onDrop": "TransferData",
                            "onPaste": "TransferData",
                            //"onActivate":"",
                            //"onDeactivate":"",
                            "onSearchResult": "ContextData",
                            "onSendObject": "TransferData"
                        };
                        event.data = event.name in map ? JET.Convert.FromContainer.Type(map[event.name], event.xmlData || event.data) : event.xmlData || event.data;
                        if (event.xmlData) delete event.xmlData;
                        return event;
                    },
                    Type: function (type, data) {
                        switch (type) {
                            case "ContextData":
                                return _getContextDataJson(_stringToRootNode(data));
                            case "Properties":
                                return _getPropertiesJson(_stringToRootNode(data));
                            case "CommandData":
                                return _getCommandDataJson(_stringToRootNode(data));
                            case "TransferData":
                                return _getTransferDataJson(_stringToRootNode(data));
                            case "ArchiveData":
                                return _getArchiveDataJson(_stringToRootNode(data));
                            case "Description":
                                return _getDescriptionJson(_stringToRootNode(data));
                            case "UserInfo":
                                return _getUserInfoJson(_stringToRootNode(data));
                            case "x,y":
                                return _getXYJson(data);
                            case "Boolean":
                                return _getBoolean(data);
                            case "ContainerInformation":
                                return _getContainerInformationJson(_stringToRootNode(data));
                            default:
                                throw new Error("Invalid type was used: " + type);
                        }
                    },
                    Result: function (msgName, data) {
                        var map = {
                            "description": "Description",
                            "UserInfo": "UserInfo",
                            "persistdata": "ArchiveData",
                            //"SearchTarget":"ContextData",
                            //"loadFromStore":"string",
                            "getDropData": "TransferData",
                            "getPasteData": "TransferData",
                            "isActive": "Boolean",
                            "hasFocus": "Boolean",
                            //"resetDragDrop":"",
                            //"windowDragEnter":"",
                            //"windowDragLeave":"",
                            //"cancelDragDrop":"",
                            "ContainerInformation": "ContainerInformation",
                            "ActiveSymbol": "ContextData"
                        };
                        return msgName in map ? JET.Convert.FromContainer.Type(map[msgName], data) : data;
                    }
                }
            }
        });
    }
} else if ("console" in window) {
    console.warn("JET.js was loaded more than once!");
}