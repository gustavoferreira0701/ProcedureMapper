module.exports = {
    ShowMessages : function (messageList) {
      if(messageList.length < 1) return;

      for (var i = 0, count = messageList.length; i < count; i++) {
          console.log(messageList[i] + '\n');
      }
    }
};
