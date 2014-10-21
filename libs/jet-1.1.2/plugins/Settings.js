/* JET: version = 1.1.2, released date = 30/4/2014 */

//Settings JET extension to handle access Eikon settings
//1. Read Setting
//2. Write Setting

JET.extend(0, "Settings", function(_u) {	

	var api = {};
	var baseSubID = ((new Date()).getTime() + "");
	var lastSubID = 0;
	
	// For the receiving channel name
	JET.onLoad(function() {
        if (JET.ContainerDescription && JET.ContainerDescription.GUID) {
            baseSubID = JET.ContainerDescription.GUID;
        }
    });
	
	// Read Setting
	api.read = function(handler, data, errorHandler)  {
	
		if(handler && (typeof (handler) == "function") && data && (typeof (data) == "object") && data.providerName && (typeof (data.providerName) == "string") && data.settingName && (typeof (data.settingName) == "string")) {
		
			// Creating channel name for receiving
			var channelID = baseSubID + (lastSubID++);
			responseChannelName = "/eikon/settings_" + channelID;
			
			// Subscribe for receiving reposonse from the container later later
			JET.subscribe(responseChannelName, function(resData) {
				
				var jsonResult = JSON.parse(resData);
				
				if(jsonResult) {
				
					if(jsonResult.responseChannel && (typeof (jsonResult.responseChannel) == "string")) {
						 // Unsubscribe
						JET.unsubscribe(jsonResult.responseChannel);
						
					} else {
			
						throw new Error("Invalid data type returned from container");
					}
					
					if(jsonResult.settingName && (typeof (jsonResult.settingName) == "string") && jsonResult.result && (typeof (jsonResult.result) == "boolean") && (jsonResult.result == true)) {
						// Call the handler
						handler.call(window, jsonResult.settingName);
						
					} else {
						
						if(errorHandler && (typeof (errorHandler) == "function")) {
						
							errorHandler.call(window, "Invalid data type or error returned from container");
						} else {
						
							throw new Error("Invalid data type or error returned from container");
						}
					}
				}
			});

			// Publishing the request. This is an asynchronous request. When the response is received, the handler passed will be called.
			data.responseChannel = responseChannelName;
			data.requestType = "r";
			JET.publish("/eikon/settings", _u.toJson(data));
			
		} else {
			
			throw new Error("Invalid data type passed. First parameter must be a handler and the second one an object with providerName and settingName as string attributes. expandValue as bool is optional in the object");
		}
	}
	
	//Write Setting
	api.write = function(data) {
		
		if(data && (typeof (data) == "object") && data.providerName && (typeof (data.providerName) == "string") && data.settingName && (typeof (data.settingName) == "string") && data.settingValue && (typeof (data.settingValue) == "string")) {
		
			// Publish the write setting request. Asynchronous. The container should write it.
			data.requestType = "w";
			JET.publish("/eikon/settings", _u.toJson(data));
			
		} else {
			
			throw new Error("Invalid data type passed. The parameter must be an object with providerName and settingName as string attributes.");
		}
	}
	

	return api;
});