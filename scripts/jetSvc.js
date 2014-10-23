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
        getTopNews: function (keyword, onAppend, onInsert, onDelete) {
            var newsAllSubscription = JET.News.create()
  	            .newsExpression(keyword)
  	            .topSize(1)
  	            .basketSize(5)
  	            .onAppend(onAppend)
                .onInsert(onInsert)
                .onDelete(onDelete)
  	            .start();
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
        }
    };
}]);