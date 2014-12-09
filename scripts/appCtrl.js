angular.module("nemoApp", ['ui.router', 'ui.bootstrap', 'ngStorage', 'dialogs.main', 'ngGrid', 'ngSanitize'])
.controller("appCtrl", ['$scope', 'dialogs', 'dataCloudSvc', 'jetSvc', 'logSvc', 'parserSvc', '$sce', '$modal',
    function ($scope, dialogs, dataCloudSvc, jetSvc, logSvc, parserSvc, $sce, $modal) {
        ///--test--
        $scope.open = function (selectedQuote) {

            var modalInstance = $modal.open({
                templateUrl: 'companyOverview.html',
                controller: ModalInstanceCtrl,
                windowClass: 'Css-Center-Modal',
                resolve: {
                    quote: function () {
                        return selectedQuote;
                    }
                }
            });

        };
		
		$scope.showCmpView = function(quote) {
          //  alert(quote[0].RIC);
            $scope.open(quote[0].RIC);
        }


        var ModalInstanceCtrl = function ($scope, $modalInstance, quote) {
            $scope.cmpBusinessSummaryData = "";
            //////////////////// for company overview ///////////////////////////
            $scope.cmpBusinessSummaryData = "";
            $scope.cmpBusinessSegmentData = [];
            $scope.cmpGeographicSegmentData = [];
            $scope.cmpBusinessSegment = {
                data: 'cmpBusinessSegmentData',
                sortInfo: { fields: ['RIC', 'Weight'] },
                columnDefs: [
                    { field: 'RIC', displayName: 'RIC' },
                    { field: 'SegmentName', displayName: 'SegmentName' },
                    { field: 'FPeriod', displayName: 'FPeriod' },
                    { field: 'TotalRevenue', displayName: 'TotalRevenue' },
                    { field: 'Weight', displayName: 'Weight' }
                ],
                enablePinning: false,
                enableCellSelection: false,
                enableCellEditOnFocus: true,
                showHeader: true,
                showColumnMenu: false,
                enableHighlighting: true,
                enableRowReordering: true,
                multiSelect: false,
                showSelectionCheckbox: false
            };
            $scope.cmpGeographicSegment = {
                data: 'cmpGeographicSegmentData',
                sortInfo: { fields: ['RIC', 'Weight'] },
                columnDefs: [
                    { field: 'RIC', displayName: 'RIC' },
                    { field: 'SegmentName', displayName: 'SegmentName' },
                    { field: 'FPeriod', displayName: 'FPeriod' },
                    { field: 'TotalRevenue', displayName: 'TotalRevenue' },
                    { field: 'Weight', displayName: 'Weight' }
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


            dataCloudSvc.validateQuote(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.quoteRefParser(rawData.rows);
                    $scope.cmpBusinessSummaryData = (data[0].BusinessSummary == null ? "" : data[0].BusinessSummary);
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpBusinessSegmentData = [];
            dataCloudSvc.getBusinessSegment(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.businessSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpBusinessSegmentData.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpGeographicSegmentData = [];
            dataCloudSvc.getGeographicSegment(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.geographicSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpGeographicSegmentData.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting geographic segmenet data");
                }
            });
            $scope.closeWin = function () {
                $modalInstance.close();
            };

        };
        //////////////////// tab Information Dashboard ////////////////////
        //////////////////// quote user input ////////////////////
        $scope.selectedQuotes = [];
        $scope.quoteList = [];
        $scope.quoteOptions = {
            data: 'quoteList',
            selectedItems: $scope.selectedQuotes,
            afterSelectionChange: function () { /*
                if ($scope.selectedQuotes.length > 0) {
                    $scope.open([$scope.selectedQuotes[$scope.selectedQuotes.length - 1].RIC]);
                }*/
            },

            columnDefs: [
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false},
                { field: 'Name', displayName: 'Name', enableCellEdit: false, cellTemplate: '<span class="ngCellText" title="{{row.entity.Name}}" >{{row.entity.Name}}</span>' }
            ],
            enablePinning: false,
            enableCellSelection: true,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: false,
            showSelectionCheckbox: true
        };

        //////////////////// keywords ////////////////////
        $scope.selectedKeywords = [];
        $scope.keywordList = [];
        $scope.keywordOptions = {
            data: 'keywordList',
            selectedItems: $scope.selectedKeywords,
            afterSelectionChange: function () {
            },
            sortInfo: { fields: ['Weight', 'Keyword'], directions: ["desc"] },
            columnDefs: [
                { field: 'Keyword', displayName: 'Keyword', enableCellEdit: false, cellTemplate: '<span class="ngCellText" title="{{row.entity.Keyword}}" >{{row.entity.Keyword}}</span>' },
                { field: 'Type', displayName: 'Type', enableCellEdit: false, visible: false },
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false, visible: false },
                { field: 'Data', displayName: 'Data', enableCellEdit: false, visible: false },
                { field: 'Weight', displayName: 'Hit Count', enableCellEdit: false, width: 80 }
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
        //////////////////// user input keyword ////////////////////
        $scope.userInputKeyword = { value: "", disabled: false };


        //////////////////// news ////////////////////
        $scope.selectedNews = [];
        $scope.newsList = [];
        $scope.newsOptions = {
            data: 'newsList',
            selectedItems: $scope.selectedNews,
            afterSelectionChange: function () {

            },

            columnDefs: [
                {
                    field: 'Title', displayName: 'Title', enableCellEdit: false, width: 420,
                    cellTemplate: '<span ng-click="openNews($event.target)" style="margin:5px;" ng-bind-html="COL_FIELD"></span>'
                },
                { field: 'Match', displayName: 'Match', enableCellEdit: false, visible: false },
                { field: 'Urn', displayName: 'Urn', enableCellEdit: false, visible: false },
                { field: 'CmpListStr', displayName: 'Related Company Quotes', enableCellEdit: false },
                { field: 'CmpList', displayName: 'CmpList', enableCellEdit: false, visible: false },
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




        $scope.threshold = { ownership: 0.02, index: 1 };
        $scope.newQuote = { value: "TRI.N", disabled: false };


        $scope.addQuote = function (quote) {
            if (quote == "" || quote == null) {
                dialogs.notify("Warning", "Please input a Quote!");
            } else {
                $scope.newQuote.disabled = true;
                if ($scope.checkExist(quote)) {
                    $scope.newQuote.disabled = false;
                    dialogs.notify("Warning", quote + " has existed in the list!");
                } else {
                    dataCloudSvc.validateQuote(quote).then(addQuoteCallbackHandler);
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
                    $scope.selectedQuotes.splice(0, 1);
                });
            }
        };
        $scope.removeKeyword = function () {
            if ($scope.selectedKeywords.length == 0) {
                dialogs.notify("Warning", "Please select a Keyword!");
            } else {
                var str = $scope.selectedKeywords.length + " keyword(s) ? : ";
                for (var i = 0; i < $scope.selectedKeywords.length; i++) {
                    if (i >= 1) {
                        str = str + ' ' + '...';
                        break;
                    }
                    else
                        str = str + ' ' + $scope.selectedKeywords[i].Keyword;
                }

                dialogs.confirm("Please Confirm", "Are you sure you want to remove " + str).result.then(function () {
                    for (var i = 0; i < $scope.selectedKeywords.length; i++) {
                        angular.forEach($scope.keywordList, function (data, index) {
                            if (data.Keyword == $scope.selectedKeywords[i].Keyword) {
                                $scope.keywordList.splice(index, 1);
                            }
                        });
                    }
                    $scope.selectedKeywords.splice(0, $scope.selectedKeywords.length);
                });
            }
        };

        $scope.generateKeywords = function () {
            if ($scope.quoteList.length > 0) {
                $scope.ownershipList = [];
                $scope.businessClassificationList = [];
                $scope.indexList = [];

                angular.forEach($scope.quoteList, function (data, index) {
                    $scope.generateKeyword(data.RIC);
                });
            } else {
                dialogs.notify("Warning", "Please add a Quote!");
            }
        };

        $scope.addKeyword = function (newKeyword) {
            if (newKeyword == undefined || newKeyword == null || newKeyword == "") {
                dialogs.notify("Warning", "Please fill in a valid keyword.");
                return;
            }
            $scope.userInputKeyword.disabled = true;
            if ($scope.getKeywordIndex(newKeyword) < 0) {
                $scope.keywordList.push({
                    Keyword: newKeyword,
                    Type: 'UserInput',
                    RIC: '',
                    Data: newKeyword,
                    Weight: 1
                });
                $scope.userInputKeyword.value = "";
            }
            else {
                dialogs.notify("Warning", "[" + newKeyword + "] has already existed.");
            }
            $scope.userInputKeyword.disabled = false;
        };

        $scope.checkExist = function (newQuote) {

            var existed = false;
            angular.forEach($scope.quoteList, function (data) {
                if (data.RIC == newQuote) {
                    existed = true;
                }
            });
            return existed;
        };


        $scope.getKeywordIndex = function (newKeyword) {
            for (var k = 0; k < $scope.keywordList.length; k++) {
                if ($scope.keywordList[k].Keyword == newKeyword) {
                    return k;
                }
            }
            return -1;
        };

        $scope.generateKeyword = function (quote) {
            dataCloudSvc.getOwnershipKeywords(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.ownershipParser(quote, rawData.rows, $scope.threshold.ownership);
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].rows.length; j++) {
                            if (data[i].rows[j].refCode != null) {
                                var k = $scope.getKeywordIndex(data[i].rows[j].refName);
                                if (k < 0) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'Ownership',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 1
                                    });
                                }
                                else {
                                    $scope.keywordList[k].Weight += 1;
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
                                var k = $scope.getKeywordIndex(data[i].rows[j].refName);
                                if (k < 0) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'BusinessClassification',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 1
                                    });
                                }
                                else {
                                    $scope.keywordList[k].Weight += 1;
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
                                var k = $scope.getKeywordIndex(data[i].rows[j].refName);
                                if (k < 0) {
                                    $scope.keywordList.push({
                                        Keyword: data[i].rows[j].refName,
                                        Type: 'Index',
                                        RIC: quote,
                                        Data: data[i].rows[j].queryDes,
                                        Weight: 1
                                    });
                                }
                                else {
                                    $scope.keywordList[k].Weight += 1;
                                }
                            }
                        }
                    }
                } else {
                    logSvc.logFn("Error when getting business classification data");
                }
            });
        };
        /*
                var successHandler = function() {
                            alert('here : ' + $scope.newQuote.value);
                    $scope.quoteList.push({ RIC: $scope.newQuote.value, Name: '' });
                    $scope.newQuote.value = "";
                    $scope.newQuote.disabled = false;
                };
                var errorHandler = function () {
                    dialogs.notify("Warning", "Please fill in the right ric for once.");
                    $scope.newQuote.disabled = false;
                };
        */
        var addQuoteCallbackHandler = function (response) {
            var arr = parserSvc.quoteRefParser(response.rows);

            if (response.status == "Ok") {
                for (var i = 0; i < arr.length; i++) {
                    $scope.quoteList.push({ RIC: arr[i].RIC, Name: arr[i].CmpName });
                }

                $scope.newQuote.value = "";
                $scope.newQuote.disabled = false;
            } else {
                dialogs.notify("Warning", "Please fill in the right ric for once.");
                $scope.newQuote.disabled = false;
            }

        };
        $scope.openMajorNews = function (quote) {
            jetSvc.openMajorNews(quote);
            logSvc.logFn("Open Major News: " + quote);
        };

        /////////////////////////////////////////////////////////////////////////
        $scope.generateNews = function () {
            var tmpStr = "";

            if ($scope.selectedKeywords.length > 0) {
                $scope.newsList = [];
                clearCompareQuotes();

                for (var i = 0; i < $scope.selectedKeywords.length; i++) {
                    // single searching expression can't contain the expression separator ",", so replease "," with a space
                    tmpStr += $scope.selectedKeywords[i].Keyword.replace(/\,/g, ' ').replace(/\&/g, ',').replace(/ +/g, ' ') + ",";
                }

                for (var i = 0; i < $scope.quoteList.length; i++) {
                    // single searching expression can't contain the expression separator ",", so replease "," with a space
                    tmpStr += $scope.quoteList[i].RIC + ",";
                }

                jetSvc.getRelatedNews(tmpStr.substring(0, tmpStr.length - 1), appendNews, 5);

            } else {
                dialogs.notify("Warning", "Please add a Keyword!");
            }
        };

        $scope.moreNews = function () {
            jetSvc.getRelatedNews(null, appendNews, 5);
        };

        var appendNews = function (command) {
            logSvc.logFn("append:" + command.h);
            $scope.$apply(
                function () {
                    //                    if( command.ht != 2 ) //ht=2 refers to alerting
                    //                        return;

                    var existingNewsFlag = false;
                    for (var i = 0; i < $scope.newsList.length; i++) {
                        if ($scope.newsList[i].Urn == command.urn) {
                            existingNewsFlag = true;
                            break;
                        }
                    }

                    if (!existingNewsFlag) {
                        //check whether the company list contain rics out of user input quote list
                        var cmpList = new Array();
                        var cmpListStr = "";
                        for (var i = 0; i < command.rl.length; i++) {
                            if (command.rl[i].substring(0, 1) != '.' && command.rl[i].indexOf('.') > 0 && command.rl[i].indexOf('.') == command.rl[i].lastIndexOf('.')) {
                                cmpList.push(command.rl[i]);
                            }
                        }
                        cmpListStr = cmpList.slice(0, 2);
                        if (cmpList.length > 2) cmpListStr.push("...");
                        var tmpMatch = 0;
                        //count the key words
                        // 1) no case sensitive 2) ignore spaces 3) ?

                        //                        for (var i = 0; i < $scope.selectedKeywords.length; i++) {
                        //                            var patt = new RegExp($scope.selectedKeywords[i].Keyword.replace(/[ ]*\(.*\)[ ]*/g, '').replace(/\./g, '\\.').replace(/ /g, '.+?'), 'ig');
                        //							
                        //                            if ( patt.exec(command.h.replace(/\<b\>/g, '').replace(/\<\/b\>/g,'')) != null ) tmpMatch += 1;
                        //                        }                        

                        $scope.newsList.push({
                            Title: $sce.trustAsHtml('<label urn="' + command.urn + '" hidden="true"/>'
                                                     + command.h + ' --' + command.d + ' ' + command.t + ' [' + command.src + ']'
                                                     + '<label hidden="true" cmp="' + JSON.stringify(cmpList) + '">'),
                            //Title: $sce.trustAsHtml('<div ng-click="openNews('+command.urn+')>' + command.h + ' --' + command.d + ' ' + command.t + ' [' + command.src + '(' + command.urn +')' + ']' + '</div>'),							
                            Match: tmpMatch,
                            Urn: command.urn,
                            CmpListStr: cmpListStr,
                            CmpList: cmpList
                        });

                        //add related cmp to compare List:
                        $scope.addCompareQuoteData(cmpList);
                    }
                }
           );
        };


        /*
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
         */
        $scope.openNews = function (command) {
            logSvc.logFn("$scope.openNews:" + command.innerHTML);
            var urn = command.childNodes[0].getAttribute("urn");
            logSvc.logFn("urn:" + urn);
            jetSvc.openNews(urn);
        };



        $scope.showCmpOverview = function (quote) {

            $scope.cmpBusinessSummaryData = "";
            dataCloudSvc.validateQuote(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.quoteRefParser(rawData.rows);
                    $scope.cmpBusinessSummaryData = (data[0].BusinessSummary == null ? "" : data[0].BusinessSummary);
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpBusinessSegmentData = [];
            dataCloudSvc.getBusinessSegment(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.businessSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpBusinessSegmentData.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpGeographicSegmentData = [];
            dataCloudSvc.getGeographicSegment(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.geographicSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpGeographicSegmentData.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting geographic segmenet data");
                }
            });

        };

        ////////////////////////// tab Investment Advisory //////////////////////////
        //////////////////// for comparing quote pairs ///////////////////////////
        $scope.compareQuotes = { quote1: "", quote2: "" };
        // mock data should update this array dynamically
        $scope.compareQuoteData = [];
        $scope.compareQuoteDataSelected = [];
        $scope.compareQuoteDataOptions = {
            data: 'compareQuoteData',
            selectedItems: $scope.compareQuoteDataSelected,
            afterSelectionChange: function (rowItem, event) {

                if ($scope.compareQuoteDataSelected[0] == undefined) {
                    $scope.compareQuotes.quote2 = "";
                    return;
                }
                
                $scope.compareQuotes.quote2 = $scope.compareQuoteDataSelected[0];
                var quotes = [$scope.compareQuotes.quote1, $scope.compareQuotes.quote2];
                $scope.commonStatisticsData = [];
                /*
               $scope.showCmpOverview1(quotes[1]);
            
                dataCloudSvc.getCommonStatistics(quotes).then(function (rawData) {
                    var data = parserSvc.commonStatisticsParse(quotes, rawData.rows);

                    for (var i = 0; i < data.length; i++)
                        $scope.commonStatisticsData.push({
                            "RIC": data[i].rows[0].query,
                            "Price2BV": data[i].rows[0].Price2BV,
                            "Price2EPS": data[i].rows[0].Price2EPS,
                            "Price2CF": data[i].rows[0].Price2CF,
                            "EV2EBITDA": data[i].rows[0].EV2EBITDA
                        });
                });
                */
				/*
                if ($scope.compareQuoteDataSelected.length > 0) {
                    $scope.open([$scope.compareQuoteDataSelected[$scope.compareQuoteDataSelected.length - 1].RIC]);
                } */
            },
            sortInfo: { fields: ['RIC'] },
            columnDefs: [
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false },
                { field: 'Name', displayName: 'Name', enableCellEdit: false, cellTemplate: '<span class="ngCellText" title="{{row.entity.Name}}" >{{row.entity.Name}}</span>' }
            ],
            enablePinning: false,
            enableCellSelection: false,
            enableCellEditOnFocus: false,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: false,
            showSelectionCheckbox: true
        };

        $scope.compareQuoteDataKeys = [];
        /*
                $scope.compareQuotesChangeSelection = function (item) {
                    $scope.compareQuotes.quote1 = item.Quote1;
                    $scope.compareQuotes.quote2 = item.Quote2;
                    var quotes = [item.Quote1, item.Quote2];
                    $scope.commonStatisticsData = [];
                    
                    $scope.showCmpOverview1([item.Quote2]);
        
                    dataCloudSvc.getCommonStatistics(quotes).then(function(rawData) {
                        var data = parserSvc.commonStatisticsParse(quotes,rawData.rows);
                        
                        for(var i=0;i<data.length;i++)
                            $scope.commonStatisticsData.push({"RIC" : data[i].rows[0].query,
                                                              "Price2BV" : data[i].rows[0].Price2BV,
                                                              "Price2EPS" : data[i].rows[0].Price2EPS,
                                                              "Price2CF"  : data[i].rows[0].Price2CF,
                                                              "EV2EBITDA"   :data[i].rows[0].EV2EBITDA
                                                              });
                    });                         
                };
        */

        //////////////////// for common statistics///////////////////////////
        $scope.commonStatisticsData = [];
        $scope.commonStatistics = {
            data: 'commonStatisticsData',
            afterSelectionChange: function () {
            },

            columnDefs: [
                { field: 'RIC', displayName: 'RIC', enableCellEdit: false },
                { field: 'Price2BV', displayName: 'P/BV', enableCellEdit: false },
                { field: 'Price2EPS', displayName: 'P/EPS', enableCellEdit: false },
                { field: 'Price2CF', displayName: 'P/CF', enableCellEdit: false },
                { field: 'EV2EBITDA', displayName: 'EV/EBITDA', enableCellEdit: false }
            ],
            enablePinning: false,
            enableCellSelection: false,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: false,
            multiSelect: false,
            showSelectionCheckbox: false
        };

        //////////////////// for price statistics///////////////////////////
        $scope.pricePeriods = [{ id: "Y", value: "Year" }, { id: "Q", value: "Quarter" }, { id: "M", value: "Month" }, { id: "W", value: "Week" }];
        $scope.pricePeriodSelected = $scope.pricePeriods[2];
        $scope.holdingWeight = [0.5, 0.5];
        $scope.valueRiskCfg = [{ percentage: 0.99, normsinv: 2.326347874 }, { percentage: 0.95, normsinv: 1.644853627 }, { percentage: 0.90, normsinv: 1.281551566 }];
        $scope.priceStatistic = {
            x: "",
            y: "",
            xStandardDeviation: "",
            yStandardDeviation: "",
            covariance: "",
            volatility: "",
            valueRisks: []
        };

        $scope.priceStatisticValueRisksDataCfg = [{ Percentage: 0.99, Factor: 2.58, Normsinv: 2.326347874 },
                                                  { Percentage: 0.95, Factor: 1.96, Normsinv: 1.644853627 },
                                                  { Percentage: 0.90, Factor: 1.64, Normsinv: 1.281551566 }];
        $scope.priceStatisticValueRisksData = [];
        $scope.priceStatisticValueRisks = {
            data: 'priceStatisticValueRisksData',
            afterSelectionChange: function () {

            },
            columnDefs: [
                { field: 'Percentage', displayName: 'Confidence Level', enableCellEdit: false },
                { field: 'Factor', displayName: 'Factor', enableCellEdit: false },
                { field: 'Normsinv', displayName: 'Normsinv', enableCellEdit: false },
                { field: 'VR_X', displayName: 'VR_X', enableCellEdit: false },
                { field: 'VR_Y', displayName: 'VR_Y', enableCellEdit: false },
                { field: 'VR_XY', displayName: 'VR_XY', enableCellEdit: false },
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


        //////////////////// for company overview ///////////////////////////
        $scope.cmpBusinessSummaryData1 = "";
        $scope.cmpBusinessSegmentData1 = [];
        $scope.cmpGeographicSegmentData1 = [];
        $scope.cmpBusinessSegment1 = {
            data: 'cmpBusinessSegmentData1',
            sortInfo: { fields: ['RIC', 'Weight'] },
            columnDefs: [
                { field: 'RIC', displayName: 'RIC' },
                { field: 'SegmentName', displayName: 'SegmentName' },
                { field: 'FPeriod', displayName: 'FPeriod' },
                { field: 'TotalRevenue', displayName: 'TotalRevenue' },
                { field: 'Weight', displayName: 'Weight' }
            ],
            enablePinning: false,
            enableCellSelection: false,
            enableCellEditOnFocus: true,
            showHeader: true,
            showColumnMenu: false,
            enableHighlighting: true,
            enableRowReordering: true,
            multiSelect: false,
            showSelectionCheckbox: false
        };
        $scope.cmpGeographicSegment1 = {
            data: 'cmpGeographicSegmentData1',
            sortInfo: { fields: ['RIC', 'Weight'] },
            columnDefs: [
                { field: 'RIC', displayName: 'RIC' },
                { field: 'SegmentName', displayName: 'SegmentName' },
                { field: 'FPeriod', displayName: 'FPeriod' },
                { field: 'TotalRevenue', displayName: 'TotalRevenue' },
                { field: 'Weight', displayName: 'Weight' }
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

        var clearCompareQuotes = function () {
            $scope.compareQuoteData = [];
            $scope.compareQuoteDataKeys = [];
        }

        $scope.addCompareQuoteData = function (cmpList) {
            var funName = "addCompareQuoteData";
            logSvc.logFn("start in " + funName);
            var quoteList1 = new Array($scope.quoteList.length);
            var quoteList2 = new Array();

            for (var i = 0; i < $scope.quoteList.length; i++)
                quoteList1[i] = $scope.quoteList[i].RIC;

            for (var i = 0; i < cmpList.length; i++)
                if (quoteList1.indexOf(cmpList[i]) < 0 && $scope.compareQuoteDataKeys.indexOf(cmpList[i]) < 0) quoteList2.push(cmpList[i]);

            dataCloudSvc.validateQuote(quoteList2).then(function (rawData) {

                if (rawData.status == "Ok") {
                    var data = parserSvc.quoteRefParser(rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        if (data[i].CmpName != null && $scope.compareQuoteDataKeys.indexOf(cmpList[i]) < 0) {
                            $scope.compareQuoteData.push({
                                RIC: data[i].RIC,
                                Name: data[i].CmpName
                            });
                            $scope.compareQuoteDataKeys.push(data[i].RIC);
                        }
                } else {
                    logSvc.logFn("Error in addCompareQuoteData");
                }

            });

        };


        $scope.calculatePriceStatistics = function (compareQuotes, periodSelected) {

            if (compareQuotes.quote1 == null || compareQuotes.quote2 == null || compareQuotes.quote1 == "" || compareQuotes.quote2 == "") {
                dialogs.notify("Warning", "Can't calculate price statistics for incomplete quote pair!");
                return;
            }
            var quotes = [compareQuotes.quote1.RIC, compareQuotes.quote2.RIC]; //$scope.compareQuotes.quote1,$scope.compareQuotes.quote2];
            //for testing
            //quotes = ["IBM.N","000002.SZ"];
            $scope.commonStatisticsData = [];
            $scope.priceStatisticValueRisksData = [];

            dataCloudSvc.getPrice(quotes, periodSelected.id).then(function (rawData) {
                if (rawData.status == "Ok") {

                    var data = parserSvc.priceParser(quotes, rawData.rows);
                    if (data.length != 2 || data[0].rows.length == 0 || data[1].rows.length == 0) {
                        dialogs.notify("Warning", "Can't calculate price statistics due to incomplete time-series data. Please try again with larger time coverage");
                        return;
                    }
                    var len = data[0].rows.length < data[1].rows.length ? data[0].rows.length : data[1].rows.length;

                    var arr1 = new Array();
                    var arr2 = new Array();
                    for (var j = 0; j < len; j++) {
                        arr1.push(data[0].rows[data[0].rows.length - j - 1].priceClose);
                        arr2.push(data[1].rows[data[1].rows.length - j - 1].priceClose);
                    }

                    $scope.priceStatistic.x = data[0].query;
                    $scope.priceStatistic.y = data[1].query;
                    // for testing
                    //arr1 = [9.8,25.3,35.5,30.3,24,36.7];
                    //arr2 = [50.3,59.9,64.4,64.6,63.5,60.2];

                    $scope.priceStatistic.xStandardDeviation = parserSvc.calcStandardDeviation(arr1);//calcStandardDeviation(arr1);//statisticSvc.calcStandardDeviation(arr1);
                    $scope.priceStatistic.yStandardDeviation = parserSvc.calcStandardDeviation(arr2);//calcStandardDeviation(arr2);//statisticSvc.calcStandardDeviation(arr2);
                    var sdArr = [$scope.priceStatistic.xStandardDeviation, $scope.priceStatistic.yStandardDeviation];
                    $scope.priceStatistic.covariance = parserSvc.calcCovariance(arr1, arr2, sdArr); //calcCovariance(arr1, arr2); //statisticSvc.calcCovariance(arr1, arr2);  */
                    $scope.priceStatistic.volatility = parserSvc.calcVolatility([0.4, 0.6], sdArr, $scope.priceStatistic.covariance); //calcCovariance(arr1, arr2); //statisticSvc.calcCovariance(arr1, arr2);  */
                    var vrArr = parserSvc.calcValueRisks($scope.priceStatisticValueRisksDataCfg, [arr1[arr1.length - 1], arr2[arr2.length - 1]], sdArr, $scope.priceStatistic.volatility);
                    for (var i = 0; i < $scope.priceStatisticValueRisksDataCfg.length; i++)
                        $scope.priceStatisticValueRisksData.push({
                            Percentage: $scope.priceStatisticValueRisksDataCfg[i].Percentage,
                            Factor: $scope.priceStatisticValueRisksDataCfg[i].Factor,
                            Normsinv: $scope.priceStatisticValueRisksDataCfg[i].Normsinv,
                            VR_X: vrArr[i].VR_X,
                            VR_Y: vrArr[i].VR_Y,
                            VR_XY: vrArr[i].VR_XY
                        });

                } else {
                    logSvc.logFn("Error when getting price data" + JSON.stringify(rawData));
                    dialogs.notify("Warning", "Error when getting price data" + JSON.stringify(rawData));
                }
                dataCloudSvc.getCommonStatistics(quotes).then(function (rawData) {
                    var data = parserSvc.commonStatisticsParse(quotes, rawData.rows);

                    for (var i = 0; i < data.length; i++)
                        $scope.commonStatisticsData.push({
                            "RIC": data[i].rows[0].query,
                            "Price2BV": data[i].rows[0].Price2BV,
                            "Price2EPS": data[i].rows[0].Price2EPS,
                            "Price2CF": data[i].rows[0].Price2CF,
                            "EV2EBITDA": data[i].rows[0].EV2EBITDA
                        });
                });
            });

        };



        $scope.showCmpOverview1 = function (quote) {

            $scope.cmpBusinessSummaryData1 = "";
            dataCloudSvc.validateQuote(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.quoteRefParser(rawData.rows);
                    $scope.cmpBusinessSummaryData1 = (data[0].BusinessSummary == null ? "" : data[0].BusinessSummary);
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpBusinessSegmentData1 = [];
            dataCloudSvc.getBusinessSegment(quote).then(function (rawData) {

                if (rawData.status == "Ok") {
                    var data = parserSvc.businessSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpBusinessSegmentData1.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting business segmenet data");
                }
            });

            $scope.cmpGeographicSegmentData1 = [];
            dataCloudSvc.getGeographicSegment(quote).then(function (rawData) {
                if (rawData.status == "Ok") {
                    var data = parserSvc.geographicSegementParser(quote, rawData.rows);
                    for (var i = 0; i < data.length; i++)
                        for (var j = 0; j < data[i].rows.length; j++) {
                            $scope.cmpGeographicSegmentData1.push({
                                RIC: data[i].rows[j].query,
                                SegmentName: data[i].rows[j].SegmentName,
                                FPeriod: data[i].rows[j].fperiod,
                                TotalRevenue: data[i].rows[j].Currency + " " + data[i].rows[j].TotalRevenue,
                                Weight: data[i].rows[j].Weight
                            });
                        }
                } else {
                    logSvc.logFn("Error when getting geographic segmenet data");
                }
            });

        };



    }]);