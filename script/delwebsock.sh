#!/bin/bash
port=$1
pid=$( lsof -i | grep websockif | grep ${port} | awk '{print $2}' | uniq )

for i in ${pid} 
do 
	kill -9 ${i}
done
