angular.module("nemoApp")
.factory("logSvc", [function () {
    return {
        logFn : function (msg) {
            try{
              if ( log == undefined ) {
                  log = log4javascript.getLogger("main");
                  appender = new log4javascript.PopUpAppender();
                  log.addAppender(appender);
                  log.info("log4javascript in-page loaded.");
                  appender.show();
              }
  
                var oldValue = $("body #PageStatus").val();
                $("body #PageStatus").val(oldValue + "\n" + Date() + " : \n  " + msg);
                //console.log('logFn - ' + msg); 
                log.info('logFn - ' + msg); 
            }
            catch(ex) {alert(ex);}
            }
        }
}]);