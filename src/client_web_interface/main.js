$(document).ready(function(){
  $.getJSON('/list', function(result){
    $.each(result, function(index, task){
      var task_row = $('<tr></tr>');
      var filename = task.file;
      task_row.append('<td data-filename='+filename+'>'+filename+'</td>');
      task_row.append('<td><button class="btn btn-info">'+task.state+'</button></td>');
      task_row.append('<td><button class="btn btn-warning">Edit</button></td>');
      $('tbody').append(task_row);
    })
  });
  $('button').on('click', function(){
    var fn = $(this).parent().find("td").first().data('filename');
    $.getJSON('/task/'+filename, function(task_info){
      $('.hadoop-task-result').text(task_info.result);
    });
  });
})
