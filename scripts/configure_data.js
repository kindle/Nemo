function initGlobalVarFn() {
  // initialise data_clound variables
  if ( eikonEnv == "Alpha") {
  	//uuid = "PAXTRA-913530672";
  	hostUrl = "http://amers1.datacloud.cp.icp2.mpp.ime.reuters.com:1080"; // Alpha

  }
  if ( eikonEnv == "Beta")  {
  	//uuid = "PAXTRA27775";//"PAXTRA-913530672";
  	hostUrl = "http://datacloud-beta.int.thomsonreuters.com:1080"; // Beta
  	
  }
  if (eikonEnv=="Prod") {
  	//uuid = "SL1-2P99Y6B"; // Use your own internal UUID if you have
    hostUrl = "http://datacloud-hdc.int.thomsonreuters.com:1080"; // Prod  	
  }
  
  createQuoteListDivName = "#createQuoteListDiv";
  appId = "byu_test_eikon_game_main";
  quoteListFormName = "#quoteListForm";
  
  hiddenTestingLabels = "N";

}
