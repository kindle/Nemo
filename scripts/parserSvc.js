angular.module("nemoApp")
.factory("parserSvc", ["logSvc", function (logSvc) {
    return {
        ownershipParser: function(quotes, arr, sharePct) {
            var funName = "parseInvestorResponse";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
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
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr; 
        },
        businessClassificationParser : function(quotes, arr) {
            var funName = "parseTRBCResponse";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
            var tmpArr = new Array(quotes.length);


            for (var i = 0; i < quotes.length; i++) {
                tmpArr[i] = { "query": quotes[i], "rows": new Array() };
            }

            for (var i = 1; i < arr.length; i++) {

                var k = quotes.indexOf(arr[i][0]);
                var tmpTRBCcode = "";
                var tmpTRBCName = "";

                for (var j = 0; j < 5; j++) {
                    if (arr[i][2 * j + 1] != "null") {
                        tmpTRBCcode = (tmpTRBCcode == "" ? "" : tmpTRBCcode + " -> ") + arr[i][2 * j + 1];
                        tmpTRBCName = (tmpTRBCName == "" ? "" : tmpTRBCName + " -> ") + arr[i][2 * j + 2];

                        tmpArr[k].rows[tmpArr[k].rows.length] = {
                            "query": arr[i][0],
                            "queryDes": arr[i][0],
                            "refCode": tmpTRBCcode,
                            "refName": tmpTRBCName,
                            "refDes": tmpTRBCcode
                        };
                    } else {
                        alert("in " + funName + ": unexpected to have null code in " + JSON.stringify(arr[i]));
                    }
                }
            }


            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr;
        },
        indexParser: function(quotes, arr, weightThreshold) {
          var funName = "parseIndexResponse";
            logSvc.logFn("start in " + funName + " with arr.length=" + JSON.stringify(arr));
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
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr;
        }
    };
}]);