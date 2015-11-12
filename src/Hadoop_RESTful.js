var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var exec = require('child_process').exec;

var Task = require('./Task');

mongoose.connect('mongodb://localhost/hadoop-task');
var app = express();

function runHadoop(analyzed_filename) {
  console.log("Let's start!");
  console.log("Move file to hdfs");
  exec("hdfs dfs -copyFromLocal " + analyzed_filename + " CCTslog/log_file", function() {
    console.log("Remove old output directory");
    exec("hdfs dfs -rm -r -f CCTslog_outdir", function() {
      console.log("Run bash log_analysis.sh");
      exec("bash log_analysis.sh", function() {
        exec("hdfs dfs -text CCTslog_outdir/part-00000", function(error, stdout, stderr) {
          console.log("Analysis of " + analyzed_filename + " is finished!");
          Task.findOne({
            file: analyzed_filename
          }, function(err, hadooptask) {
            hadooptask.result = stdout;
            hadooptask.save();
            Task.findOne({
              _id: hadooptask.next_task
            }, function(err, nextTask) {
              hadooptask.state = "done";
              if (nextTask != null) {
                nextTask.state = "running";
                hadooptask.save();
                nextTask.save();
                runHadoop(nextTask.file);
              } else {
                console.log("This is the end of queue!");
                hadooptask.save();
              }
            });
          })
        });
      });
    });
  });
}



Task.findOne({state: "SUPERNODE"}, function(err, supernode){
  if(supernode==null){
    var super_task = new Task({
      file: "SUPERNODE",
      state: "SUPERNODE"
    });
    super_task.save();
  }
})


console.log("==========Server is starting==========");


app.get('/', function(request, response) {
  console.log("This is /");
});

app.route('/task/:filename')
  .get(function(request, response) {
    Task.findOne({
      file: request.params.filename
    }, function(err, found_file) {
      response.send(found_file);
    });
  })
  .post(function(request, response) {
    Task.find({
      state: "running"
    }, function(err, running_task) {

      if (running_task.length == 0) {
        var newtask = new Task({
          file: request.params.filename,
          state: "running",
          created_time: new Date().getTime()
        });

        newtask.save(function(err) {
          console.log("Save " + newtask.file + " successfully!");
        });

        Task.findOne({
          next_task: null
        }).exec(function(err, last_task) {
          last_task.next_task = newtask._id;
          last_task.save();
        });

        Task.findOne({
          file: request.params.filename
        }).exec(function(err, task) {
          console.log('\nReturn: ' + task);
          response.send(task);
          runHadoop(task);
        });
      } else {

        var newtask = new Task({
          file: request.params.filename,
          state: "waiting",
          created_time: new Date().getTime()
        });

        newtask.save(function(err) {
          console.log("Save " + newtask.file + " successfully!");
        });

        Task.findOne({
          next_task: null
        }).exec(function(err, last_task) {
          last_task.next_task = newtask._id;
          last_task.save();
        });

        Task.findOne({
          file: request.params.filename
        }).exec(function(err, task) {
          console.log('Return: ' + task);
          response.send(task);
        });

      }
    });
  })
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
      console.log(deleted_task + '\nIs deleted.');
      response.send("Now delete the file " + request.params.filename + "\n" + deleted_task);
    });
  });

app.get('/list', function(request, response) {
  Task.find({state:{$ne: "SUPERNODE"}}).exec(function(err, tasks) {
    response.send(tasks);
    console.log(tasks);
  });

});

app.get('/done', function(request, response) {
  Task.find({state: "done"}).exec(function(err, done_list) {
    console.log(done_list);
    response.send(done_list);
  });
});

//================================Here is testing field================================

app.get('/add/:filename', function(request, response) {
  Task.find({
    state: "running"
  }, function(err, running_task) {

    if (running_task.length == 0) {

      var newtask = new Task({
        file: request.params.filename,
        state: "running",
        created_time: new Date().getTime()
      });

      newtask.save(function(err) {
        console.log("Save " + newtask.file + " successfully!");
      });

      Task.findOne({
        next_task: null
      }).exec(function(err, last_task) {
        last_task.next_task = newtask._id;
        last_task.save();
      });

      Task.findOne({
        file: request.params.filename
      }, function(err, task) {
        console.log('\nReturn: ' + task);
        response.send(task);
        response.end();
 	//runHadoop(task);
        //response.end();
        runHadoop(task.file);
      });

    } else {

      var newtask = new Task({
        file: request.params.filename,
        state: "waiting",
        created_time: new Date().getTime()
      });

      newtask.save(function(err) {
        console.log("Save " + newtask.file + " successfully!");
      });

      Task.findOne({
        next_task: null
      }).exec(function(err, last_task) {
        last_task.next_task = newtask._id;
        last_task.save();
      });

      Task.findOne({
        file: request.params.filename
      }).exec(function(err, task) {
        console.log('Return: ' + task);
        response.send(task);
      });

    }
  });
});

app.get('/remove/:filename', function(request, response) {
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
    console.log(deleted_task + '\nIs deleted.');
    response.send("Now delete the file " + request.params.filename + "\n" + deleted_task);
  });
});

app.get('/delete_all', function(request, response) {
  Task.find({state:{$ne: "SUPERNODE"}}).remove().exec();
  Task.findOne({state:"SUPERNODE"}, function(err, supernode){
    supernode.next_task = null;
    supernode.save();
  });
  response.send("Delete all!");
});

app.listen(8080);

