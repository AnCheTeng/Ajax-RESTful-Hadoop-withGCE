hadoop \
    jar /home/hadoopuser/hadoop/share/hadoop/tools/lib/hadoop-streaming-2.6.0.jar \
    -mapper "python $PWD/mapper.py" \
    -reducer "python $PWD/reducer.py" \
    -input "CCTslog/log_file" \
    -output "CCTslog_outdir"
