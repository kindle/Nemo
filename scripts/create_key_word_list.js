var keyWordsInvestorFormName = "#keyWordsBoardDiv #ownerShipDiv #ownerShipForm";
var keyWordsBusinessSectorFormName = "#keyWordsBoardDiv #businessSectorDiv #businessSectorForm";
var keyWordsIndexFormName = "#keyWordsBoardDiv #indexConstituentDiv #indexConstituentForm";
var keyWordsTRBCFormName = "#keyWordsBoardDiv #TRBCDiv #TRBCForm";

var keyWordsBoardDivName = "#keyWordsBoardDiv";

var indexWeightThresholdName = "#indexConstituentWeightThreshold";
var ownerShipSharePctName = "#ownerShipSharePct";


var rcsHashSet;
var collectIndexesWeightThreshold = 0.2;


function appendLiLableToTagFn(tag, labelId, labelDes) {
  var tmpRicLabel = createLabelTagFn(labelId, labelId, labelId, labelDes, hiddenTestingLabels);
  var tmpLi = $("<li>").append(tmpRicLabel);
  if ( tmpRicLabel.attr("hidden") != undefined ) {
    tmpLi.attr("hidden","hidden");
  }
  tag.append(tmpLi);
}

function addKeyWordsTagFn(keyWordsFormName, arr) {
  var funName = "addKeyWordsTagFn";
  logFn("start in " + funName + " for " + keyWordsFormName + " with arr.length=" + arr.length);
  
  var tmpHostDiv = $(keyWordsFormName);
  

  for(var i=0;i<arr.length;i++) {
    for(var j=0; j<arr[i].rows.length; j++) {
      if(arr[i].rows[j].refCode !=null) {
        var tmpLocateLabelName = 'label[id="'+arr[i].rows[j].refCode+'"]';
        var tmpTag = tmpHostDiv.find(tmpLocateLabelName).parent();	
          // if no related tag, just create one; otherwise, aparseKeyWordsHandlerppend the title info
        if(tmpTag.length==0) {    
          tmpTag = createCheckBoxTagFn(arr[i].rows[j].refCode,
                                       getElementIdStrFn(keyWordsFormName),
                                       arr[i].rows[j].refName, 
                                       nvlFn(arr[i].rows[j].refDes,"") + "\n" + arr[i].rows[j].queryDes,
                                       "Y");
          tmpHostDiv.append(tmpTag);
          appendLiLableToTagFn(tmpTag, arr[i].query, arr[i].rows[j].queryDes);
        } else {
          if (tmpTag.find('label[id="'+arr[i].query+'"]').length==0 ) {
            var tmpChildLabel = tmpTag.find(tmpLocateLabelName);
            tmpChildLabel.attr("title", nvlFn(tmpChildLabel.attr("title"),"") + " " + arr[i].rows[j].queryDes);
  
            appendLiLableToTagFn(tmpTag, arr[i].query, arr[i].rows[j].queryDes);
          }
        }
      }		
    }
  }  
  
  logFn("testing\n"+$("#ownerShipForm").html());
  logFn("end in " + funName + " for " + keyWordsFormName + " with arr.length=" + arr.length);
} //*/

function parseInvestorResponse(quotes, arr, sharePct) {
  var funName = "parseInvestorResponse";
  logFn("start in " + funName + " with arr.length=" + arr.length);
  var tmpArr = new Array(quotes.length);

  for(var i=0;i<quotes.length; i++) {
    tmpArr[i] = {"query" : quotes[i], "rows" : new Array()};
  }
  
  for(var i=1; i<arr.length; i++) {
    if ( arr[i][1] == null || arr[i][1] == "null" ) {
      continue;
    }
    if ( ( sharePct != undefined && !isNaN(sharePct) ) && 
         ( parseFloat(arr[i][2])/100 < parseFloat(sharePct) || arr[i][2]=="null"  || arr[i][2]==undefined ) ) {
      continue;
    }
    var j = quotes.indexOf(arr[i][0]);

    
    tmpArr[j].rows[tmpArr[j].rows.length] = {
      "query"   : arr[i][0], 
      "queryDes": arr[i][0] + "(" + arr[i][2] + "%)", 
      "refCode" : arr[i][1], 
      "refName" : arr[i][1], 
      "refDes"  : undefined 
    };
  }
  
  logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
  return tmpArr; 
}

