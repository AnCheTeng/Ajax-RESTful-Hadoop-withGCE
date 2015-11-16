$(document).ready(function(){
  $.getJSON('http://104.155.223.19:8080/list', function(result){
    var hello = $('<p></p>');
    hello.append('result');
    $('tbody').append(hello);
    $.each(result, function(index, task){
      var hello = $('<tr></tr>');
      hello.append('<td>'+task.file+'</td>');
      hello.append('<td><button class="btn btn-info">'+task.state+'</button></td>');
      hello.append('<td><button class="btn btn-warning">Edit</button></td>');
      $('tbody').append(hello);
    })
  });
  console.log("FUCK");
  $.ajax('http://104.155.223.19:8080/list', {
    dataType: 'jsonp',
    crossDomain: true,
    success: function(result){
      console.log(result);
    },
    error: function(error){
      console.log('Fuck you, there is error');
      console.log(error);
    }
  });
  // var hello = $('<tr></tr>');
  // hello.append('<td>Hi</td>');
  // hello.append('<td><button class="btn btn-info">Button</button></td>');
  // hello.append('<td><button class="btn btn-warning">Button</button></td>');
  // $('tbody').append(hello);
})
