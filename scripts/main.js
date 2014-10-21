var appId = "byu_test_eikon_game_main";

var eikonEnv="Prod"; // {"Alpha","Beta","Prod"}
var productID="byu_testing";
var tmpQuoteRic="";
var rcsHashSet;
var hiddenTestingLabels;
var createQuoteListDivName;
var quoteSearchIsActive;
var quoteListFormName;
var hostUrl;


//var url = "/snapshot/rest/select?productid=byu_testing&formula=RF.IS.NetSales&identifiers=IBM.N&output=Col%2C+T%7Cva%2C+Row%2C+In%7C";

///////////////////////////////////////////////////////////////
var collectRelatedQuotesFromHistoryHandler;
///////////////////////////////////////////////////////////////
//var collectKeyWordsHandler = calculateKeyWordsHitScoreFn;


$(document).ready(function(){
  try {
    if( $("body #PageStatus").length > 0 ) {  
      $("body #PageStatus").attr({"placeholder" : "Page is ready" });
    } else {
      alert( "!No PageStatus found in the page!");
      //$("body").append("<p id=""PageStatus""></p>");
    }
    
    //alert("rcsHashSet="+rcsHashSet.length);
    //alert("addKeyWordsFn="+addKeyWordsFn);
    initGlobalVarFn();

	$("#newsHitQuoteReportBtn").click(newsHitQuoteReportFn);	
	$("#compareQuotePriceBtn").click(compareQuotePriceFn);
    JET.onLoad(captureNewsFn);
    JET.init({
      ID: appId
    });
	  logFn("page is ready");
  }catch(ex) {
    alert( "in read \n" + ex)
  }
  
});

