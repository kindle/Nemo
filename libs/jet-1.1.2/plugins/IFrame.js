/* JET: version = 1.1.2, released date = 30/4/2014 */

// JET implementation for IFrame.
// Uses cross-document messaging to contact server part at host (IFrameProxy.js).
// The server parts forwards events and calls to the host JET.
// XDM is async so we can't support any sync JET operations with it.
// The following syncronious JET functions are not supported:
// hasFocus
// getPasteData
// getProperties
// getSavedState
// getUserInfo
// isActive

if (!("JET" in window)) {
JET = (function () {
	var api = {};
	var iframeID;
	var beforeStartHandlers = [];

	// JET utilities. Not a complete implementation.
	// Using new JS function which are not supported in IE is fine here because we don't support IE for this module.
	var utils = {
		each: function(array, callback) { array.forEach(callback); },
		toJson: JSON.stringify
	};

	// Logging
	// The logging is not forwarded to the host. The implementation is same as for JET.js
	api.loggingOptions = function(logLevel, logger) {
		if (logger == undefined) {
			logger = window.console;
		}

		if (!logger) {
			logLevel = 10; //disable logging if there is no logger defined
		}
		var noLog = function() {};

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

		function wrapLogCall(methodName){
			return function() {
				var params = Array.prototype.slice.call(arguments);
				for(var n = 0; n < params.length; n++) {
					if (typeof(params[n]) == "function") {
						params[n] = params[n]();
					} 

					if (typeof(params[n]) == "object") {
						params[n] = utils.toJson(params[n]);						
					}
				}
				Function.prototype.apply.call(logger[methodName], logger, params);
			}
		}

		utils.trace = logLevel <=0 ? wrapLogCall(traceFunction) : noLog;
		utils.debug = logLevel <=1 ? wrapLogCall(debugFunction) : noLog;
		utils.info  = logLevel <=2 ? wrapLogCall("info") : noLog;
		utils.warn  = logLevel <=3 ? wrapLogCall("warn") : noLog;
		utils.error = logLevel <=4 ? wrapLogCall("error") : noLog;
	}	

	api.loggingOptions(3); // Log warnings and higher by default

	// Initialization and XDM message dispatching

	api.Initialized = false;
	api.Loaded = false;
	api.ContainerType = "Async";
	var initQueue = []; // A list of onLoad subscriptions to be called after initialization is done

	// XDM messages handler
	function onMessage(msg) {
		utils.trace("XDM Received Host >>> IFrame: ", msg.data);
		var data = JSON.parse(msg.data);

		switch(data.a) {
			case "onLoad": 
				api.ContainerDescription = data.id;
				iframeID = data.frameID;
				api.Loaded = true;
				initQueue.forEach(function(item) { item(); });
				initQueue = [];
				break;
			case "s": 
				handleSubscriptionCallback(data);
				break;
			case "e":
				handleEvent(data);
				break;
		}
	}

	window.addEventListener('message', onMessage, false);	

	function send(data) {
		var msg = JSON.stringify(data);
		utils.trace("XDM Sending  Host <<< IFrame: ", msg)
		window.top.postMessage(msg, "*");
	}

	// Initialization and deinitialization

	api.init = function(initObj) {
		beforeStartHandlers.forEach(function(h) { h(); });
		send({a: "init"});
		api.Initialized = true;
	}

	api.onBeforeStart = function(handler) {
		beforeStartHandlers.push(handler);
	}	

	api.onLoad = function(callback) {
		if (api.Loaded) {
			callback();
		} else {
			initQueue.push(callback);
		}
	}		

	api.unload = function() {
		send({ a:"unload", frameID: iframeID });		
	}

	api.onUnload = function(callback) {
		window.addEventListener('unload', callback, false);
	}

	api.onUnload(function() {
		api.unload();
	})

	// Event subscriptions

	// When client subsribes an event, an EventID is generated.
	// The event name and id is passed to the host, which performs subscription
	// When event is fired at the host, it send a message with event ID and event data
	// IFrame proxy finds handler by the event ID and calls it.

	var lastEventID = 0;	
	var events = {}; // EventID -> Handler mapping.

	var eventNames = ["onActivate", "onDeactivate", "onContextChange", "onSendObject", 
		"onPropertyChange", "onCommand", "onPaste",];
		
	eventNames.forEach(function(eventName) {
		api[eventName] = function(handler) {
			var eventID = lastEventID;
			lastEventID++;

			events[eventID] = handler;

			send({a: "sub", ename: eventName, eid: eventID});

			return {
				unsubscribe: function() {
					send({a: "unsub", eid: eventID})
					delete events[eventID];
				}
			}
		}
	})

	function handleEvent(data) {
		if (events[data.eid]) {
			utils.trace("IFrame event", data.eid, data.ename, data.d)
			events[data.eid](data.d);
		} else {
			utils.trace("IFrame event ignored (already unsubscribed)", data.eid, data.ename, data.d);
		}
	}

	// JET Functions 

	// JET function calls are forwarded in a straightforward way:
	// We just send a "call" message to the host along with function name and parameters.
	// The host will call required function when receive the message.

	var functions = [
		"publish", "click", "contextChange", "contextMenu", "copy", "copyToClipboard", 
		"critical", "debug", "flash", "hide", "high", "information", 
		"log", "show", "toast", "warning", "navigate", "dragStart"
	];		

	functions.forEach(function(name) {
		api[name] = function() {
			send({a : "call", m: name, args: JSON.stringify(Array.prototype.slice.apply(arguments))});
		}
	})


	// Channel subscriptions and publishing 

	// When client subscribes for a channel, we check if IFrame proxy already subscribed for the channel.
	// If so - we just add a new handler to an existing subscription.
	// If not - we send "subCh" message with channel name. 
	// The host will subscribe specified channel and will send messages with a:"s" when new data is posted to 
	// channel. IFrame.js can then find all handlers by the channel name and call them.
	// The subID is required to distinguish handlers on unsubscribing.

	var subscriptions = {}; // ChannelName -> { subscriptionID -> handler } mapping.
	var lastSubID = 0;
	api.subscribe = function(channel, handler) {
		var subID = lastSubID;
		lastSubID++;

		if (!subscriptions[channel]) {
			subscriptions[channel] = {};
			send({a:"subCh", ch: channel});
		}

		subscriptions[channel][subID] = handler;

		return {
			unsubscribe: function() {
				if (subscriptions[channel] && subscriptions[channel][subID]) {
					delete subscriptions[channel][subID];
	
					if (Object.keys(subscriptions[channel]).length == 0) {
						send({a:"unsubCh", ch: channel});
					}
				}
			}
		}
	}

	function handleSubscriptionCallback(data) {
		Object.keys(subscriptions[data.ch]).forEach(function(subID) {
			subscriptions[data.ch][subID](data.d);
		});
	}

	api.unsubscribeAll = function() {
		Object.keys(subscriptions).forEach(function(channel) {
			send({a:"unsubCh", ch: channel});
			subscriptions[channel] = {};
		})
	}


	// Other functions

	api.extend = function(ver, name, plugin) {
		api[name] = plugin(utils);
	}

	return api;
})();
} else {
	console.warn("Failed to initialize JET IFrame proxy: another JET instance already registered.")
}