var exec = require('sync-exec');
//varCTslog_outdir
//console.log(test.stdout);
console.log("Let's start!");
console.log("Move file to hdfs");
exec("hdfs dfs -copyFromLocal log_file CCTslog/log_file");
console.log("Remove old output directory");
exec("hdfs dfs -rm -r -f CCTslog_outdir");
console.log("Run bash log_analysis.sh");
exec("bash log_analysis.sh");
console.log("Show result");
var result = exec("hdfs dfs -text CCTslog_outdir/part-00000");
console.log(result.stdout);


function runHadoop(hadooptask) {
  var analyzed_filename = hadooptask.file;
  console.log("Let's start!");
  console.log("Move file to hdfs");
  exec("hdfs dfs -copyFromLocal " + analyzed_filename + " CCTslog/log_file");
  console.log("Remove old output directory");
  exec("hdfs dfs -rm -r -f CCTslog_outdir");
  console.log("Run bash log_analysis.sh");
  exec("bash log_analysis.sh");
  var hadoop_result = exec("hdfs dfs -text CCTslog_outdir/part-00000");
  console.log("Analysis of " + analyzed_filename + " is finished!");
  hadooptask.result = hadoop_result.stdout;
  hadooptask.save();
  Task.findOne({
    _id: hadooptask.next_task
  }, function(err, nextTask) {
    hadooptask.state = "done";
    if (nextTask != null) {
      nextTask.state = "running";
      hadooptask.save();
      nextTask.save();
      runHadoop(nextTask);
    } else {
      hadooptask.save();
    }
  });
}


var exec = require('child_process').exec;

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
