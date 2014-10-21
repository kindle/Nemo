
var containerNewsAll = [("#trNewsDiv #topAll"), ("#trNewsDiv #basketAll")];
var containersSelectedAll = [("#trNewsDiv #topSelected"), ("#trNewsDiv #basketSelected")];


var newsSelectedAttr = {
  "subid"         : undefined,
  "subscription"  : undefined,
  "query"         : undefined,
  "isActive"      : undefined,
  "hitJudgeFn"    : undefined,
  "onSuccessFn"   : undefined,
  "withinDays"    : undefined,
  "topNewsDate"   : undefined,
  "onEndFn"       : undefined,
  "hitTimesMax"   : undefined,
  "hitTImesCnt"   : undefined,
  "lastURN"       : undefined
}

function collectKeyWordsFromNewsFn(query, hitJudgeFn, hitTimesMax, onSuccessFn, onStartFn, onEndFn, withinDays) {
  
  try {
    logFn("start in collectKeyWordsFromNewsFn()");
	if ( newsSelectedAttr.isActive=="Y" ) {
      throw "Can NOT retrieve news for a new query(" + query +") when the old query(" + newsSelectedAttr.query + ") is still running";
    } else {
      newsSelectedAttr.isActive = "Y";
	}
    //disabled all the buttons
    onStartFn();
	
    if (newsSelectedAttr.subid==undefined) {
      newsSelectedAttr.subid = appId+"_newsSelectedSubscription";
      newsSelectedAttr.subscription = JET.News.create(newsSelectedAttr.subid);
    }
    //update newsSelectedAttr
    newsSelectedAttr.query       = query;
    newsSelectedAttr.hitJudgeFn  = hitJudgeFn;
    newsSelectedAttr.hitTimesMax = parseInt(hitTimesMax);
    newsSelectedAttr.onSuccessFn = onSuccessFn;
    newsSelectedAttr.withinDays  = parseInt(withinDays);
	newsSelectedAttr.topNewsDate = undefined;
	newsSelectedAttr.lastURN     = undefined;
	newsSelectedAttr.hitTimesCnt = parseInt(0);
    newsSelectedAttr.onEndFn = function() {
      newsSelectedAttr.subscription.stop();
      onEndFn(); 
      newsSelectedAttr.isActive = "N";
    };

    newsSelectedAttr.subscription.newsExpression(newsSelectedAttr.query)
      .topSize(0)
      .basketSize(1)
      .onAppend(onAppendSelected);

    newsSelectedAttr.subscription.restart();
    newsSelectedAttr.subscription.more(1);

  }catch(ex) {
    alert("ex" + ex);
    try {
      newsSelectedAttr.onEndFn();
    } catch(ex) {
      alert("failed to call newsSelectedAttr.onEndFn()");
    }
  }
} //*/



function onAppendSelected(command) {

  if ( newsSelectedAttr.topNewsDate == undefined ) {
    newsSelectedAttr.topNewsDate = new Date(Date.parse(command.d));
  } else {
    // check whether the retrieved news is out of expected durations
    var lastNewsDate = new Date(Date.parse(command.d));
    var days = Math.floor((newsSelectedAttr.topNewsDate.getTime()-lastNewsDate.getTime())/(24*3600*1000));
    if ( days > newsSelectedAttr.withinDays || newsSelectedAttr.lastURN == command.urn ) {
      if ( !isNaN(newsSelectedAttr.hitTimesMax) && newsSelectedAttr.hitTimesCnt==0 ) {
        alert("no hit news for quote(s) " + newsSelectedAttr.query + " within " + newsSelectedAttr.withinDays);
      }
      newsSelectedAttr.onEndFn();
      return;
    }
    newsSelectedAttr.lastURN = command.urn;
  }
  
  if ( newsSelectedAttr.hitJudgeFn(command)=="Y" ) {
    newsSelectedAttr.hitTimesCnt = newsSelectedAttr.hitTimesCnt + 1;
    var tmpNews = $("<div>").html(command.d + " " + command.t + " - [" + command.src + "] " + command.h).attr("id", command.urn).attr("class","news");
    tmpNews.dblclick( function(){openNews(command.urn)} );
    $(containersSelectedAll[command.tt]).append(tmpNews); 
  } 
  if ( newsSelectedAttr.hitTimesCnt >= newsSelectedAttr.hitTimesMax ) {
    newsSelectedAttr.subscription.stop();
	
    if (newsSelectedAttr.onSuccessFn!=undefined) {
      newsSelectedAttr.onSuccessFn(command);
	}
	newsSelectedAttr.onEndFn();
	
    logFn(JSON.stringify(command, undefined, 2));    
  } else {
     newsSelectedAttr.subscription.more(1);
  }
} //*/
/*
function onInsertSelected(command) {
  var tmpNews=$("<div>").html(command.d + " " + command.t + " - [" + command.src + "] " + command.h);
  tmpNews.click(function(){openNews(command.urn)});
  $($(containersSelectedAll[command.tt]).children()[command.i]).before(tmpNews);
  logFn(JSON.stringify(command, undefined, 2));
}

function onDeleteSelected(command) {
  $($(containersSelectedAll[command.tt]).children()[command.i]).remove();
} //*/



function captureNewsFn() {

  var newsAllSubscription = JET.News.create()
  	.newsExpression("IBM.N")
  	.topSize(1)
  	.basketSize(5)
  	.onAppend(onAppendAll)
  	.onInsert(onInsertAll)
  	.onDelete(onDeleteAll)
  	.start();
	
}

	
function onAppendAll(command) {
  var tmpNews=$("<div>").html(command.d + " " + command.t + " - [" + command.src + "] " + command.h).attr("class","news");
  tmpNews.dblclick(function(){openNews(command.urn)});
  $(containerNewsAll[command.tt]).append(tmpNews);
  //logFn(JSON.stringify(command, undefined, 2));
  //logFn("in onAppendAll: "+ " " + command.urn + " i=" + command.i);
}

function onInsertAll(command) {
  var tmpNews=$("<div>").html(command.d + " " + command.t + " - [" + command.src + "] " + command.h).attr("class","news");
  tmpNews.dblclick(function(){openNews(command.urn)});
  $($(containerNewsAll[command.tt]).children()[command.i]).before(tmpNews);
  //logFn(JSON.stringify(command, undefined, 2));
  //logFn("in onInsertAll: "+ " " + command.urn + " i=" + command.i + " t="+command.t + " tt=" + command.tt);
  //alert("waiting for checking");
}

function onDeleteAll(command) {
  $($(containerNewsAll[command.tt]).children()[command.i]).remove();
  //logFn("in onDeleteAll: "+ " " + command.urn + " i=" + command.i + " t="+command.t + " tt=" + command.tt);
}

