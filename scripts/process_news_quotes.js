var relatedCmpDivName    = "#related_quotes_div #relatedCmpDiv";
var relatedNewsDivName   = "#related_quotes_div #relatedNewsDiv";
var keyWordsFormHostName = "#keyWordsBoardDiv";
var keyWordsAttName = "keyWords";
var keyWordsCntAttName = "keyWordsCount";
var hitScoreAttName = "hitScore";
var newsQuoteClassName = "newsQuote";

var calculateHitScoresProgressName = "#calcualteHitScoresProgress";


function addLiToRelatedCmpDivFn(query, command) {
  var funName = "addLiToRelatedCmpDivFn";
try{
  logFn("start in " + funName + " query=" +query + " command=" + JSON.stringify(command.urn));
  
  if ( $(relatedCmpDivName).find('li[id="'+query+'"]').length==0 ) {
      $(relatedCmpDivName).append($("<li>").text(query)//.attr("title",JSON.stringify(command))
        .attr("id",query)
        .attr("class",newsQuoteClassName)
        .dblclick(function(){
          openNews(command.urn); 
          //calculateKeyWordsHitScoreFn(command.rl[i])
          } ) );
  }
  
  logFn("end in " + funName);
  
  } catch(ex) {logFn("in "+ funName + " " + ex)};
}

function collectNewsInHistorySubFn(quotes, command) {
  var funName = "collectNewsInHistorySubFn";
try{
  logFn("start in " + funName);
  var tmpArr = new Array();
  var isHit = "N";
  var queryStr = quotes.toString();
  var tmpURN = command.urn;
  if ( command != undefined && command.ht != 2 ) { //ht=2 refers to alerting
    for(var i=0;i<command.rl.length;i++) {  
      // skip the ones provided by users	
      if ( !(quotes.indexOf(command.rl[i])>=0) ) {
        isHit = "Y";
        getPrimaryQuote(command.rl[i],
          function(response) { addLiToRelatedCmpDivFn(response.rows[1][0], command); },
          undefined);
      }
    }
  }
  logFn("end in " + funName + " " + command.d + " " + command.t  + " " + command.i + " " + command.urn );
  return isHit;
}catch(ex) { alert(funName + "\n" + ex); }
}

function collectNewsInHistoryFn(quotes) {
  var funName = "collectNewsInHistoryFn";
  logFn("start in " + funName + " quotes=" + quotes);

  var tmpArr = new Array();
  var isHit = "N";
  var queryStr = quotes.toString();
  collectKeyWordsFromNewsFn(quotes.toString(),
                            function(command) { return collectNewsInHistorySubFn(quotes, command);},
                            undefined, // how many times of hit required most
                            undefined,  // actions after the final collecting
                            disableQuoteSearchFn, // start function
                            function() {//filterQuotesByKeyWordsHitFn(); 
							enableQuoteSearchFn(); }, //end function
                            1);
  //

  logFn("end in " + funName);
}//*/