function parseTRBCResponse(quotes, arr) {
  var funName = "parseTRBCResponse";
  logFn("start in " + funName + " with arr.length=" + arr.length);
  var tmpArr = new Array(quotes.length);
  

  for(var i=0;i<quotes.length; i++) {
    tmpArr[i] = {"query" : quotes[i], "rows" : new Array()};
  }
  
  for(var i=1;i<arr.length;i++) {
  
    var k=quotes.indexOf(arr[i][0]);
    var tmpTRBCcode = "";
    var tmpTRBCName = "";

    for(var j=0;j<5;j++) {
      if ( arr[i][2*j+1]!="null" ) {
        tmpTRBCcode = ( tmpTRBCcode == "" ? "" : tmpTRBCcode + " -> " )+ arr[i][2*j+1];
        tmpTRBCName = ( tmpTRBCName == "" ? "" : tmpTRBCName + " -> " )+ arr[i][2*j+2];

        tmpArr[k].rows[tmpArr[k].rows.length] = {
          "query"   : arr[i][0], 
          "queryDes": arr[i][0], 
          "refCode" : tmpTRBCcode, 
          "refName" : tmpTRBCName, 
          "refDes"  : tmpTRBCcode 
        };
	  } else {
        alert("in " + funName + ": unexpected to have null code in " + JSON.stringify(arr[i]));
      }
    }    
  }
 
    
  logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
  return tmpArr;
}


function parseIndexResponse(quotes, arr, weightThreshold) {
  var funName = "parseIndexResponse";
  logFn("start in " + funName + " with arr.length=" + JSON.stringify(arr));
  var tmpArr = new Array(quotes.length);
  

  for(var i=0;i<quotes.length; i++) {
    tmpArr[i] = {"query" : quotes[i], "rows" : new Array()};
  }
	
  for(var i=1; i<arr.length; i++) {
    if ( arr[i][1] == null || arr[i][1]=="null" ) {
      continue;
    }
    if ( ( weightThreshold != undefined && !isNaN(weightThreshold) ) && 
         ( parseFloat(arr[i][3])<parseFloat(weightThreshold) || arr[i][3]=="null"  || arr[i][3]==undefined ) ) {
      continue;
    }
    var j = quotes.indexOf(arr[i][0]);
    tmpArr[j].rows[tmpArr[j].rows.length] = {
      "query"   : arr[i][0], 
      "queryDes": arr[i][0] + "(" + arr[i][3] + ")", 
      "refCode" : arr[i][1], 
      "refName" : arr[i][1], 
      "refDes"  : arr[i][2]
    };
  }
  
  logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
  return tmpArr;
}



function collectKeyWordsSubFn(quotes, formula, output, keyWordsIde, parseKeyWordsHandler, keyWordsHandler) {
  disableQuoteSearchFn();

  var tmpUrl = hostUrl
    + "/snapshot/rest/select?"
    + "formula="      + formula
    + "&output="      + output
    + "&productid="   + productID
    + "&identifiers=" + quotes
    ;//+ "&uuid="        + uuid; // Alpha
  
  logFn(tmpUrl);
  //SendRequest(tmpUrl, collectTopInvestorsSuccessFn,collectTopInvestorsFailFn);
  var failHandler = function(response) {
      logFn("Fail in call collectKeyWordsSubFn, url=" + tmpUrl + " result=" + JSON.stringify(response));  
      enableQuoteSearchFn();
    };
  SendRequest(tmpUrl, 
    function(response) {
      if (response.status == "Ok") {
        logFn("Success in call collectKeyWordsSubFn, return arr.length=" + response.rows.length + "\nArray Data:\n" + JSON.stringify(response));    
        var tmpArr = parseKeyWordsHandler(quotes, response.rows);
        keyWordsHandler(keyWordsIde, tmpArr);
        //addKeyWordsInvestorsFn(response.rows); 
        enableQuoteSearchFn();
      } else {
        failHandler(response);        
      }
    },
    failHandler);
}

/*
function addKeyWordsBusinessSectorsFn(query, command) {
try{
  var funName = "addKeyWordsBusinessSectorsFn";
  logFn("start in " + funName + " with arr.length=" + JSON.stringify(command.tl));  
  disableQuoteSearchFn();
  var tmpArr = new Array(0);
	
  for(var i=1; i<command.tl.length; i++) {   
    if( rcsHashSet[command.tl[i]]!=undefined ) {  
      tmpArr[tmpArr.length] = {
        "query"   : query, 
        "queryDes": query, 
        "refCode" : command.tl[i], 
        "refName" : rcsHashSet[command.tl[i]]["name"], 
        "refDes"  : rcsHashSet[command.tl[i]]["def"]
      };
    }  
  }
  addKeyWordsTagFn(keyWordsBusinessSectorFormName, tmpArr); 
  enableQuoteSearchFn();
  logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
}catch(ex){alert(ex);}
}//*/




