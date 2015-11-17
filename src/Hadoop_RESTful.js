var express = require('express');
var mongoose = require('mongoose');
var exec = require('child_process').exec;
var Task = require('./Task');
var upload = require('jquery-file-upload-middleware');
var Schema = mongoose.Schema;
var app = express();

mongoose.connect('mongodb://localhost/hadoop-task');

// Execute Hadoop-Apache-Log-Analysis shell command ewith Node.js
function runHadoop(filename) {
  console.log("===========================Start to analyze " + filename + " !.===========================");
  var task_start_time = new Date().getTime();
  // Use chaining callback with exec()
  // Todo: Maybe we can use require('child-process-promise').exec instead of require('child_process').exec
  exec("hdfs dfs -rm -r -f CCTslog", function() {
    exec("hdfs dfs -mkdir CCTslog", function() {
      exec("hdfs dfs -copyFromLocal uploads/" + filename + " CCTslog/log_file", function() {
        exec("hdfs dfs -rm -r -f CCTslog_outdir", function() {
          exec("bash log_analysis.sh", function() {
            exec("hdfs dfs -text CCTslog_outdir/part-00000", function(error, stdout, stderr) {
              var task_end_time = new Date().getTime();
              console.log("===========================Analysis of " + filename + " is finished!===========================");
              Task.findOne({
                file: filename
              }, function(err, hadooptask) {
                hadooptask.result = stdout;
                hadooptask.start_time = task_start_time;
                hadooptask.end_time = task_end_time;
                hadooptask.process_time = (task_end_time - task_start_time) / 1000 + " second";
                Task.findOne({
                  _id: hadooptask.next_task
                }, function(err, nextTask) {
                  hadooptask.state = "done";
                  if (nextTask != null) {
                    nextTask.state = "running";
                    nextTask.save();
                    hadooptask.save();
                    runHadoop(nextTask.file);
                  } else {
                    console.log("This is the end of queue!");
                    hadooptask.save();
                  }
                });
              });
            });
          });
        });
      });
    });
  });

}

// Create a SUPERNODE if there is no SUPERNODE
Task.findOne({
  state: "SUPERNODE"
}, function(err, supernode) {
  if (supernode == null) {
    var super_task = new Task({
      file: "SUPERNODE",
      state: "SUPERNODE",
      created_time: new Date().getTime()
    });
    super_task.save();
  }
})

console.log("===========================Server is starting===========================");

app.use(express.static('client_web_interface'));

upload.configure({
  uploadDir: __dirname + '/uploads',
  uploadUrl: '/uploads'
});

app.use('/upload', function(req, res, next) {
  console.log("Uploading!");
  upload.fileHandler({
    uploadDir: function() {
      return __dirname + '/uploads'
    },
    uploadUrl: function() {
      return '/uploads'
    }
  })(req, res, next);
});


// Home page
app.get('/', function(request, response) {
  console.log("This is /");
});

// Route for /task/:filename
app.route('/task/:filename')
  //===========================GET /task/:filename===========================
  .get(function(request, response) {
    Task.findOne({
      file: request.params.filename
    }, function(err, found_file) {
      response.send(found_file);
    });
  })
  //===========================POST /task/:filename===========================
  .post(function(request, response) {
    // Check is there any running task first
    Task.find({
      state: "running"
    }, function(err, running_task) {

      var task_state = "";
      // Check the state of new task
      if (running_task.length == 0) {
        newtask_state = "running";
      } else {
        newtask_state = "waiting";
      }
      // Create a new task document
      var newtask = new Task({
        file: request.params.filename,
        state: newtask_state,
        created_time: new Date().getTime()
      });
      // Save the new task
      newtask.save(function(err) {
        console.log("Save " + newtask.file + " successfully!");
      });
      // Find the end-node of the queue and set its next_task to newtask._id
      Task.findOne({
        next_task: null,
        created_time: {
          $lt: newtask.created_time
        }
      }).exec(function(err, last_task) {
        last_task.next_task = newtask._id;
        last_task.save();
      });
      // Return POST result and run the service
      //console.log('\nReturn: ' + newtask);
      response.send(newtask);
      response.end();
      // Run Hadoop analysis
      if (newtask_state = "running") {
        runHadoop(newtask.file);
      }
    });
  })
  //===========================DELETE /task/:filename===========================
  .delete(function(request, response) {
    Task.findOneAndRemove({
      file: request.params.filename
    }).exec(function(err, deleted_task) {
      Task.findOne({
        next_task: deleted_task._id
      }, function(err, prev_node) {
        if (prev_node != null) {
          prev_node.next_task = deleted_task.next_task;
          prev_node.save();
        }
      });
      //console.log(deleted_task + '\nIs deleted.');
      response.send("Now delete the file " + request.params.filename + "\n" + deleted_task);
    });
  });

//===========================GET /list===========================
app.get('/list', function(request, response) {
  Task.find({
    state: {
      $ne: "SUPERNODE"
    }
  }, {
    result: false
  }).sort({
    "created_time": 1
  }).exec(function(err, tasks) {
    response.send(tasks);
    //console.log(tasks);
  });

});

//===========================GET /done===========================
app.get('/done', function(request, response) {
  Task.find({
    state: "done"
  }, {
    result: false
  }).exec(function(err, done_list) {
    //console.log(done_list);
    response.send(done_list);
  });
});

//================================Here is the testing API================================

// This is the test method for "POST /task/:filename"
app.get('/add/:filename', function(request, response) {
  // Check is there any running task first
  Task.find({
    state: "running"
  }, function(err, running_task) {

    var task_state = "";
    // Check the state of new task
    if (running_task.length == 0) {
      newtask_state = "running";
    } else {
      newtask_state = "waiting";
    }
    // Create a new task document
    var newtask = new Task({
      file: request.params.filename,
      state: newtask_state,
      created_time: new Date().getTime()
    });
    // Save the new task
    newtask.save(function(err) {
      console.log("Save " + newtask.file + " successfully!");
    });
    // Find the end-node of the queue and set its next_task to newtask._id
    Task.findOne({
      next_task: null,
      created_time: {
        $lt: newtask.created_time
      }
    }).exec(function(err, last_task) {
      last_task.next_task = newtask._id;
      last_task.save();
    });
    // Return POST result and run the service
    //console.log('\nReturn: ' + newtask);
    response.send(newtask);
    response.end();
    // Run Hadoop analysis
    if (newtask_state = "running") {
      runHadoop(newtask.file);
    }
  });
});

// This is the test method for "DELETE /task/:filename"
app.get('/remove/:filename', function(request, response) {
  Task.findOneAndRemove({
    file: request.params.filename
  }).exec(function(err, deleted_task) {
    Task.findOne({
      next_task: deleted_task._id
    }, function(err, prev_node) {
      // Deal with the linked-list pointer
      if (prev_node != null) {
        prev_node.next_task = deleted_task.next_task;
        prev_node.save();
      }
    });
    //console.log(deleted_task + '\nIs deleted.');
    response.send("Now delete the file " + request.params.filename + "\n" + deleted_task);
  });
});

// This method is for testing, delete all tasks
app.get('/delete_all', function(request, response) {
  exec("rm -r uploads", function() {
    exec("mkdir uploads");
  });
  Task.find({
    state: {
      $ne: "SUPERNODE"
    }
  }).remove().exec();
  Task.findOne({
    state: "SUPERNODE"
  }, function(err, supernode) {
    supernode.next_task = null;
    supernode.save();
  });
  response.send("Delete all!");
});

app.listen(8080);
