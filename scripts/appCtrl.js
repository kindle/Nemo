angular.module("nemoApp", ['ui.router', 'ui.bootstrap', 'ngStorage', 'dialogs.main', 'ngGrid', 'ngSanitize'])
.controller("appCtrl", ['$scope', 'dialogs', 'dataCloudSvc', 'jetSvc', 'logSvc', 'parserSvc', '$sce',
    function ($scope, dialogs, dataCloudSvc, jetSvc, logSvc, parserSvc, $sce) {
        $scope.keywordChecked = { ownership: true, businessClassification: true, index: true };
        $scope.ownershipList = [];
        $scope.businessClassificationList = [];
        $scope.indexList = [];
        $scope.quoteList = [];
        $scope.threshold = { ownership: 0.02, index: 0.01 };
        $scope.newQuote = { value: "IBM.N", disabled: false };
        $scope.addQuoteAndGenerateKeyWords = function () {
            $scope.newQuote.disabled = true;
            if ($scope.checkExist()) {
                $scope.newQuote.disabled = false;
                dialogs.notify("Warning", $scope.newQuote.value + " has existed in the list!");
            } else {
                dataCloudSvc.validateQuote($scope.newQuote.value, $scope.callbackHandler);
            }
        };
        $scope.checkExist = function () {
            var existed = false;
            angular.forEach($scope.quoteList, function (data) {
                if (data == $scope.newQuote.value) {
                    existed = true;
                }
            });
            return existed;
        };
        $scope.generateKeyWords = function (quote) {
            dataCloudSvc.getOwnershipKeywords(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.ownershipParser(quote, rawData.rows, $scope.threshold.ownership);
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].rows.length; j++) {
                            if (data[i].rows[j].refCode != null) {
                                $scope.ownershipList.push({
                                    query: data[i].rows[j].query,
                                    queryDes: data[i].rows[j].queryDes,
                                    refCode: data[i].rows[j].refCode,
                                    refName: data[i].rows[j].refName,
                                    refDes: data[i].rows[j].refDes,
                                    checked: 'true'
                                });
                            }
                        }
                    }
                } else {
                    logSvc.logFn("Error when getting ownership data");
                }
            });
            dataCloudSvc.getBusinessClassificationKeywords(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.businessClassificationParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].rows.length; j++) {
                            if (data[i].rows[j].refCode != null) {
                                $scope.businessClassificationList.push({
                                    query: data[i].rows[j].query,
                                    queryDes: data[i].rows[j].queryDes,
                                    refCode: data[i].rows[j].refCode,
                                    refName: data[i].rows[j].refName,
                                    refDes: data[i].rows[j].refDes,
                                    checked: 'true'
                                });
                            }
                        }
                    }
                } else {
                    logSvc.logFn("Error when getting business classification data");
                }
            });
            dataCloudSvc.getIndexKeywords(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.indexParser(quote, rawData.rows, $scope.threshold.index);
                
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].rows.length; j++) {
                            if (data[i].rows[j].refCode != null) {
                                $scope.indexList.push({
                                    query: data[i].rows[j].query,
                                    queryDes: data[i].rows[j].queryDes,
                                    refCode: data[i].rows[j].refCode,
                                    refName: data[i].rows[j].refName,
                                    refDes: data[i].rows[j].refDes,
                                    checked: 'true'
                                });
                            }
                        }
                    }
                } else {
                    logSvc.logFn("Error when getting business classification data");
                }
            });
        };
        var successHandler = function() {
            $scope.quoteList.push($scope.newQuote.value);
            $scope.generateKeyWords($scope.newQuote.value);
            $scope.newQuote.value = "";
            $scope.newQuote.disabled = false;
        };
        var errorHandler = function () {
            dialogs.notify("Warning", "Please fill in the right ric for once.");
            $scope.newQuote.disabled = false;
        };
        $scope.callbackHandler = function(response) {
            if (response.status == "Ok") {
                $scope.$apply(successHandler);
            } else {
                $scope.$apply(errorHandler);
            }
        
        };
        $scope.openMajorNews = function (quote) {
            jetSvc.openMajorNews(quote);
            logSvc.logFn("Open Major News: " + quote);
        };
        /////////////////////////////////////////////////////////////////////////
        $scope.topNewsList = [];
        var appendCallback = function (command) {
            logSvc.logFn("append:" + command.h);
            $scope.$apply(
                function() {
                    $scope.topNewsList.push({
                        date: command.d,
                        time: command.t,
                        source: command.src,
                        header: $sce.trustAsHtml(command.h),
                        urn: command.urn
                    });
                }
           );
        };
        var insertCallback = function (command) {
            logSvc.logFn("insert:" + command.h);
            $scope.$apply(
                function() {
                    $scope.topNewsList.insertAt(command.i, {
                        date: command.d,
                        time: command.t,
                        source: command.src,
                        header: command.h,
                        urn: command.urn
                    });
                }
            );
        };
        var deleteCallback = function(command) {
            logSvc.logFn("delete:" + command.h);
            $scope.$apply(function() {
                $scope.topNewsList.splice(command.i, 1);
            });
        };

        jetSvc.getTopNews("blackrock institutional trust company", appendCallback, insertCallback, deleteCallback);
        
        $scope.openNews = function (urn) {
            jetSvc.openNews(urn);
        };
        /////////////////////////////////////////////////////////////////////////
        $scope.submitQuotes = function() {
            alert($scope.topNewsList);
        };
}]);