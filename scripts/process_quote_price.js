var hitQuoteDivName = "#hit_quotes_div";
var hitQuoteTSDivName = "#hitQuoteTSDiv";
var hitQuoteScoreDivName = "#hitQuoteScoreDiv";
var newsHitQuoteReportBtnName = "#newsHitQuoteReportBtn";
var userQuoteListDataListName  = "#userQuoteForPriceCmpIpt";
var newsQuoteListDataListName  = "#newsQuoteForPriceCmpIpt";
var compareQuotePriceBtnName   = "#hit_quotes_div #hitQuoteTSDiv #compareQuotePriceBtn";
var hitQuoteScoreReportDivName = "#hit_quotes_div #hitQuoteScoreDiv";
var newsHitQuoteReportTableName = "#newsHitQuoteReportTable";

var quoteTSCmpReportTableName = "#quoteTSCmpReportTable";

var tableHeaderRowClass="l-table-row s-header-row";
var tableDataRowClass  ="l-table-row";
var tableKeyColClass   ="l-table-cell";
var tableValueColClass ="l-table-cell align3 monospace";

function newsHitQuoteReportFn() {
  var funName = "newsHitQuoteReportFn";
  logFn("start in " + funName);
try{
// update quote list in hit quote score div
  var userQuoteList = $(createQuoteListDivName).find(quoteListFormName).find('input[type="checkbox"][checked="checked"]');
  var newsQuoteList = $(relatedCmpDivName).find('li[class="'+newsQuoteClassName+'"]');
  
  var tmpSelect = $(hitQuoteDivName).find(hitQuoteTSDivName).find('select'+userQuoteListDataListName);
  tmpSelect.children().remove();
  for(var i=0;i<userQuoteList.length;i++) {
    tmpSelect.append( $("<option>").attr("value",$(userQuoteList[i]).attr("id") ).text($(userQuoteList[i]).attr("id")) );
  }
  
  var tmpSelect = $(hitQuoteDivName).find(hitQuoteTSDivName).find('select'+newsQuoteListDataListName);
  tmpSelect.children().remove();
  for(var i=0;i<newsQuoteList.length;i++) {
    tmpSelect.append( $("<option>").attr("value",$(newsQuoteList[i]).attr("id") ).text($(newsQuoteList[i]).attr("id"))  );
  }
  //logFn($(userQuoteListDataListName).parent().html());

  // generate the hit report
  
  var tmpTable =  $(hitQuoteDivName).find(hitQuoteScoreDivName).find('table'+newsHitQuoteReportTableName).children("tbody");
  
  var keyWordsForm = $(keyWordsBoardDivName).find("form");
  
  var thNames = new Array("Quote");
  var tmpHeader = $("<tr>").attr("class",tableHeaderRowClass).append($("<td>").attr("class","l-table-cell").text("Quote"));
  for(var i=0;i<keyWordsForm.length;i++) {	
    if($(keyWordsForm[i]).prevAll('input[type="checkbox"]').attr("checked")!=undefined) {
      var tmpStr = $(keyWordsForm[i]).attr("id");
      thNames[thNames.length] = tmpStr;
      tmpHeader.append($("<td>").text(tmpStr));
	}
  }//
  
  if ( thNames.length == 1 ) {
    alert("No reports can be generated, when no keyword categories are selected!");
	return;
  }
  tmpTable.append(tmpHeader);  
  

  for(var i=0;i<newsQuoteList.length;i++) {
    var tmpData = $("<tr>").attr("class",tableDataRowClass)
                    .append( $("<td>")
                               .attr("class",tableKeyColClass)
                               .text($(newsQuoteList[i]).attr("id")) );
    var tmpHitScore = eval("(" + $(newsQuoteList[i]).attr(hitScoreAttName)+ ")"); 
    for(var j=1;j<thNames.length;j++) {
      tmpData.append( $("<td>")
                        .attr("class",tableValueColClass)
                        .text(tmpHitScore[thNames[j]]) );
    }
    tmpTable.append(tmpData);
  }//*/
  logFn("end in " + funName);
} catch(ex) {alert("in " + funName + " " + ex)}
}

function compareQuotePriceCmpResFn(res) {
  var funName = "newsHitQuoteReportFn";
  logFn("start in " + funName);
try{
  var tmpTable =  $(hitQuoteDivName).find(hitQuoteTSDivName).find('table'+quoteTSCmpReportTableName).children("tbody");
  tmpTable.children().remove();
  var tmpHeader = $("<tr>").attr("class",tableHeaderRowClass)
                    .append($("<td>").attr("class",tableKeyColClass).text("Quote"))
                    .append($("<td>").attr("class",tableValueColClass).text("AveragePrice"))
                    .append($("<td>").attr("class",tableValueColClass).text("Div"))
                    .append($("<td>").attr("class",tableValueColClass).text("DivCorr"))
  tmpTable.append(tmpHeader);
  
  for(var i=0;i<res.length;i++) {
    var tmpData = $("<tr>").attr("class",tableDataRowClass)
                    .append($("<td>").attr("class",tableKeyColClass).text(res[i].query))
                    .append($("<td>").attr("class",tableValueColClass).text((res[i].stat.sum/res[i].rows.length)) )
                    .append($("<td>").attr("class",tableValueColClass).text((res[i].stat.div)) )
                    .append($("<td>").attr("class",tableValueColClass).text((res[i].stat.divR)) );
    tmpTable.append(tmpData);
  }//*/
  logFn("end in " + funName);
} catch(ex) {alert("in " + funName + " " + ex)}
}

