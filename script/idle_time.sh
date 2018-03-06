#!/bin/bash
dbuser="nodejs"
dbpass="cloudoffice#nodejs"
dbname="nodejs"
now_epoch=$( date +%s )
declare -a accounts=$( virsh list |awk 'NR>2{print $2}' |cut -d '_' -f 2 |tr -s '\n' )
for account in ${accounts[@]}
do
	ori_result=$( echo "SELECT CONCAT_WS(',',user_xml.user_port,ori_xml.last_date,empdata.eid,user_xml.user_ip,ori_xml.oid) FROM empdata,user_xml,ori_xml WHERE empdata.eid=user_xml.eid AND empdata.eid=ori_xml.eid AND ori_xml.hd_status=1 AND empdata.account='${account}'" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname} )
	if [ ! -z "${ori_result}" ]; then
		port=$( echo ${ori_result} |awk -F ',' '{print $1}' )
	  	last_date=$( echo ${ori_result} |awk -F ',' '{print $2}' )
	  	eid=$( echo ${ori_result} |awk -F ',' '{print $3}' )
	  	ip=$( echo ${ori_result} |awk -F ',' '{print $4}' )
	  	oid=$( echo ${ori_result} |awk -F ',' '{print $5}' )
		noconnect=$( netstat -an | grep :${port} | grep -v 'LISTEN' | awk '{print $NF}' | uniq )
		limit_epoch=$(( $( date -d "${last_date}" +%s ) + $(( 1*60*60 )) ))
		if [ -z ${noconnect} ]; then
                	if [ "${last_date}" != "0000-00-00 00:00:00" ]; then
				if [ "${limit_epoch}" -lt "${now_epoch}" ]; then
					sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport ${port} -j ACCEPT
					sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-1000 )) -j ACCEPT
					sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-2000 )) -j ACCEPT
					sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-3000 )) -j ACCEPT
					sudo iptables -D INPUT -p tcp -m tcp --dport $(( ${port}-4000 )) -j ACCEPT
					sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-1000 ))
					sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-2000 ))
					sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-4000 ))
					echo "UPDATE ori_xml SET hd_status = 0,last_date = 0 WHERE oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
					echo "UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ${eid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
					sudo virsh destroy vm_${account}
				fi
			else
				echo "UPDATE ori_xml SET last_date = NOW() WHERE oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
			fi
		else
			echo "UPDATE ori_xml SET last_date = 0 WHERE oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
		fi
	fi

	back_result=$( echo "SELECT CONCAT_WS(',',user_xml.user_port,back_img.last_date,empdata.eid,user_xml.user_ip,back_img.oid) FROM empdata,user_xml,back_img WHERE empdata.eid=user_xml.eid AND empdata.eid=back_img.eid AND back_img.back_status=1 AND empdata.account='${account}'" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname} )
	if [ ! -z "${back_result}" ]; then
                port=$( echo ${back_result} |awk -F ',' '{print $1}' )
                last_date=$( echo ${back_result} |awk -F ',' '{print $2}' )
                eid=$( echo ${back_result} |awk -F ',' '{print $3}' )
                ip=$( echo ${back_result} |awk -F ',' '{print $4}' )
                oid=$( echo ${back_result} |awk -F ',' '{print $5}' )
                noconnect=$( netstat -an | grep :${port} | grep -v 'LISTEN' | awk '{print $NF}' | uniq )
                limit_epoch=$(( $( date -d "${last_date}" +%s ) + $(( 1*60*60 )) ))
                if [ -z ${noconnect} ]; then
                        if [ "${last_date}" != "0000-00-00 00:00:00" ]; then
                                if [ "${limit_epoch}" -lt "${now_epoch}" ]; then
                                        sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport ${port} -j ACCEPT
                                        sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-1000 )) -j ACCEPT
                                        sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-2000 )) -j ACCEPT
                                        sudo iptables -D INPUT -p tcp -m tcp -s ${ip}/32 --dport $(( ${port}-3000 )) -j ACCEPT
                                        sudo iptables -D INPUT -p tcp -m tcp --dport $(( ${port}-4000 )) -j ACCEPT
                                        sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-1000 ))
                                        sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-2000 ))
                                        sudo sh /srv/cloudoffice/script/delwebsock.sh $(( ${port}-4000 ))
                                        echo "UPDATE back_img SET back_status = 0,last_date = 0 WHERE eid = ${eid} AND oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
                                        echo "UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ${eid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
                                        sudo virsh destroy vm_${account}
                                fi
                        else
                                echo "UPDATE back_img SET last_date = NOW() WHERE eid = ${eid} AND oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
                        fi
                else
                        echo "UPDATE back_img SET last_date = 0 WHERE eid = ${eid} AND oid = ${oid}" | mysql -Ns -u${dbuser} -p${dbpass} ${dbname}
                fi
        fi
done
