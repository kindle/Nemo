angular.module("nemoApp")
.factory("parserSvc", ["logSvc", 'dialogs', function (logSvc, dialogs) {
    return {
        quoteRefParser: function(arr) {
            var funName = "quoteRefParser";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
            var tmpArr = new Array(arr.length-1);
            for(var i=1;i<arr.length;i++) {
                tmpArr[i-1] = {"RIC" : arr[i][0], "CmpName" : null, "BusinessSummary" : null};
                if ( arr[i][2] != null && arr[i][2] != '{"f":"0"}' ) tmpArr[i-1].CmpName = arr[i][2];
                if ( arr[i][3] != null ) tmpArr[i-1].BusinessSummary = arr[i][3];
            }
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr; 
        },
		
		commonStatisticsParse: function(quotes, arr) {
            var funName = "commonStatisticsParse";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
            var tmpArr = new Array(quotes.length);

            for(var i=0;i<quotes.length; i++) {
                tmpArr[i] = {"query" : quotes[i], "rows" : new Array()};
            }
  
            for(var i=1; i<arr.length; i++) {                                
                var j = quotes.indexOf(arr[i][0]);
    
                tmpArr[j].rows[tmpArr[j].rows.length] = {
                    "query"     : arr[i][0], 
                    "Price2BV"  : arr[i][1], 
                    "Price2EPS" : arr[i][2], 
                    "Price2CF"  : arr[i][3], 
                    "EV2EBITDA" : arr[i][4]
                };
            }
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr; 
        },
		
		businessSegementParser: function(quotes, arr) {
            var funName = "businessSegementParser";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
            var tmpArr = new Array(quotes.length);
            var pt = -1;
            var patt = new RegExp("[^0-9\, ]+");


            for (var i = 0; i < quotes.length; i++) {
                tmpArr[i] = { "query": quotes[i], "rows": new Array(), "segmtl" : 0 };
            }
            for (var i = 5; i < arr[0].length; i++) {
                logSvc.logFn(JSON.stringify(arr[0][i]) );
                if (arr[0][i].v == "Total Revenue") {
                   pt = i; break;
                }
            }
            if ( pt < 0 ) {
			    logSvc.logFn("error in " + funName + " no col of 'Total Revenue' found in the return");
                if( arr[0].length > 5 ) {
                    dialogs.notify("Warning", "error in " + funName + " no col of 'Total Revenue' found in the return");
                }
                return tmpArr;
            }
  
            for(var i=1; i<arr.length; i++) {                
                var j = quotes.indexOf(arr[i][0]);

                if ( arr[i][2] == "BUS_SEGMTL" ) {
                    tmpArr[j].segmtl = arr[i][pt];
                    break;
                }
//                if ( patt.exec(arr[i][2]) != null || arr[i][2] != "OTHERS") {
//                    continue;
//                }
                if ( arr[i][pt]!=null && arr[i][pt]!="null" )
                    tmpArr[j].rows[tmpArr[j].rows.length] = {                       
                        "query"      : arr[i][0],                     
                        "fperiod"    : arr[i][1], 
                        "SegmentName": arr[i][3], 
                        "Currency"   :  ( arr[i][pt]!=null && arr[i][pt]!="null" ) ? arr[i][4]  : "", 
                        "TotalRevenue": ( arr[i][pt]!=null && arr[i][pt]!="null" ) ? arr[i][pt] : "",
                        "Weight"     : arr[i][pt] 
                    };
            }
			
            for (var i = 0; i < quotes.length; i++) {
                for(var j=0; j<tmpArr[i].rows.length; j++) {
                    tmpArr[i].rows[j].Weight = ( Math.round(tmpArr[i].rows[j].TotalRevenue / tmpArr[i].segmtl * 10000)/100 ) + "%";
                }
            }
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr; 

        },
		
        geographicSegementParser: function(quotes, arr) {
            var funName = "geographicSegementParser";
            logSvc.logFn("start in " + funName + " with arr.length=" + arr.length);
            var tmpArr = new Array(quotes.length);
            var pt = -1;
            var patt = new RegExp("[^0-9\, ]+");

            for (var i = 0; i < quotes.length; i++) {
                tmpArr[i] = { "query": quotes[i], "rows": new Array(), "segmtl" : 0 };
            }
            for (var i = 5; i < arr[0].length; i++) {
                logSvc.logFn(JSON.stringify(arr[0][i]) );
                if (arr[0][i].v == "Total Revenue") {
                   pt = i; break;
                }
            }
            if ( pt < 0 ) {
			    logSvc.logFn("error in " + funName + " no col of 'Total Revenue' found in the return");
                if( arr[0].length > 5 )
                    dialogs.notify("Warning", "error in " + funName + " no col of 'Total Revenue' found in the return");
                return tmpArr;
            }
  
            for(var i=1; i<arr.length; i++) {               
                var j = quotes.indexOf(arr[i][0]);
				
                if ( arr[i][2] == "GEOG_SEGMTL" ) {
                    tmpArr[j].segmtl = arr[i][pt];
                    break;
                }

//                if ( arr[i][2] == "GEOG_CONSTL" || arr[i][2] == "EXPOTH" || arr[i][pt] == null ) {
//                    continue;
//                }
    
                if ( arr[i][pt]!=null && arr[i][pt]!="null" )
                    tmpArr[j].rows[tmpArr[j].rows.length] = {                       
                        "query"      : arr[i][0],                     
                        "fperiod"    : arr[i][1], 
                        "SegmentName": arr[i][3], 
                        "Currency"   :  ( arr[i][pt]!=null && arr[i][pt]!="null" ) ? arr[i][4]  : "", 
                        "TotalRevenue": ( arr[i][pt]!=null && arr[i][pt]!="null" ) ? arr[i][pt] : "",
                        "Weight"     : arr[i][pt] 
                   };
            }
			
            for (var i = 0; i < quotes.length; i++) {
                for(var j=0; j<tmpArr[i].rows.length; j++) {
                    tmpArr[i].rows[j].Weight = ( Math.round(tmpArr[i].rows[j].TotalRevenue / tmpArr[i].segmtl * 10000)/100 ) + "%";
                }
            }
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr; 

        },
        
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
                            "refName": arr[i][2 * j + 2],//tmpTRBCName, //arr[i][2 * j + 2],
                            "refDes": tmpTRBCcode
                        };
                    } else {
                        dialogs.notify("Warning", "Error in " + funName + ": unexpected to have null code in " + JSON.stringify(arr[i]));
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
        }, 
        priceParser: function(quotes, arr) {
            var funName = "priceParser";
            logSvc.logFn("start in " + funName + " with arr.length=" + JSON.stringify(arr));
            var tmpArr = new Array(quotes.length);  

            for(var i=0;i<quotes.length; i++) {
                tmpArr[i] = {"query" : quotes[i], "rows" : new Array()};
            }
	
            for(var i=1; i<arr.length; i++) {
                if ( arr[i][1] == null || arr[i][1]=="null" ) {
                    continue;
                }
                var j = quotes.indexOf(arr[i][0]);
                tmpArr[j].rows[tmpArr[j].rows.length] = {
                    "query"   : arr[i][0], 
                    "date"    : arr[i][1], 
                    "calcdate": arr[i][2], 
                    "priceClose": arr[i][3]
                };
            }
  
            logSvc.logFn("end in " + funName + " with arr=" + JSON.stringify(tmpArr));
            return tmpArr;
        }
		
		, calcStandardDeviation : function(arr) {
            var tmpArr = new Array();
            var tmpSum = 0;
            var tmp = 0;
            for(var i=0;i<arr.length-1;i++) {
                tmp = arr[i+1] - arr[i];
                tmpArr.push(tmp);
                tmpSum = tmpSum + tmp;
            }
            var tmpAve = tmpSum / tmpArr.length;
            var tmpSum = 0;
            for(var i=0;i<tmpArr.length;i++) {
                tmp = Math.pow(tmpArr[i]-tmpAve,2);
                tmpSum = tmpSum + tmp;
            }
            tmpAve = tmpSum / tmpArr.length;
            tmp = Math.pow(tmpAve, 0.5);
            return tmp;
        },
		 
        calcCovariance : function(arr1, arr2, standardDeviations) {
            if( arr1.length != arr2.length || standardDeviations.length != 2 ) {
                dialogs.notify("Warning", "ERROR in calcCovariance: expect to have two arrays with the same length");
                return 0;
            }
            var tmpArr1 = new Array();
            var tmpSum1 = 0;
            var tmp = 0;
            for(var i=0;i<arr1.length-1;i++) {
                tmp = arr1[i+1] - arr1[i];
                tmpArr1.push(tmp);
                tmpSum1 = tmpSum1+ tmp;
            }
            var tmpAve1 = tmpSum1 / tmpArr1.length;
			
            var tmpArr2 = new Array();
            var tmpSum2 = 0;
            tmp = 0;
            for(var i=0;i<arr2.length-1;i++) {
                tmp = arr2[i+1] - arr2[i];
                tmpArr2.push(tmp);
                tmpSum2 = tmpSum2+ tmp;
            }
            var tmpAve2 = tmpSum2 / tmpArr2.length;

            tmp = 0;
            for(var i=0;i<tmpArr1.length;i++) {
                tmp = tmp + (tmpArr1[i]-tmpAve1) * (tmpArr2[i]-tmpAve2);
            }
            tmp = tmp / tmpArr2.length;
			
            return tmp/(standardDeviations[0]*standardDeviations[1]);
        },
        calcVolatility : function(holdingWeights, standardDeviations, covariance) {
            var t0 = Math.pow(holdingWeights[0],2) * Math.pow(standardDeviations[0], 2);
            var t1 = Math.pow(holdingWeights[1],2) * Math.pow(standardDeviations[1], 2);
			var t2 = holdingWeights[0] * holdingWeights[1] * standardDeviations[0] * standardDeviations[1] * covariance;
            return Math.pow(t0+t1+t2*2,0.5);
        },
		
        calcValueRisks : function(cfgArr, lastestQuotes, standardDeviations, volatility) {
            var arr = new Array();
            for(var i=0;i<cfgArr.length;i++) {
                var vr_x = cfgArr[i].Factor * standardDeviations[0] * lastestQuotes[0] / 100;
                var vr_y = cfgArr[i].Factor * standardDeviations[1] * lastestQuotes[1] / 100;
                var vr_xy= volatility * cfgArr[i].Normsinv * 1;
                arr.push({"VR_X" : vr_x, "VR_Y" : vr_y, "VR_XY" : vr_xy});
            }
            return arr;
        }
    };
}]);