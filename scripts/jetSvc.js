angular.module("nemoApp")
.factory("jetSvc", [function () {
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
        }
    };
}]);