angular.module("nemoApp")
.factory("logSvc", [function () {
    return {
        logFn : function (msg) {
            try {
                if (log == undefined ) {
                    log = log4javascript.getLogger("main");
                    appender = new log4javascript.PopUpAppender();
                    log.addAppender(appender);
                    log.info("log4javascript in-page loaded.");
                    appender.show();
                }
  
                log.info('logFn - ' + msg); 
            }
            catch(ex) {alert(ex);}
            }
        }
}]);