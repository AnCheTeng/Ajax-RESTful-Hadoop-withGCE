$(document).ready(function(){
  $.getJSON('/list', function(result){
    var task_row = $('<p></p>');
    task_row.append('result');
    $('tbody').append(task_row);
    $.each(result, function(index, task){
      var task_row = $('<tr></tr>');
      task_row.append('<td>'+task.file+'</td>');
      task_row.append('<td><button class="btn btn-info">'+task.state+'</button></td>');
      task_row.append('<td><button class="btn btn-warning">Edit</button></td>');
      $('tbody').append(task_row);
    })
  });
})
