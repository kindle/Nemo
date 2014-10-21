angular.module("nemoApp")
.factory("dataCloudSvc", ['$http', '$q', 'logSvc', function ($http, $q, logSvc) {
    var hostUrl = "http://datacloud-hdc.int.thomsonreuters.com:1080"; // Prod
    var productID = "byu_testing";
    var uuid = "SL1-2P99Y6B";//prod
    return {
        validateQuote: function(quote, callback) {
            var uuid = null;
            //var eikonEnv = "Prod";
            //if (eikonEnv == "Alpha") {
            //    uuid = "PAXTRA-913530672";
            //    hostUrl = "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha

            //}
            //if (eikonEnv == "Beta") {
            //    uuid = "PAXTRA27775";//"PAXTRA-913530672";
            //    hostUrl = "http://datacloud-beta.int.thomsonreuters.com:1080"; // Beta

            //}
            //if (eikonEnv == "Prod") {
            //    uuid = "SL1-2P99Y6B"; // Use your own internal UUID if you have
            //    hostUrl = "http://datacloud-hdc.int.thomsonreuters.com:1080"; // Prod

            //}
            var localuuid = "PAXTRA-913530672";//alhpa
            var localhostUrl = "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha
            var quoteValidationStr = "/snapshot/rest/select?formula=TR.QuoteID&output=Col%2CT%7Cva&productid=" + productID + "&identifiers=" + quote;
            var requestUrl = localhostUrl + quoteValidationStr + "&uuid=" + localuuid; // Alpha

            $.get(requestUrl, callback, "json");
        },
        getBusinessClassificationKeywords: function (quote) {
            var formula = "TR.OrgTRBCEconSectorCode%2C+TR.OrgTRBCEconSector%2C" +
                "+TR.OrgTRBCBusinessSectorCode%2C+TR.OrgTRBCBusinessSector%2C" +
                "+TR.OrgTRBCIndustryGroupCode%2C+TR.OrgTRBCIndustryGroup%2C" +
                "+TR.OrgTRBCIndustryCode%2C+TR.OrgTRBCIndustry%2C" +
                "+TR.OrgTRBCActivityCode%2C+TR.OrgTRBCActivity";
            var output = "Col%2CT%7CIn%2Cvalue%2CsortA%2CIn";
            var requestUrl = hostUrl
                + "/snapshot/rest/select?"
                + "formula=" + formula
                + "&output=" + output
                + "&productid=" + productID
                + "&identifiers=" + quote
                + "&uuid=" + uuid
            ;

            var deferred = $q.defer();
            $http.get(requestUrl, { headers: { "reutersuuid": uuid } })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
        },
        getOwnershipKeywords: function (quote) {
            var formula = "OWN.OW.PercentOfShares(TOP=10)";
            var output = "Col%2C+T%7CIn%2C+investorname%2Cva%2C+sortA%2C+In%2C+sortD%2C+va";
            var requestUrl = hostUrl
                + "/snapshot/rest/select?"
                + "formula=" + formula
                + "&output=" + output
                + "&productid=" + productID
                + "&identifiers=" + quote
                + "&uuid=" + uuid
            ;

            var deferred = $q.defer();
            $http.get(requestUrl, { headers: { "reutersuuid": uuid } })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
        },
        getIndexKeywords: function (quote) {
            var formula = "TR.MemberIndexName%2C+TR.MemberWeightingPercent";
            var output = "Col%2C+T%7CIn%2Cindexric%2C+value%2C+SortA%2C+In%2C+value";
            var requestUrl = hostUrl
                + "/snapshot/rest/select?"
                + "formula=" + formula
                + "&output=" + output
                + "&productid=" + productID
                + "&identifiers=" + quote
                + "&uuid=" + uuid
            ;

            var deferred = $q.defer();
            $http.get(requestUrl, { headers: { "reutersuuid": uuid } })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
        },
    };
}]);