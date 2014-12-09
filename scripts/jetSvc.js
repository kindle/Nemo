angular.module("nemoApp")
.factory("jetSvc", ['logSvc', function (logSvc) {

    return {
        
        openMajorNews: function (quote) {
            try {
                if (JET.Entity != undefined && JET.Entity.RIC != undefined) {
                    JET.contextChange([
                        {
                            RIC: quote
                        }
                    ]);
                } else {
                    JET.navigate({
                        name: "News",
                        Entity: [
                            {
                                RIC: quote
                            }
                        ]
                    });
                }
            } catch (ex) {
                //alert("in openCompany :" + ex)
            }
        },
        getRelatedNews: function (keyword, onAppend, newsCnt) {

            var newsSubscription = JET.News.get("nemoApp");
            if ( keyword != null || newsSubscription == null) {
                if ( newsSubscription != null ) { newsSubscription.stop(); }
                else {
				    newsSubscription = JET.News.create("nemoApp");
                }
                newsSubscription.newsExpression(keyword)
  	                .topSize(0)
  	                .basketSize(newsCnt)
  	                .onAppend(onAppend);

                newsSubscription.restart();                
                newsSubscription.more(newsCnt);	
            } else {
                newsSubscription.more(newsCnt);			
            }
	
        },

        openNews: function(query) {
            JET.navigate({
                name: "News",
                entities: [
                    {
                        NewsQuery: query
                    }
                ]
            });
        },
		
        getUserID: function() {
            return JET.getUserInfo().UUID;
        }
		
    };
}]);