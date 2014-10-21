var disabledCountAttrName = "disabledCnt";

var log;
var appender;



function nvlFn(valueA, valueB) {
  return valueA == undefined ? valueB : valueA;
}

function getDateStr(dateIn) {
  var tmpDate = new Date(dateIn);
  return tmpDate.getFullYear() + ""
         + ( (tmpDate.getMonth()+1)<10 ? "0" + (tmpDate.getMonth()+1) : (tmpDate.getMonth()+1) ) + ""			
         + ( tmpDate.getDate()<10 ? "0" + tmpDate.getDate() : tmpDate.getDate() );
}

function logFn(msg) {
try{
  if ( log == undefined ) {
    log = log4javascript.getLogger("main");
    appender = new log4javascript.PopUpAppender();
    log.addAppender(appender);
    log.info("log4javascript in-page loaded.");
    appender.show();
  }
  
  var oldValue = $("body #PageStatus").val();
  $("body #PageStatus").val(oldValue + "\n" + Date() + " : \n  " + msg);
  //console.log('logFn - ' + msg); 
  log.info('logFn - ' + msg); 
}
catch(ex) {alert(ex);}
}

function disableQuoteSearchFn() {
  //var hostDiv=$("#user_inputs_div");
  var hostDiv=$("body");
  var newCnt = 1;
  if ( hostDiv.attr(disabledCountAttrName)==0 || hostDiv.attr(disabledCountAttrName) == undefined ) {
    hostDiv.attr(disabledCountAttrName,1);
    hostDiv.find("input").attr("disabled","disabled");
    hostDiv.find("button").attr("disabled","disabled");  
  }
  else {
    newCnt = newCnt + parseInt(hostDiv.attr(disabledCountAttrName));
    hostDiv.attr(disabledCountAttrName, newCnt);
  }
  logFn("in disableQuoteSearchFn: user_inputs_div.disableCnt = " + hostDiv.attr(disabledCountAttrName));
}

function enableQuoteSearchFn() {
  var hostDiv=$("body");
  var newCnt = -1;
  
  if ( hostDiv.attr(disabledCountAttrName)<=0 || hostDiv.attr(disabledCountAttrName) == undefined ) {
    alert("Warning: wrong in enableQuoteSearchFn with unexpected enabling!" + hostDiv.attr(disabledCountAttrName));
    hostDiv.attr(disabledCountAttrName,0);
  } else {
    newCnt = newCnt + parseInt(hostDiv.attr(disabledCountAttrName));
    hostDiv.attr(disabledCountAttrName,newCnt);
  }
  
  if (hostDiv.attr(disabledCountAttrName)==0) {
    quoteSearchIsActive="Y";
    hostDiv.find("input").removeAttr("disabled");
    hostDiv.find("button").removeAttr("disabled");
  }
  
  logFn("in enableQuoteSearchFn: user_inputs_div.disableCnt = " + hostDiv.attr(disabledCountAttrName));
}

function createLabelTagFn(labelId, labelValue, labelText, lableTitle, labelIsHidden) {
  var tmpLabel = $("<label>").attr({
    "id"    : labelId,
    "value" : labelValue
    }).text(labelText);
	
  if (lableTitle!=undefined) {
    tmpLabel.attr("title",lableTitle);
  }
  if (labelIsHidden=="Y") {
    tmpLabel.attr("hidden","hidden");
  }
  return tmpLabel;
}

function getElementIdStrFn(idStr) {
  return idStr.replace(/#/g,"").replace(/ /g,".");
}

function createCheckBoxTagFn(inputId, inputName, inputValue, labelTitle, inputIsChecked) {

  var tmpInput = $("<input>").attr({
    "id"   : inputId,
    "type" :"checkbox",
    "name" : inputName,
    "value": inputValue,
	"disabled" : "disabled"
    });
	
  if (inputIsChecked=="Y") {
    tmpInput.attr("checked","checked");
  }
  
  tmpInput.click(function(){
      if($(this).attr("checked")!=undefined) 
        $(this).removeAttr("checked");
      else
        $(this).attr("checked","checked");
    });
	
  var tmpLabel = createLabelTagFn(inputId, inputValue, inputValue, labelTitle, "N");
  return $("<p>").append(tmpInput,tmpLabel);

}


function openNews(query) {
	JET.navigate({
		name: "News",
		entities: [{
			NewsQuery: query
		}]
		 //,target: "tab"
	})
}

function openCompany(query) {

try {
  if (JET.Entity!=undefined && JET.Entity.RIC!=undefined) {
    JET.contextChange([{
  RIC: query
}]);
  }
  else {
	JET.navigate({
	    name: "Graph",
		Entity: [{
			RIC: query
		}]
	});
	alert(JSON.stringify(JET.ContextData));
  }
}
catch(ex) {alert("in openCompany :" + ex)}
/*
		JET.navigate({
			name: "Graph",
			entities: [{"RIC": "TRI.N"]}]
		});//*/
}


function SendRequest (url, successHandler, errorHandler) {
/*
	var parameters = {};
	parameters.method = "get";

	parameters.contentType = "text/json;charset=utf-8";
	parameters.requestHeaders = { SOAPAction: "" };
	parameters.onSuccess = successHanlder;
	parameters.onError = errorHanlder;

	// This header is ignored if sent over a PA-protected connection
	//parameters.setRequestHeader = { reutersuuid: uuid };

	//alert("call SendRequest");
	/*
	$("sta").text("before calling SendRequest: " + url +"<br>" + JSON.stringify(parameters, undefined, 2));
	new Ajax.Request(url, parameters);
	$("sta").text("after calling SendRequest");
*/
//	$.get(url+"&uuid="+"PAXTRA-913530672", successHandler,"json").fail(errorHandler);
	

  var xmlhttp;
  var uuid = JET.getUserInfo().UUID;//"PAXTRA27775";//"PAXTRA-913530672";//JET.getUserInfo().UUID;
  
  if (window.XMLHttpRequest!=undefined) {
    xmlhttp=new XMLHttpRequest();
  } 
  
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState==4 ) {
      var response = eval ("(" + xmlhttp.response + ")");
      logFn("in SendRequest: " + response.Ok);
      if ( xmlhttp.status==200 ) successHandler( response);
      else errorHandler(response);
    }
  }
   
  xmlhttp.open("GET",url+"&uuid="+uuid,true);
  xmlhttp.setRequestHeader("reutersuuid",uuid);
  xmlhttp.send();
}
