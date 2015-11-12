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
