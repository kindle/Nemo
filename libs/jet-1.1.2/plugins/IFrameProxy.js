/* JET: version = 1.1.2, released date = 30/4/2014 */

// The host for IFrame.js - a JET implementation for IFrames.
JET.extend(0, "IFrameProxy", function(utils) {	
	// Sends a message to specified iframe
	function send(iframe, data) {
		if (iframe) {
			var msg = JSON.stringify(data);
			utils.trace("XDM Sending  Host >>> IFrame: ", msg);
			iframe.postMessage(msg, "*");		
		} else {
			
		}
	}

	// All registered iframes information are stored in an array.
	// We need to iterate over it to find required iframe info.
	// This is not algorythmically efficient, but we can use hash here,
	// as we can't use iframe as a hash key in JS.
	// However we don't do the search often, so it should not affect performance significantly.
	var iframes = [];
	var lastIFrameID = 0;

	function getIframeInfo(iframe) {
		for(var n = 0; n < iframes.length; n++) {
			if (iframes[n].iframe == iframe) {
				return iframes[n];
			}
		}		
	}

	// Handler for initialization message from IFrame.
	function processInit(iframe, data) {
		var iframeID = lastIFrameID;
		// We send any response only when JET is loaded
		JET.onLoad(function() {
			// The container description is passed to the IFrame
			var cd = {};
			for(var item in JET.ContainerDescription) {
				cd[item] = JET.ContainerDescription[item];
			}

			// We alter container GUID to make it unique.
			// Container GUID is used to generate channel names.
			// If this ID will be same, different IFrames will generate same channel names
			cd.GUID = JET.ContainerDescription.GUID + "-IF" + iframeID;

			// Finally send an initialization ack message with container description and IFrameID
			// IFrame ID is used only on unload.
			send(iframe, {a: "onLoad", id: cd, frameID: iframeID })
		})

		JET.onUnload(function() {
			send(iframe, {a: "onUnload" })
		})

		iframes.push({ iframe: iframe, id: iframeID, eventSubscriptions: {}, channelSubscriptions: {} });

		lastIFrameID++;
	}

	// Channel subscription handling

	function processChannelSubscription(iframe, data) {
		var channel = data.ch;
		var iframeInfo = getIframeInfo(iframe);
		var subscripion = JET.subscribe(data.ch, function(data) {
			send(iframe, {a: "s", ch: channel, d: data});
		})
		// We store all subscriptions for each IFrame to be able to unsubscribe them on unLoad
		iframeInfo.channelSubscriptions[data.ch] = subscripion;
	}

	function processChannelUnsubscription(iframe, data) {
		var iframeInfo = getIframeInfo(iframe);
		iframeInfo.channelSubscriptions[data.ch].unsubscribe();
		delete iframeInfo.channelSubscriptions[data.ch];
	}

	// Event handling

	var allowedEvents = ["onActivate", "onDeactivate", "onContextChange", "onSendObject", 
		"onPropertyChange", "onCommand", "onPaste", "onDragOver", "onDrop"];

	function processEventSubscription(iframe, data) {
		var iframeInfo = getIframeInfo(iframe);
		var eventName = data.ename;

		// Check if event name is allowed. This is done for security reasons.
		if (allowedEvents.indexOf(eventName) < 0) {
			throw "IFrame client attempted to subscribe an invalid event";
		}

		var eventID = data.eid;

		var subscription = JET[eventName](function(eventData) {
			send(iframe, { a: "e", eid: eventID, ename: eventName, d: eventData });
		})
		iframeInfo.eventSubscriptions[eventID] = subscription;
	}

	function processEventUnsubscription(iframe, data) {
		var iframeInfo = getIframeInfo(iframe);
		iframeInfo.eventSubscriptions[data.eid].unsubscribe();
		delete iframeInfo.eventSubscriptions[data.eid];
	}	

	// IFrame unloading is a bit tricky:
	// When the host receive a message from IFrame telling that it is beign unloaded, 
	// the IFrame can be already removed. We will not have a reference to the IFrame object in this case
	// To see which IFrame is unloaded, we are using IFrame ID. 
	// This should be the only place where IFrame ID is used to keep good cross-domain isolation.
	function unloadFrame(data) {
		var eventCnt = 0;
		var channelCnt = 0;
		for(var n = iframes.length - 1; n >= 0; n--) {
			if (iframes[n].id == data.frameID) {
				// Unsubscribe all channels and events for the unloaded IFrame.
				var iframeInfo = iframes[n];
				for(var eventID in iframeInfo.eventSubscriptions) {
					iframeInfo.eventSubscriptions[eventID].unsubscribe();
					eventCnt++;
				}
				for(var channel in iframeInfo.channelSubscriptions) {
					iframeInfo.channelSubscriptions[channel].unsubscribe();
					channelCnt++;
				}				
				iframes.splice(n, 1);
			}
		}
		utils.trace("Frame with ID =", data.frameID, "was unloaded. Unsubscribed", eventCnt, "events and", channelCnt, "channels");
	}

	// JET function calls handling
	// - check that function name is valid
	// - call JET function with arguments passed in the message

	var allowedFunctions = [
		"publish", "click", "contextChange", "contextMenu", "copy", "copyToClipboard", 
		"critical", "debug", "flash", "hide", "high", "information", 
		"log", "show", "toast", "warning", "navigate", "dragStart"
	];		

	function processFunctionCall(data) {
		if (allowedFunctions.indexOf(data.m) < 0) {
			throw "IFrame client attempted to call an invalid function";			
		}

		JET[data.m].apply(JET, JSON.parse(data.args));
	}


	// Сross-document messages entry-point.
	function onXDMMessage(msg) {
		utils.trace("XDM Received Host <<< IFrame : ", msg.data);
		var data = JSON.parse(msg.data);

		if (!msg.source && data.a != "unload") {
			// This can happen if there are some unhandler messages in a queue, 
			// which wasn't processed before IFrame was unloaded.
			utils.trace("No msg.source. IFrame was deleted.");
			return;
		}

		switch(data.a) {
			case "init": processInit(msg.source, data); break;
			case "unload": unloadFrame(data); break; 
			case "subCh": processChannelSubscription(msg.source, data); break;
			case "unsubCh": processChannelUnsubscription(msg.source, data); break;
			case "sub": processEventSubscription(msg.source, data); break;
			case "unsub": processEventUnsubscription(msg.source, data); break;
			case "call": processFunctionCall(data); break;
		}
	}

	window.addEventListener("message", onXDMMessage, false);

	return {
	}
});