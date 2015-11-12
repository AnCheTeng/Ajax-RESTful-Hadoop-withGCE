var sys = require('sys')
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var test = 0;
function puts(error, stdout, stderr) {
  //console.log('stdout: ' + stdout);
  //console.log('stderr: ' + stderr);
  if (error !== null) {
      console.log('exec error: ' + error);
  }
  test = stdout;
  console.log(test);
}
//exec("ls -la", puts);
spawn("ls -la", puts);
console.log(test);
console.log("hi");
