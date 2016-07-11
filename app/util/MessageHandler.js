module.exports = {
    ShowMessages : function (messageList) {
      if(messageList.length < 1) return;

      forEach(function(item, index, array) {  
      	console.log(item + '\n'); 
      });
    }
};
