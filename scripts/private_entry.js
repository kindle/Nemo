
var uuid = "null";//"PADACT-002";
var eikonEnv="Alpha"; // {"Alpha","Beta","Prod"}
var productID="byu_testing";
var tmpQuoteRic="";
//var url = "/snapshot/rest/select?productid=byu_testing&formula=RF.IS.NetSales&identifiers=IBM.N&output=Col%2C+T%7Cva%2C+Row%2C+In%7C";



$(document).ready(function(){
  
  if ( eikonEnv == "Alpha") {
  	uuid = "PAXTRA-913530672";
  	hostUrl = "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha

  }
  if ( eikonEnv == "Beta")  {
  	uuid = "PAXTRA27775";//"PAXTRA-913530672";
  	hostUrl = "http://datacloud-beta.int.thomsonreuters.com:1080"; // Beta
  	
  }
  if (eikonEnv=="Prod") {
  	uuid = "SL1-2P99Y6B"; // Use your own internal UUID if you have
    hostUrl = "http://datacloud-hdc.int.thomsonreuters.com:1080"; // Prod
  	
  }


  if( $("body #PageStatus").length > 0 ) {  
    $("body #PageStatus").attr({"placeholder" : "Page is ready" });
  } else {
    $("body")
    alert( "!No PageStatus found in the page!");
    //$("body").append("<p id=""PageStatus""></p>");
  }
	
});