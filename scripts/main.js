var appId = "nemo_eikon_game_main";
var log = null;
var appender = null;

$(document).ready(function(){
  try {
    JET.init({
        ID: appId
    });
  }catch(ex) {
      alert("in read \n" + ex);
  }
});