function collectKeyWordsFn(quotes, keyWordsHandler, allAspectsNeeded) {
  var funName = "collectKeyWordsFn";
  try{
  logFn("start in " + funName);
  if (keyWordsHandler==undefined) {
    keyWordsHandlerFn = addKeyWordsTagFn;
  } else {
    keyWordsHandlerFn = keyWordsHandler;
  }
  /*
  if ( allAspectsNeeded=="Y" || $(keyWordsBusinessSectorFormName).prevAll('input[type="checkbox"]').attr("checked")!=undefined) {
    collectKeyWordsFromNewsFn(query, 
                              function(command) {
                                if ( command != undefined && command.rl.length == 1 ) {
                                  for(var i=0;i<command.tl.length;i++) {
                                    if ( command.tl[i].toString()=="E:1" ) // 'E:1' stands for company events in rcs
                                      return "Y";
                                  }
                                }
                                return "N";
                              },
                              5, // whether only requiring one hit
                              function(command) { addKeyWordsBusinessSectorsFn(query, command); },
                              disableQuoteSearchFn,
                              enableQuoteSearchFn,
                              1);
  } //*/                      

  if (allAspectsNeeded=="Y" || $(keyWordsTRBCFormName).prevAll('input[type="checkbox"]').attr("checked")!=undefined) {
    collectKeyWordsSubFn(quotes, 
      "TR.OrgTRBCEconSectorCode%2C+TR.OrgTRBCEconSector%2C"+
        "+TR.OrgTRBCBusinessSectorCode%2C+TR.OrgTRBCBusinessSector%2C"+
        "+TR.OrgTRBCIndustryGroupCode%2C+TR.OrgTRBCIndustryGroup%2C"+
        "+TR.OrgTRBCIndustryCode%2C+TR.OrgTRBCIndustry%2C"+
        "+TR.OrgTRBCActivityCode%2C+TR.OrgTRBCActivity",
      "Col%2CT%7CIn%2Cvalue%2CsortA%2CIn", 
      keyWordsTRBCFormName,
      parseTRBCResponse,
      keyWordsHandlerFn);
  }
  
  
  if (allAspectsNeeded=="Y" || $(keyWordsInvestorFormName).prevAll('input[type="checkbox"]').attr("checked")!=undefined) {
    var isCallNeeded = 'Y';
    try {
      var sharesThreshold = undefined;
      var tmpStr = $(keyWordsInvestorFormName).parent("div").find(ownerShipSharePctName).val();
      if ( tmpStr != undefined ) {
        sharesThreshold = parseFloat(tmpStr);
        if ( sharesThreshold > 1.0 || sharesThreshold < 0.0 ) {
          alert("Investor share percentage can only accept value between [0.0,1.0].\n" + tmpStr + " is invalid.");  
          isCallNeeded = "N";
        }
      }
    } catch(ex) {
      alert("Investor share percentage can only accept value between [0.0,1.0].\n" + ex);
      isCallNeeded = "N";
    }
    if ( isCallNeeded == "Y" ) {
      collectKeyWordsSubFn(quotes, 
        "OWN.OW.PercentOfShares(TOP=10)",
        "Col%2C+T%7CIn%2C+investorname%2Cva%2C+sortA%2C+In%2C+sortD%2C+va", 
        keyWordsInvestorFormName,
        function(quotes, arr) {
          return parseInvestorResponse(quotes, arr, sharesThreshold); 
        },
        keyWordsHandlerFn);
    }
  }
  

  // collect index constinuent
  
  if (allAspectsNeeded=="Y" || $(keyWordsIndexFormName).prevAll('input[type="checkbox"]').attr("checked")!=undefined) {
    var isCallNeeded = 'Y';
    try {
      var weightThreshold = undefined;
      var tmpStr = $(keyWordsIndexFormName).parent("div").find(indexWeightThresholdName).val();
      if ( tmpStr != undefined ) {
        weightThreshold = parseFloat(tmpStr);
        if ( weightThreshold > 1 || weightThreshold < 0 ) {
          alert("Index weight threshold can only accept value between [0.0,1.0].\n" + tmpStr + " is invalid.");  
          isCallNeeded = "N";
        }
      }
    } catch(ex) {
      alert("Index weight threshold can only accept value between [0.0,1.0].\n" + ex);
      isCallNeeded = "N";
    }
    if ( isCallNeeded == "Y" ) {
      collectKeyWordsSubFn(quotes, 
        "TR.MemberIndexName%2C+TR.MemberWeightingPercent",
        "Col%2C+T%7CIn%2Cindexric%2C+value%2C+SortA%2C+In%2C+value", 
        keyWordsIndexFormName,
        function(quotes, arr) {
          return parseIndexResponse(quotes, arr, weightThreshold); 
        },
        keyWordsHandlerFn);
    }
  }
  logFn("end in " + funName);
  }catch(ex) {alert(funName + "\n" + ex)}
}



