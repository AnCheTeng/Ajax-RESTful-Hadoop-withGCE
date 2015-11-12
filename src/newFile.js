var exec = require('child_process').exec;

function runHadoop(hadooptask) {
  var analyzed_filename = hadooptask;
  console.log("Let's start!");
  console.log("Move file to hdfs");
  exec("hdfs dfs -copyFromLocal " + analyzed_filename + " CCTslog/log_file", function() {
    console.log("Remove old output directory");
    exec("hdfs dfs -rm -r -f CCTslog_outdir", function() {
      console.log("Run bash log_analysis.sh");
      exec("bash log_analysis.sh", function() {
        exec("hdfs dfs -text CCTslog_outdir/part-00000", function(error, stdout, stderr) {
          console.log("Analysis of " + analyzed_filename + " is finished!");
          // hadooptask.result = stdout;
          // hadooptask.save();
          // Task.findOne({
          //   _id: hadooptask.next_task
          // }, function(err, nextTask) {
          //   hadooptask.state = "done";
          //   if (nextTask != null) {
          //     nextTask.state = "running";
          //     hadooptask.save();
          //     nextTask.save();
          //     runHadoop(nextTask);
          //   } else {
          //     hadooptask.save();
          //   }
          // });
        });
      });
    });
  });
}
runHadoop("a");
