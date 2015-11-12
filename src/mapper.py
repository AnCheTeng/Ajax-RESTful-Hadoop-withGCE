#!/usr/bin/env python
import sys

for line in sys.stdin:
    
    start = line.find('[');
    end = line.find('-0800]');

    visit_time = line[start+1:end-6] + '00:00';

    print '%s\t%s' % (visit_time, 1)