function addKeyWordsForRelatedQuoteFn(keyWordsId, arr)
{
  var funName = "addKeyWordsForRelatedQuoteFn";
  var tmpId = getElementIdStrFn(keyWordsId);
  tmpId = tmpId.substring(tmpId.lastIndexOf("\.")+1);
  logFn("start in " + funName + " keyWordsId=" + tmpId + " arr.length="+arr.length);
try{
  for(var i=0; i<arr.length; i++) {
    var tmpHost = $(relatedCmpDivName).find('li[id="'+arr[i].query+'"]');

    var tmpDiv = $(tmpHost).children('div[id="'+tmpId+'"]');
    if ( tmpDiv.length>0 ) {
      tmpDiv.remove();
    }
    
    tmpDiv = $("<div>").attr("id",tmpId).text(tmpId).append("<br/>");
    tmpHost.append(tmpDiv);
	var tmpRefCodes = new Array(arr[i].rows.length);
    
    for(var j=0;j<arr[i].rows.length;j++) { 
      var tmpLocateLabelName = 'label[id="'+arr[i].rows[j].refCode+'"]';
      var tmpTag = tmpDiv.find(tmpLocateLabelName);	
		// if no related tag, just create one; otherwise, append the title info
      if(tmpTag.length==0) {    
        tmpTag = createLabelTagFn(arr[i].rows[j].refCode, arr[i].rows[j].refCode, arr[i].rows[j].refName, arr[i].rows[j].queryDes, hiddenTestingLabels);
        tmpDiv.append(tmpTag).append($("<br/>"));
      }
      tmpRefCodes[j] = arr[i].rows[j].refCode;
    }
	
	//calculate the hit score
    var tmpKeyWordsForm = $(keyWordsFormHostName).find('form[id="'+tmpId+'"]');
	var tmpHitScore = 0;
	var activeKeyWords = $(tmpKeyWordsForm).find('input[type="checkbox"][checked="checked"]');
    for(var j = 0; j<activeKeyWords.length;j++) {
      if( tmpRefCodes.indexOf($(activeKeyWords[j]).attr("id"))>=0 ) {
        tmpHitScore = parseInt(tmpHitScore) + 1;
      }
    }
    tmpDiv.attr("title", tmpId + ":"+tmpHitScore);
	
    // update the keyWords for the host quote and hit scores
    var tmpHostKeyWords = eval ("(" + $(tmpHost).attr(keyWordsAttName) + ")");
		
    tmpHostKeyWords[tmpId] = tmpRefCodes;
    $(tmpHost).attr(keyWordsAttName,JSON.stringify(tmpHostKeyWords));
    $(tmpHost).attr(keyWordsCntAttName,parseInt($(tmpHost).attr(keyWordsCntAttName))+1);
		
    var tmpHitScores = eval ("(" + $(tmpHost).attr(hitScoreAttName) + ")");
    tmpHitScores[tmpId] = tmpHitScore;
    $(tmpHost).attr(hitScoreAttName,JSON.stringify(tmpHitScores));

			
	//only calculate the final hit scores when all
    if ($(tmpHost).attr(keyWordsCntAttName) == $(keyWordsFormHostName).find('form').length) {
      tmpHost.attr("title",JSON.stringify(tmpHitScores));
      $(calculateHitScoresProgressName).attr("value",parseInt($(calculateHitScoresProgressName).attr("value"))+1);
      $(calculateHitScoresProgressName).attr("title", 
        "max:" + $(calculateHitScoresProgressName).attr("max") + " value:" + $(calculateHitScoresProgressName).attr("value"));
    }
  }
    logFn("end in " + funName + "\nrelatedCmpDivName="+  $(relatedCmpDivName).html());
}catch(ex) {logFn("in " + funName + " " + ex)}
} //*/


function calculateKeyWordsHitScoresFn() {
try{

  var quoteTags = $(relatedCmpDivName).children('li');
  var tmpLen = quoteTags.length ;//> 5 ? 5 : quoteTags.length;
  // show the progress
  $(calculateHitScoresProgressName).attr("max",quoteTags.length);
  $(calculateHitScoresProgressName).attr("value",0);
  $(calculateHitScoresProgressName).removeAttr("hidden");
  $(calculateHitScoresProgressName).attr("title", "max:" + $(calculateHitScoresProgressName).attr("max"));
  
  var quotes = new Array(tmpLen);
  for(var i=0;i<tmpLen;i++) {
    quotes[i] = $(quoteTags[i]).attr("id");
    $(quoteTags[i]).children().remove();
    $(quoteTags[i]).attr(keyWordsAttName,"{}");
    $(quoteTags[i]).attr(hitScoreAttName,"{}");
    $(quoteTags[i]).attr(keyWordsCntAttName,0);
  }
  
  //collectKeyWordsFn(quotes, addKeyWordsForRelatedQuoteFn, "N");
  collectKeyWordsFn(quotes, addKeyWordsForRelatedQuoteFn, "N");
  
  //*/
}catch(ex) { logFn("in calculateKeyWordsHitScoreFn" + ex); }
}//*/
