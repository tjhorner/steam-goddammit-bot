(function(){
  var socket = io();

  socket.on('bot:update', function(data){
    $.each(data, function(i, e){
      if(i === "users"){
        $("#userlist").html("");
        $.each(e, function(i2, user){
          $user = $("<div></div>");
          $user.text(user.playerName);
          $user.attr("data-steam-id", user.friendid);
          $("#userlist").append($user);
        });
      }
      $("[data-listen-for=\"" + i + "\"]").text(e);
    });
  });
}());
