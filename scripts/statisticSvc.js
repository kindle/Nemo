angular.module("nemoApp")
.factory("statisticSvc", ["logSvc", function (logSvc) {
    return {

         calcStandardDeviation: function(arr) {
            var tmpArr = new Array();
            var tmpSum = 0;
            var tmp = 0;
            for(var i=0;i<arr.length-1;i++) {
                tmp = arr[i+1] - arr[i];
                tmpArr.push(tmp);
                tmpSum = tmpSum + tmp;
            }
            var tmpAve = tmpSum / tmpArr.length;
            var tmpSum = 0;
            for(var i=0;i<tmpArr.length;i++) {
                tmp = Math.pow(tmpArr[i]-tmpAve,2);
                tmpSum = tmpSum + tmp;
            }
            tmpAve = tmpSum / tmpArr.length;
            tmp = Math.pow(tmpAve, 0.5);
            return tmp;
        },
		 
        calcCovariance: function(arr1, arr2) {
            if( arr1.length != arr2.length ) {
                alert("ERROR in calcCovariance: expect to have two arrays with the same length");
                return 0;
            }
            var tmpArr1 = new Array();
            var tmpSum1 = 0;
            var tmp = 0;
            for(var i=0;i<arr1.length-1;i++) {
                tmp = arr1[i+1] - arr1[i];
                tmpArr1.push(tmp);
                tmpSum1 = tmpSum1+ tmp;
            }
            var tmpAve1 = tmpSum1 / tmpArr1.length;
			
            var tmpArr2 = new Array();
            var tmpSum2 = 0;
            tmp = 0;
            for(var i=0;i<arr2.length-1;i++) {
                tmp = arr2[i+1] - arr2[i];
                tmpArr2.push(tmp);
                tmpSum2 = tmpSum2+ tmp;
            }
            var tmpAve2 = tmpSum2 / tmpArr2.length;

            tmp = 0;
            for(var i=0;i<tmpArr1.length;i++) {
                tmp = tmp + (tmpArr1[i]-tmpAve1) * (tmpArr2[i]-tmpAve2);
            }
            tmp = tmp / tmpArr2.length;
			
            return tmp;
         }

    };
}]);