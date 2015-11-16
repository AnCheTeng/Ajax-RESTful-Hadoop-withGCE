String.prototype.replaceAll = function(s1, s2) {
  return this.replace(new RegExp(s1, "gm"), s2);
}

$(document).ready(function() {
  $.getJSON('/list', function(result) {
    $.each(result, function(index, task) {
      var task_row = $('<tr></tr>');
      var filename = task.file;
      task_row.append('<td data-filename=' + filename + '>' + filename + '</td>');
      task_row.append('<td><button class="btn btn-info">' + task.state + '</button></td>');
      task_row.append('<td><button class="btn btn-warning">Edit</button></td>');
      $('tbody').append(task_row);
    })
  });
  $('tbody').on('click', '.btn-info', function(event) {
    event.preventDefault();
    var fn = $(this).parent().parent().children().first().data('filename');
    $.getJSON('/task/' + fn, function(task_info) {
      var cleanup = task_info.result.replaceAll("\n", " <br /> ");
      var timestamp = "<h4>Process Time: " + task_info.process_time + "</h3><br />" + "<h4>Result: </h3><br />";
      cleanup = timestamp + cleanup;
      $('.hadoop-task-result').fadeToggle();
      $('.hadoop-task-result').html('<p>' + cleanup + '</p>').fadeToggle();
    });
  });

  $("#upfile").click(function() {
    $("#fileupload").trigger('click');
  });
  $('#fileupload').change(function() {
    $('#fileupload').fileupload({
      dataType: 'json'
    });
    var file = this.files[0];
    var name = file.name;
    //Your validation
    console.log(name);
  });

})
