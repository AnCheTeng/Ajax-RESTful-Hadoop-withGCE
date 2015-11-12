var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Task = new Schema({
  task_id: String,
  file: String,
  state: String,
  next_task: Schema.Types.ObjectId,
  created_time: String,
  start_time: String,
  end_time: String,
  process_time: String,
  result: String
}, {
    versionKey: false
});

module.exports = mongoose.model('Task', Task);

