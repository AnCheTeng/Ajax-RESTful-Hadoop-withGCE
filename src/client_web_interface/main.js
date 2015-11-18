String.prototype.replaceAll = function(s1, s2) {
  return this.replace(new RegExp(s1, "gm"), s2);
}

$(document).ready(function() {
  // Function: Automatically refresh the web page when loaded
  $.getJSON('/list', function(result) {
    $.each(result, function(index, task) {
      var task_row = $('<tr></tr>');
      var filename = task.file;
      task_row.append('<td data-filename=' + filename + '>' + filename + '</td>');
      task_row.append('<td><button class="btn btn-info">' + task.state + '</button></td>');
      task_row.append('<td><button class="btn btn-warning">Delete</button></td>');
      $('tbody').append(task_row);
    })
  });
  // Function: See result when done !
  $('tbody').on('click', '.btn-info', function(event) {
    event.preventDefault();
    var fn = $(this).parent().parent().children().first().data('filename');
    $.getJSON('/task/' + fn, function(task_info) {
      var cleanup = task_info.result.replaceAll("\n", " <br /> ");
      var timestamp = "<h4>File Name: " + task_info.file + "</h4><h4>Process Time: " + task_info.process_time + "</h4>" + "<h4>Result:</h4>";
      cleanup = timestamp + cleanup;
      $('.hadoop-task-result').fadeToggle();
      $('.hadoop-task-result').html('<p>' + cleanup + '</p>').fadeToggle();
    });
  });
  // Function: Delete some object !
  $('tbody').on('click', '.btn-warning', function(event) {
    event.preventDefault();
    var remove_item = $(this).parent().parent();
    var fn = remove_item.children().first().data('filename');
    $.ajax('/task/' + fn, {
      type: 'DELETE',
      success: function() {
        remove_item.remove();
      }
    });
  });

  $("#upfile").click(function() {
    $("#fileupload").trigger('click');
  });
    $('#fileupload').fileupload({
      dataType: 'json',
      success: function() {
	var file = this.files[0];
        name = file.name;
        console.log(name);
        $.ajax('/task/' + name, {
          type: 'POST',
          success: function() {
            $.getJSON('/task/' + name, function(task) {
              var task_row = $('<tr></tr>');
              var filename = task.file;
              task_row.append('<td data-filename=' + filename + '>' + filename + '</td>');
              task_row.append('<td><button class="btn btn-info">' + task.state + '</button></td>');
              task_row.append('<td><button class="btn btn-warning">Delete</button></td>');
              $('tbody').append(task_row);
            });
          }
        });
      }
    });

})