function quoteTSCalcFn(quotes, arr) {
  var funName = "quoteTSCalcFn";
  logFn("start in " + funName);
try{
  var tmpArr = new Array(quotes.length);
  for(var i=0;i<quotes.length;i++) {
    tmpArr[i] = {"query" : quotes[i], "rows": new Array(0), "stat": {} };
  }
  
  //collect the data
  for(var i=1;i<arr.length;i++) {
    if ( arr[i][1]==null || arr[i][1]=="null" || arr[i][4] == null || arr[i][4]=="null"	) {
      continue;
    }
	if( i>2 && arr[i-1][2] == arr[i][2] && arr[i-1][0] == arr[i][0] ) {
      continue;
    }
    var j = quotes.indexOf(arr[i][0]);
	var v = parseFloat(arr[i][4]);
	//alert(j+"\n"+v+" " + arr[i][0] + "," + JSON.stringify(arr[i]))
	var t = tmpArr[j].rows.length;
	
    tmpArr[j].rows[t] = { "cdate" : arr[i][1], "close_value" : v };
    if( tmpArr[j].stat.sum == undefined ) {
      tmpArr[j].stat.sum = parseFloat(0.0);
    }
	tmpArr[j].stat.sum = v + tmpArr[j].stat.sum; 
  }//
  
  //
  var tmpVSum = parseFloat(0.0);
  for(var i=0;i<tmpArr.length; i++) {
    var tmpV = parseFloat(0.0);
    for(var j=0;j<tmpArr[i].rows.length;j++) {
      tmpV = tmpV + Math.pow(tmpArr[i].rows[j].close_value/(tmpArr[i].stat.sum/tmpArr[i].rows.length)-1, 2);	  
	}	
    tmpArr[i].stat.div = tmpV/tmpArr[i].rows.length;
    tmpVSum = tmpVSum + tmpV;
  }
  for(var i=0;i<tmpArr.length; i++) {
    tmpArr[i].stat.divR = Math.pow(tmpArr[i].stat.div/(tmpVSum/tmpArr.length),2);
  }//*/
  logFn(JSON.stringify(tmpArr));
  logFn("end in " + funName);
  return tmpArr;
}catch(ex) {alert("in " + funName + " "+ ex)}
}

function collectQuoteTS(quotes, tsHandler, resHandler) {
  var funName = "collectQuoteTS";
  disableQuoteSearchFn();
  var formula = "";
  var sysDate = new Date();  
  var eDate = getDateStr(sysDate);  // set the endDate !!

  var durLen = 30; // set the duration !!
  
  var sDate = getDateStr((new Date()).setTime(sysDate.getTime()-durLen *24*3600*1000));
  
  var tmpUrl = hostUrl
    + "/snapshot/rest/select?"
    + "formula="      + "TR.PriceClose%28SDATE%3D"+sDate+"%2CEdate%3D"+eDate+"%2Ccurn%3DUSD%29"
    + "&output="      + "Col%2CT%7Cinstrument%2Ccalcdate%2Cdate%2C+currency%2Cvalue%2C+sortA%2Cinstrument%2C+sortD%2C+calcdate"
    + "&productid="   + productID
    + "&identifiers=" + quotes
    ;//+ "&uuid="        + uuid; // Alpha
  
  logFn(tmpUrl);
  //SendRequest(tmpUrl, collectTopInvestorsSuccessFn,collectTopInvestorsFailFn);
  var failHandler = function(response) {
      logFn("Fail in call "+funName+", url=" + tmpUrl + " result=" + JSON.stringify(response));  
      enableQuoteSearchFn();
    };
  SendRequest(tmpUrl, 
    function(response) {
      if (response.status == "Ok") {
        logFn("Success in call "+funName+", return arr.length=" + response.rows.length + "\nArray Data:\n" + JSON.stringify(response.rows));    
        var tmpRes = tsHandler(quotes, response.rows);
        resHandler(tmpRes);
        //addKeyWordsInvestorsFn(response.rows); 
        enableQuoteSearchFn();
      } else {
        failHandler(response);        
      }
    },
    failHandler);
}

function compareQuotePriceFn() {

  var funName = "compareQuotePriceFn";
  logFn("start in " + funName);
try{
  var tmpStr = getElementIdStrFn(userQuoteListDataListName);
  tmpStr = tmpStr.substring(tmpStr.lastIndexOf("\.")+1);

  var in1 = $(hitQuoteDivName).find('select[id="'+tmpStr+'"]');
  
  tmpStr = getElementIdStrFn(newsQuoteListDataListName);
  tmpStr = tmpStr.substring(tmpStr.lastIndexOf("\.")+1);
  var in2 = $(hitQuoteDivName).find('select[id="'+tmpStr+'"]');
  

  if ( in1.val() == undefined || in2.val() == undefined ) {
    alert("Two valid quotes are required!" + "\n" + in1.html());
  }
  alert("Will compare the price of two quotes : " + in1.val() + " v.s. " + in2.val());
  
  collectQuoteTS(new Array(in1.val(), in2.val()), quoteTSCalcFn, compareQuotePriceCmpResFn);

//  collectQuoteTS(new Array("IBM.N", "000002.SZ"), quoteTSCalcFn, compareQuotePriceCmpResFn);
  
  logFn("end in " + funName);
} catch(ex) {alert("in " + funName + " " + ex)}
}//*/