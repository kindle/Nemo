angular.module("nemoApp", ['ui.router', 'ui.bootstrap', 'ngStorage', 'dialogs.main', 'ngGrid', 'ngSanitize'])
.controller("appCtrl", ['$scope', 'dialogs', 'dataCloudSvc', 'jetSvc', 'logSvc', 'parserSvc', '$sce',
    function ($scope, dialogs, dataCloudSvc, jetSvc, logSvc, parserSvc, $sce) {
        $scope.selectedQuotes = [];
        $scope.quoteOptions = {
            data: 'quoteList',
            selectedItems: $scope.selectedQuotes,
            afterSelectionChange: function () {

            },

            columnDefs: [
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false },
                { field: 'Name', displayName: 'Name', enableCellEdit: false }
            ],
            enablePinning: false,
            enableCellSelection: true,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: false,
            showSelectionCheckbox: false
        };
        $scope.selectedKeywords = [];
        $scope.keywordOptions = {
            data: 'keywordList',
            selectedItems: $scope.selectedKeywords,
            afterSelectionChange: function () {

            },
            sortInfo: { fields: ['Weight'], directions: ["desc"] },
            columnDefs: [
                { field: 'Keyword', displayName: 'Keyword' },
                { field: 'Type', displayName: 'Type', enableCellEdit: false, visible: false },
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false, visible: false },
                { field: 'Data', displayName: 'Data', enableCellEdit: false, visible: false },
                { field: 'Weight', displayName: 'Weight', enableCellEdit: false, visible: false }
            ],
            enablePinning: false,
            enableCellSelection: true,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: true,
            showSelectionCheckbox: true
        };
        $scope.selectedNews = [];
        $scope.newsOptions = {
            data: 'newsList',
            selectedItems: $scope.selectedNews,
            afterSelectionChange: function () {

            },

            columnDefs: [
                {
                    field: 'Title', displayName: 'Title', enableCellEdit: false, width: 420,
                    cellTemplate: '<span ng-click="openNews(row.Urn)" style="margin:5px;" ng-bind-html="COL_FIELD"></span>'
                },
                { field: 'Hot', displayName: 'Hot', enableCellEdit: false, visible: false },
                {
                    field: 'Match', displayName: 'Match', enableCellEdit: false,
                    cellTemplate: '<div>%</div>'
                },
                { field: 'Urn', displayName: 'Urn', enableCellEdit: false, visible: false },
                { field: 'Company', displayName: 'Company', enableCellEdit: false, visible: false }
            ],
            enablePinning: false,
            enableCellSelection: true,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: false,
            showSelectionCheckbox: false
        };

        $scope.quoteList = [];
        $scope.keywordList = [];
        $scope.newsList = [];
        $scope.threshold = { ownership: 0.02, index: 0.01 };
        $scope.newQuote = { value: "IBM.N", disabled: false };
        $scope.addQuote = function () {
            if ($scope.newQuote.value == "") {
                dialogs.notify("Warning", "Please input a Quote!");
            } else {
                $scope.newQuote.disabled = true;
                if ($scope.checkExist()) {
                    $scope.newQuote.disabled = false;
                    dialogs.notify("Warning", $scope.newQuote.value + " has existed in the list!");
                } else {
                    dataCloudSvc.validateQuote($scope.newQuote.value, $scope.callbackHandler);
                }
            }
        };
        $scope.removeQuote = function () {
            if ($scope.selectedQuotes.length == 0) {
                dialogs.notify("Warning", "Please select a Quote!");
            } else {
                dialogs.confirm("Please Confirm", "Are you sure you want to remove the quote '" + $scope.selectedQuotes[0].RIC + "'?").result.then(function () {
                    angular.forEach($scope.quoteList, function (data, index) {
                        if (data.RIC == $scope.selectedQuotes[0].RIC) {
                            $scope.quoteList.splice(index, 1);
                        }
                    });
                });
            }
        };
        $scope.removeKeyword = function () {
            if ($scope.selectedKeywords.length == 0) {
                dialogs.notify("Warning", "Please select a Keyword!");
            } else {
                dialogs.confirm("Please Confirm", "Are you sure you want to remove the keyword '" + $scope.selectedKeywords[0].Keyword + "'?").result.then(function () {
                    angular.forEach($scope.keywordList, function (data, index) {
                        if (data.Keyword == $scope.selectedKeywords[0].Keyword) {
                            $scope.keywordList.splice(index, 1);
                        }
                    });
                });
            }
        };
        $scope.generateKeywords = function () {
            if ($scope.quoteList.length > 0) {
                $scope.ownershipList = [];
                $scope.businessClassificationList = [];
                $scope.indexList = [];

                angular.forEach($scope.quoteList, function(data, index) {
                    $scope.generateKeyword(data.RIC);
                });
            } else {
                dialogs.notify("Warning", "Please add a Quote!");
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
        $scope.generateKeyword = function (quote) {
            dataCloudSvc.getOwnershipKeywords(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.ownershipParser(quote, rawData.rows, $scope.threshold.ownership);
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].rows.length; j++) {
                            if (data[i].rows[j].refCode != null) {
                                var existingKeywordFlag = false;
                                for (var k = 0; k < $scope.keywordList.length; k++) {
                                    if ($scope.keywordList[k].Keyword == data[i].rows[j].refName) {
                                        existingKeywordFlag = true;
                                        $scope.keywordList[k].Weight+=1;
                                        break;
                                    }
                                }
                                if (!existingKeywordFlag) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'Ownership',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 0
                                    });
                                }
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
                                var existingKeywordFlag = false;
                                for (var k = 0; k < $scope.keywordList.length; k++) {
                                    if ($scope.keywordList[k].Keyword == data[i].rows[j].refName) {
                                        existingKeywordFlag = true;
                                        $scope.keywordList[k].Weight += 1;
                                        break;
                                    }
                                }
                                if (!existingKeywordFlag) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'BusinessClassification',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 0
                                    });
                                }
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
                                var existingKeywordFlag = false;
                                for (var k = 0; k < $scope.keywordList.length; k++) {
                                    if ($scope.keywordList[k].Keyword == data[i].rows[j].refName) {
                                        existingKeywordFlag = true;
                                        $scope.keywordList[k].Weight += 1;
                                        break;
                                    }
                                }
                                if (!existingKeywordFlag) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'Index',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 0
                                    });
                                }
                            }
                        }
                    }
                } else {
                    logSvc.logFn("Error when getting business classification data");
                }
            });
        };
        var successHandler = function() {
            $scope.quoteList.push({ RIC: $scope.newQuote.value, Name: '' });
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
        $scope.generateNews = function () {
            if ($scope.selectedKeywords.length > 0) {
                $scope.newsList = [];
                for (var i = 0; i < $scope.selectedKeywords.length; i++) {
                    logSvc.logFn("searching:" + $scope.selectedKeywords[i].Keyword);
                    jetSvc.getTopNews($scope.selectedKeywords[i].Keyword, appendCallback, insertCallback, deleteCallback);
                }
                
            } else {
                dialogs.notify("Warning", "Please add a Keyword!");
            }
        };

        var appendCallback = function (command) {
            logSvc.logFn("append:" + command.h);
            $scope.$apply(
                function () {
                    var existingNewsFlag = false;
                    for (var i = 0; i < $scope.newsList.length; i++) {
                        if ($scope.newsList.Urn == command.urn) {
                            $scope.newsList.Numerator += 1;
                            existingNewsFlag = true;
                            break;
                        }
                    }
                    if (!existingNewsFlag) {
                        $scope.newsList.push({
                            Title: $sce.trustAsHtml(command.h + '<br>' + command.d + ' ' + command.t + ' [' + command.src + ']'),
                            Hot: 0,
                            Match: 0,
                            Urn: command.urn,
                            Company: '',
                            Numerator: 1,
                            Denominator: $scope.selectedKeywords.length
                        });
                    }
                }
           );
        };
        var insertCallback = function (command) {
            logSvc.logFn("insert:" + command.h);
            $scope.$apply(
                function () {
                    var existingNewsFlag = false;
                    for (var i = 0; i < $scope.newsList.length; i++) {
                        if ($scope.newsList.Urn == command.urn) {
                            $scope.newsList.Numerator += 1;
                            existingNewsFlag = true;
                            break;
                        }
                    }
                    if (!existingNewsFlag) {
                        $scope.newsList.insertAt(command.i, {
                            Title: $sce.trustAsHtml(command.h + '<br>' + command.d + ' ' + command.t + ' [' + command.src + ']'),
                            Hot: 0,
                            Match: 0,
                            Urn: command.urn,
                            Company: '',
                            Numerator: 1,
                            Denominator: $scope.selectedKeywords.length
                        });
                    }
                }
            );
        };
        var deleteCallback = function(command) {
            logSvc.logFn("delete:" + command.h);
            $scope.$apply(function() {
                $scope.newsList.splice(command.i, 1);
            });
        };
        
        $scope.openNews = function (urn) {
            jetSvc.openNews(urn);
        };
}]);