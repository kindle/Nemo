angular.module("nemoApp")
.factory("dataCloudSvc", ['$http', '$q', 'jetSvc', 'logSvc', function ($http, $q, jetSvc, logSvc) {
    
	//  "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha
	//http://datacloud-hdc.int.thomsonreuters.com:1080"; // Prod
    var productID = "EikonGame_Nemo";
    var uuid = jetSvc.getUserID; //"SL1-2P99Y6B";
    var hostUrl = "http://datacloud-hdc.int.thomsonreuters.com:1080/snapshot/rest/select?" + "productid=" + productID + "&uuid=" + uuid;

	////////////////// for testing /////////////////////
 //  uuid = "PAXTRA-913530672"; //alpha
 //  hostUrl = "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080/snapshot/rest/select?" + "productid=" + productID + "&uuid=" + uuid; // alpha

	////////////////// for testing /////////////////////
//    uuid = "PAXTRA27775";//"PAXTRA-913530672";
//	hostUrl = "http://datacloud-beta.int.thomsonreuters.com:1080/snapshot/rest/select?" + "productid=" + productID + "&uuid=" + uuid; // beta



    return {
        validateQuote: function(quote) {
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
          //var localuuid =  uuid; //"PAXTRA-913530672";//alhpa
          //var localhostUrl = hostUrl;//  "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha
          //var quoteValidationStr = "formula=&output=&productid=" + productID + "&identifiers=" + quote;
          //var requestUrl = localhostUrl + quoteValidationStr + "&uuid=" + localuuid; // Alpha
		  
            var formula = "TR.RIC%2C+TR.CompanyName%2C+TR.BusinessSummary";
            var output = "Col%2CT%7CIn%2C+value";
            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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

        getPrice: function(quote,dur) {

            var formula = 'TR.PriceClose%28SDATE%3D-1'+dur.substring(0,1).toUpperCase()+'%2CEdate%3D0D%2Ccurn%3DUSD%29';
            var output  = 'Col%2CT%7CIn%2Cdate%2Ccalcdate%2Cva%2CsortA%2CIn%2Ccalcdate';

            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
            ;
            logSvc.logFn("requestUrl:" + requestUrl);
            var deferred = $q.defer();
            $http.get(requestUrl, { headers: { "reutersuuid": uuid} })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
        }, 
        getCommonStatistics: function (quote) {
            var formula = "RFA.VAL.Price2BV_CurA%2C+RFA.VAL.Price2EPS_CurA%2C+RFA.VAL.Price2CF_CurA%2C+RFA.VAL.EV2EBITDA_CurA";
            var output = "Col%2C+T%7CIn%2C+value";
            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
            ;

            var deferred = $q.defer();
            $http.get(requestUrl, { headers: { "reutersuuid": uuid} })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
        },
/*
		callDataCloud : function(url) {
            var deferred = $q.defer();
            $http.get(url, { headers: { "reutersuuid": uuid} })
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    deferred.reject(status);
                });

            return deferred.promise;
		}
*/
		getBusinessSegment: function(quote) {
            var formula = "RF.SEG.BUS";            
            var output = "Col%2CT%7CIn%2Cfperiod%2CsegmentCode%2CsegmentName%2Ccurrency%2Cvalue";
            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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
		
		getGeographicSegment: function(quote) {
            var formula = "RF.SEG.GEOG";            
            var output = "Col%2CT%7CIn%2Cfperiod%2CsegmentCode%2CsegmentName%2Ccurrency%2Cvalue";
            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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

        getBusinessClassificationKeywords: function (quote) {
            var formula = "TR.OrgTRBCEconSectorCode%2C+TR.OrgTRBCEconSector%2C" +
                "+TR.OrgTRBCBusinessSectorCode%2C+TR.OrgTRBCBusinessSector%2C" +
                "+TR.OrgTRBCIndustryGroupCode%2C+TR.OrgTRBCIndustryGroup%2C" +
                "+TR.OrgTRBCIndustryCode%2C+TR.OrgTRBCIndustry%2C" +
                "+TR.OrgTRBCActivityCode%2C+TR.OrgTRBCActivity";
            var output = "Col%2CT%7CIn%2Cvalue%2CsortA%2CIn";
            var requestUrl = hostUrl
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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
                + "&formula=" + formula
                + "&output=" + output
                + "&identifiers=" + quote
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