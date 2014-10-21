var createQuoteListDivName = "#createQuoteListDiv";
var quoteListFormName = "#quoteListForm";


var quoteSearchUserInputName = "#quoteSearchUserInput";

function getPrimaryQuote(query, onSuccessFn, onFailFn) {
try{
  var quoteValidationStr = "/snapshot/rest/select?formula=TR.PrimaryQuote&output=Col%2CT%7Cva&productid="+productID+"&identifiers="+query;
  var tmpUrl = hostUrl + quoteValidationStr;// + "&uuid=" + uuid; // Alpha
  logFn("tmpUrl="+tmpUrl);

  SendRequest(tmpUrl, 
              function(response) {
                var isOk = quoteSearchSuccessFn(response, onFailFn);
                if ( isOk == "Y" ) {
                  if( onSuccessFn != undefined ) {
                    onSuccessFn(response);
                  }
                  return response.rows[1][0];
                }
              },
			  function(response) {
                onFailFn(response);
                quoteSearchFailFn(response);
              });  
}catch(ex) {logFn(ex);}
}

//function validateQuoteRicFn() {
//  var funName = 'validateQuoteRicFn';
//  logFn("start in " + funName);
//try{
//  disableQuoteSearchFn() ;
  
//  var hostDiv=$(createQuoteListDivName);
//  var tmpForm=hostDiv.find(quoteListFormName);
//  var tmpQuoteRic = hostDiv.find(quoteSearchUserInputName).val();

//  if( tmpForm.children().length>0 && 
//	  tmpForm.find('[id="'+tmpQuoteRic+'"]').length>0 ) {    
//    //alert("Warning: " + tmpQuoteRic + " has existed in the list!");
//    //logFn("end in validateQuoteRicFn");
//    addQuoteSearchFn(tmpQuoteRic);	
//    collectKeyWordsFn(tmpQuoteRic, undefined, "N");
	
//    enableQuoteSearchFn();
//  } else {  
//    getPrimaryQuote(tmpQuoteRic,
//                    function(response) {
//                      addQuoteSearchFn(response.rows[1][0]);	
//                      collectKeyWordsFn(new Array(response.rows[1][0]), undefined, "N");
//                      enableQuoteSearchFn();},
//                    function(response) {
//                      enableQuoteSearchFn();				  
//                    } 
//	               );
//  } 
  
//  logFn("end in " + funName);
//}catch(ex) {logFn("in " + funName + " "+ex)}
//}


function submitQuoteListFn() {
  var funName = "submitQuoteListFn";
try{

  logFn("start in " + funName);
  var hostDiv=$(createQuoteListDivName);
  
  var tmpQuoteRics=hostDiv.find(quoteListFormName).find('input[type="checkbox"][checked="checked"]');

  var tmpInputAttr = "";
  var tmpRics = "";
  var tmpRicsArr = new Array();
  for (var i=0;i<tmpQuoteRics.length;i++)
  {
    tmpRicsArr[tmpRicsArr.length] = $(tmpQuoteRics[i]).val();
    tmpRics = tmpRics + "," + $(tmpQuoteRics[i]).val();
  }
  
  $(relatedCmpDivName).find('li').remove();
  $(relatedNewsDivName).find('.news').remove();
  
  collectNewsInHistoryFn(tmpRicsArr);

  //logFn("submitQuoteListFn : " + tmpRics + "\n" + hostDiv.find("form#quoteList").html());
  logFn(funName + " : " + tmpRics + " ricsArr.length=" + tmpRicsArr.length + " form=" + hostDiv.html());
  logFn("end in " + funName); 
}catch (ex) {alert(funName + "\n" + ex);}
}

function addQuoteSearchFn(primaryQuote)
{
  var funName = 'addQuoteSearchFn';
  logFn("start in " + funName);
  disableQuoteSearchFn();
  
  var hostForm=$(createQuoteListDivName).find(quoteListFormName);
  
  var tmpQuoteTag = hostForm.find('label[id="'+primaryQuote+'"]').parent();
  if ( tmpQuoteTag.length > 0 ) {  
   // tmpQuoteTag.remove();
  } else {
    tmpQuoteTag = createCheckBoxTagFn(primaryQuote, "quoteSearchList", primaryQuote, undefined, "Y");

    tmpQuoteTag.find('label[id="'+primaryQuote+'"]').dblclick(function() {openCompany(primaryQuote)});
	
    hostForm.append(tmpQuoteTag);

  }
  
  enableQuoteSearchFn() ;
  logFn("quoteList="+$(quoteListFormName).html());
  logFn("end in " + funName);
}

function quoteSearchSuccessFn(response, statusErrorHandler)
{
  var funName = 'quoteSearchSuccessFn';
  logFn("start in " + funName + JSON.stringify(response));
  if( response.status == "Ok" ) {
    logFn("Succeed in quoteSearchSuccessFn, " + JSON.stringify(response));
	
	//enableQuoteSearchFn();
  } else if (statusErrorHandler!=undefined) {
    statusErrorHandler(response)
  }

  logFn("end in " + funName);
  return response.status == "Ok" ? "Y" : "N";
}

function quoteSearchFailFn(response)
{
  var funName = 'quoteSearchFailFn';
  logFn("start in " + funName);
  alert("Please fill in the right ric for once.");
  $(quoteSearchUserInputName).val("");
  logFn("in call "+funName+", " + JSON.stringify(response));
  
  //enableQuoteSearchFn();
  logFn("end in " + funName);
}



