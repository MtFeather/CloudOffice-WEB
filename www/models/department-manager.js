var fs = require('fs');
var exec = require('child_process').exec;
var mysql = require('mysql');
var sleep = require('thread-sleep');
var async = require('async');
/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    dateStrings:true,
    database: 'nodejs'
};

exports.departments_maneger = function(level, id, callback){
  var connection = mysql.createConnection(db_option);
  if(level==0){
    var query ="SELECT ori_xml.oid,hd_name,hd_path,hd_size,hd_cpu,hd_ram,restore,empdata.eid,name,hd_status,disable,user_xml.user_port,back_status FROM empdata,user_xml,ori_xml LEFT JOIN back_img ON back_status = 1 AND back_img.oid=ori_xml.oid WHERE ori_xml.eid = empdata.eid AND user_xml.eid = ori_xml.eid GROUP BY ori_xml.oid ORDER BY ori_xml.oid";
    connection.query(query, function(err, result){
      connection.end();
      callback(result);
    });
  } else {
    var query ="SELECT ori_xml.oid,hd_name,hd_path,hd_size,hd_cpu,hd_ram,restore,empdata.eid,name,hd_status,disable,user_xml.user_port,back_status FROM empdata,user_xml,ori_xml LEFT JOIN back_img ON back_status = 1 AND back_img.oid=ori_xml.oid WHERE ori_xml.eid = empdata.eid AND user_xml.eid = ori_xml.eid AND ori_xml.eid = ? AND hd_status <2 GROUP BY ori_xml.oid ORDER BY ori_xml.oid";
    connection.query(query,[id], function(err, result){
      connection.end();
      callback(result);
    });
  }
};

exports.dep_vmstatus = function(callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_xml.oid,ori_xml.eid,account,user_port,user_ip FROM empdata,ori_xml,user_xml WHERE ori_xml.eid=user_xml.eid AND empdata.eid=ori_xml.eid AND hd_status = 1";
  connection.query(query, function(err, vmstatus){
    async.eachSeries(vmstatus, function (vm, callback) {
      exec('sudo virsh list | grep vm_'+vm.account, function (error, stdout, stderr) {
        if(!stdout){
          exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+vm.user_port+' -j ACCEPT',function (error, stdout, stderr){
            exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-1000)+' -j ACCEPT',function (error, stdout, stderr){
              exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-2000)+' -j ACCEPT',function (error, stdout, stderr){
                exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-3000)+' -j ACCEPT',function (error, stdout, stderr){
                  exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(vm.user_port-4000)+' -j ACCEPT',function (error, stdout, stderr){
                    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-1000), function (error, pid, stderr){
                      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-2000), function (error, vncpid, stderr){
                        exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-4000), function (error, boardpid, stderr){
                          var query ="UPDATE ori_xml SET hd_status = 0, last_date = 0 WHERE eid = ? AND oid = ?";
                          connection.query(query,[vm.eid,vm.oid], function(err){
                            var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                            connection.query(query,[vm.eid], function(err){
                              callback();
                            });
                          });
                        });
                      });
                    });
                  });
               });
             });
           });
         });
       } else {
         callback();
       }
     });
    }, function (err) {
      connection.end();
      callback();
    });
  });
};

exports.departments_setting = function(oid, hdname, cpu, ram, owner, reduction, callback){
  console.log(oid, hdname, cpu, ram, owner, reduction);
  var connection = mysql.createConnection(db_option);
  var query ="UPDATE ori_xml SET hd_name = ?, eid = ?, hd_cpu = ?, hd_ram = ?, restore = ? WHERE oid = ?";
  connection.query(query,[hdname,owner,cpu,ram,reduction,oid], function(err){
    connection.end();
    callback(err);
  });
};

exports.departments_start = function(oid, ip, callback){
  var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  var query ="SELECT option FROM system_control WHERE project = 'usb'";
  connection.query(query, function(err, usb){
    var query ="SELECT hd_path,hd_cpu,hd_ram,restore,back_img.eid,account,user_uuid,user_mac1,restore FROM ori_xml,back_img,empdata,user_xml WHERE user_xml.eid=back_img.eid AND back_img.eid=empdata.eid AND ori_xml.oid=back_img.oid AND ori_xml.oid = ? AND  back_img.eid NOT IN (SELECT eid FROM back_img WHERE back_status = 1)";
    connection.query(query,[oid], function(err, result){
      if(result.length==0){
        connection.end();
        callback(err);
      } else {
        async.eachSeries(result, function (vm, callback) {
          selectport(function(port){
            fs.readFile('/vm_data/xml/public.xml', "utf-8", function(err, data){
                var newdata = data.replace('$name', 'vm_'+vm.account);
                newdata = newdata.replace('$uuid', vm.user_uuid);
                newdata = newdata.replace('$ram', vm.hd_ram*1048576);
                newdata = newdata.replace('$cpu', vm.hd_cpu);
                newdata = newdata.replace('$boot', "<boot dev='hd'/>\n<boot dev='cdrom'/>");
                newdata = newdata.replace('$cdrom', '');
                cdrom = 0;
                newdata = newdata.replace('$path', 'backing/'+vm.hd_path+'_'+vm.account);
                newdata = newdata.replace('$mac', vm.user_mac1);
                newdata = newdata.replace('$port', port);
                newdata = newdata.replace('$vncport', port-3000);
                if(usb[0].option == 'yes') {
                  newdata = newdata.replace('$usb',`
                    <disk type=\'file\' device=\'disk\'>
                      <driver name=\'qemu\' type=\'qcow2\' cache=\'writeback\'/>
                      <source file=\'/vm_data/usb/`+vm.account+`.img\'/>
                      <target dev=\'sda\' bus=\'ide\'/>
                    </disk>`);
                } else {
                  newdata = newdata.replace('$usb', '');
                }
                fs.writeFile('/vm_data/xml/backing/vm_'+vm.account+'.xml', newdata,{'flags': 'w+'}, function(err){
                  exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+port+' -j ACCEPT' , function () {
                    exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-1000)+' -j ACCEPT' , function () {
                      exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-2000)+' -j ACCEPT' , function () {
                        exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-3000)+' -j ACCEPT' , function () {
                          if(vm.restore==1){
                            exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+vm.hd_path+'.img /vm_data/images/backing/'+vm.hd_path+'_'+vm[i].account+'.img', function (error,stdout, stderr) {
                              exec('sudo virsh create /vm_data/xml/backing/vm_'+vm.account+'.xml',function (error, stdout, stderr){
                                exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                                exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                                var query ="UPDATE back_img SET back_status = 1,last_date = 0 WHERE oid = ? AND eid = ?";
                                connection.query(query,[oid,vm.eid],function(err){
                                  var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                                  connection.query(query,[oid, port, ip, cdrom, vm.eid],function(err){
                                    sleep(500);
                                    callback();
                                  });
                                });
                              });
                            });
                          } else {
                            exec('sudo virsh create /vm_data/xml/backing/vm_'+vm.account+'.xml',function (error, stdout, stderr){
                              exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                              exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                              var query ="UPDATE back_img SET back_status = 1,last_date = 0 WHERE oid = ? AND eid = ?";
                              connection.query(query,[oid,vm.eid],function(err){
                                var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                                connection.query(query,[oid, port, ip, cdrom, vm.eid],function(err){
                                  sleep(500);
                                  callback();
                                });
                              });
                            });
                          }
                        });
                      });
                    });
                  });
                });
              });
            });
        }, function (err) {
          connection.end();
          callback();
        });
      }
    });
  });
};

exports.departments_close = function(oid, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT back_img.eid,account,user_port,user_ip FROM back_img,user_xml,empdata WHERE back_img.eid=empdata.eid AND back_img.eid=user_xml.eid AND back_status=1 AND back_img.oid=?";
  connection.query(query,[oid], function(err, result){
    if(result.length==0){
      connection.end();
      callback(err);
    } else {
      async.eachSeries(result, function (vm, callback) {
        exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+vm.user_port+' -j ACCEPT',function (error, stdout, stderr){
          exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-1000)+' -j ACCEPT',function (error, stdout, stderr){
            exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-2000)+' -j ACCEPT',function (error, stdout, stderr){
              exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-3000)+' -j ACCEPT',function (error, stdout, stderr){
                exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(vm.user_port-4000)+' -j ACCEPT',function (error, stdout, stderr){
                  exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-1000), function (error, pid, stderr){
                    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-2000), function (error, vncpid, stderr){
                      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-4000), function (error, boardpid, stderr){
                        var query ="UPDATE back_img SET back_status = 0,last_date = 0 WHERE eid = ? AND oid = ?";
                        connection.query(query,[vm.eid,oid], function(err){
                          var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                          connection.query(query,[vm.eid], function(err){
                            exec('sudo virsh destroy vm_'+vm.account,function (error, stdout, stderr){
                              callback();
                            }); 
                          }); 
                        }); 
                      }); 
                    }); 
                  }); 
                });
              });
            });
          });
        });
      }, function (err) {
        connection.end();
        callback();
      });
    }
  });
};

exports.departments_delete = function(oid,callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT hd_path FROM ori_xml WHERE oid = ?";
  connection.query(query,[oid], function(err, result){
    exec('sudo rm -rf /vm_data/images/backing/'+result[0].hd_path+'*', function (error, stdout, stderr) {
      exec('sudo rm -rf /vm_data/images/original/'+result[0].hd_path+'*', function (error, stdout, stderr) {
        var query ="DELETE FROM back_img WHERE oid = ?";
        connection.query(query,[oid], function(err){
          var query ="DELETE FROM ori_xml WHERE oid = ?";
          connection.query(query,[oid], function(err){
            connection.end();
            callback(err);
          });
        });
      });
    });
  });
};

exports.departments_sync = function(oid)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account,hd_path FROM ori_xml,back_img,empdata WHERE ori_xml.oid=back_img.oid AND empdata.eid=back_img.eid AND ori_xml.oid = ?";
  connection.query(query,[oid], function(err, result){
    if (result[0] == undefined){
      var query ="UPDATE ori_xml SET hd_status = 3 WHERE oid = ?";
      connection.query(query,[oid], function(err){
        var query ="SELECT hd_path FROM ori_xml where oid = ?";
        connection.query(query,[oid], function(err, result){
          exec('sudo qemu-img commit /vm_data/images/original/'+result[0].hd_path+'_1.img', function(error, stdout, stderr){
            var query ="UPDATE ori_xml SET hd_status = 0 WHERE oid = ?";
            connection.query(query,[oid], function(err){
              connection.end();
            });
          });
        });
      });
    } else {
      var query ="UPDATE ori_xml SET hd_status = 3 WHERE oid = ?";
      connection.query(query,[oid], function(err){
        exec('sudo qemu-img commit /vm_data/images/original/'+result[0].hd_path+'_1.img', function(error, stdout, stderr){
          for(var i = 0;i < result.length; i++){
            (function(i) {
              exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+result[i].hd_path+'.img /vm_data/images/backing/'+result[i].hd_path+'_'+result[i].account+'.img', function () {
                if(i == result.length-1){
                  var query ="UPDATE ori_xml SET hd_status = 0 WHERE oid = ?";
                  connection.query(query,[oid], function(err){
                    connection.end();
                  });
                }
              });
            })(i);
          }
        });
      });
    }
  });
}
exports.departments_info = function(level, id, callback){
  var connection = mysql.createConnection(db_option);
  if(level==0){
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,ori_xml.hd_path,empdata.name,ori_xml.hd_size,ori_xml.hd_cpu,ori_xml.hd_ram,CASE ori_xml.restore WHEN 0 THEN '無' WHEN 1 THEN '有' END 'restore',ori_xml.hd_status,disable,ori_xml.create_date,ori_xml.last_date FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid";
    connection.query(query, function(err, result){
      connection.end();
      callback(result);
    });
  } else {
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,ori_xml.hd_path,empdata.name,ori_xml.hd_size,ori_xml.hd_cpu,ori_xml.hd_ram,CASE ori_xml.restore WHEN 0 THEN '無' WHEN 1 THEN '有' END 'restore',ori_xml.hd_status,disable,ori_xml.create_date,ori_xml.last_date FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid AND ori_xml.eid = ?";
    connection.query(query,[id], function(err, result){
      connection.end();
      callback(result);
    });
  }
};

exports.hd_form = function(level, id, callback){
  var connection = mysql.createConnection(db_option);
  if(level==0){
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,empdata.name,hd_status,disable FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid";
    connection.query(query, function(err, result){
      connection.end();
      callback(result);
    });
  } else {
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,empdata.name,hd_status,disable FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid AND ori_xml.eid = ?";
    connection.query(query,[id], function(err, result){
      connection.end();
      callback(result);
    });
  }
};
exports.hd_info = function(level, id, callback){
  var connection = mysql.createConnection(db_option);
  if(level==0){
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,hd_status,disable,empdata.name FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid";
    connection.query(query, function(err, result){
      connection.end();
      callback(result);
    });
  } else {
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,hd_status,disable,empdata.name FROM ori_xml,empdata WHERE ori_xml.eid = empdata.eid AND ori_xml.eid = ? AND hd_status <2";
    connection.query(query,[id], function(err, result){
      connection.end();
      callback(result);
    });
  }
};

exports.hd_vmstatus = function(oid, callback){
  //var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  var query ="SELECT back_img.eid,account,back_img.oid,user_xml.user_port,user_xml.user_ip FROM empdata,back_img,user_xml WHERE back_img.eid=user_xml.eid AND empdata.eid=back_img.eid AND back_img.oid = ? AND back_status = 1";
  connection.query(query,[oid], function(err, vmstatus){
    async.eachSeries(vmstatus, function (vm, callback) {
      exec('sudo virsh list | grep vm_'+vm.account, function (error, stdout, stderr) {
        if(!stdout){
          exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+vm.user_port+' -j ACCEPT',function (error, stdout, stderr){
            exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-1000)+' -j ACCEPT',function (error, stdout, stderr){
              exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-2000)+' -j ACCEPT',function (error, stdout, stderr){
                exec('sudo iptables -D INPUT -s '+vm.user_ip+' -p tcp -m tcp --dport '+(vm.user_port-3000)+' -j ACCEPT',function (error, stdout, stderr){
                  exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(vm.user_port-4000)+' -j ACCEPT',function (error, stdout, stderr){
                    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-1000), function (error, pid, stderr){
                      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-2000), function (error, vncpid, stderr){
                        exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm.user_port-4000), function (error, boardpid, stderr){
                          var query ="UPDATE back_img SET back_status = 0, last_date = 0 WHERE eid = ? AND oid = ?";
                          connection.query(query,[vm.eid,oid], function(err){
                            var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                            connection.query(query,[vm.eid], function(err){
                              callback();
                            });
                          });
                        });
                      });
                    });
                  });
               });
             });
           });
         });
       } else {
         callback();
       }
     });
    }, function (err) {
      connection.end();
      callback();
    });
  });
};

exports.hd_show = function(id,callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT hd_name,eid FROM ori_xml WHERE oid = ?";
  connection.query(query,[id], function(err, hd_name){
    //if(hd_name.length==0) return callback('err');
    var query ="SELECT ori_xml.oid,ori_xml.hd_name,ori_xml.hd_path,hd_status,disable,empdata.eid,empdata.name,empdata.account,back_img.back_status,user_xml.user_port FROM empdata,ori_xml,user_xml,back_img WHERE back_img.oid = ? AND empdata.eid=back_img.eid AND back_img.oid=ori_xml.oid AND back_img.eid=user_xml.eid";
    connection.query(query,[id], function(err, result){
     /* if(result.length==0) {
        connection.end();
        callback('err');
      } else {*/
        connection.end();
        callback(hd_name[0].hd_name,hd_name[0].eid,result);
      //}
    });
  });
};

exports.hd_deletevm = function(oid, eid, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account,hd_path FROM empdata,ori_xml WHERE oid = ? AND empdata.eid = ?";
  connection.query(query,[oid,eid], function(err,vm){
    exec('sudo rm -rf /vm_data/images/backing/'+vm[0].hd_path+'_'+vm[0].account+'.img', function (error, stdout, stderr) {
      var query ="DELETE FROM back_img WHERE oid = ? AND eid = ?";
      connection.query(query,[oid,eid], function(err){
        connection.end();
        callback(err);
      });
    });
  });
};

exports.hd_reductionvm = function(oid, eid, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account,hd_path FROM empdata,ori_xml WHERE oid = ? AND empdata.eid = ?";
  connection.query(query,[oid,eid], function(err,vm){
    exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+vm[0].hd_path+'.img /vm_data/images/backing/'+vm[0].hd_path+'_'+vm[0].account+'.img', function (error, stdout, stderr) {
        connection.end();
        callback(err);
    });
  });
};

exports.hd_update = function(id, oid, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT ori_xml.oid,ori_xml.hd_name,ori_xml.eid,hd_status,disable FROM ori_xml WHERE ori_xml.oid = ?";
  connection.query(query,[id], function(err, result){
    var query ="SELECT account,name FROM back_img,empdata WHERE empdata.eid=back_img.eid AND oid = ?";
    connection.query(query,[id], function(err, member){
      if(result.length==0) {
        connection.end();
        callback('err');
      } else {
        var query ="SELECT oid,hd_name FROM ori_xml WHERE oid != ?";
        connection.query(query,[id], function(err, hd_name){
          if(oid==0){
            var query ="SELECT empdata.eid, account,name, oid FROM empdata LEFT JOIN back_img ON empdata.eid = back_img.eid AND back_img.oid = ? WHERE oid IS NULL AND empdata.verify = 1;";
            connection.query(query,[id], function(err, user_name){
              if(err) throw err;
              connection.end();
              callback(result,hd_name,user_name,member);
            });
          } else {
            var query ="SELECT empdata.eid, account,name, oid FROM empdata LEFT JOIN back_img ON empdata.eid = back_img.eid AND back_img.oid = ? WHERE oid IS NULL AND empdata.verify = 1 AND empdata.eid NOT IN (SELECT eid FROM back_img WHERE oid =?)";
            connection.query(query,[oid, id], function(err, user_name){
              connection.end();
              callback(result,hd_name,user_name,member);
            });
          }
        });
      }
    });
  });
};

exports.createBacking = function(oid, user, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT hd_path FROM ori_xml WHERE oid = ?";
  connection.query(query,[oid], function(err, path){
    for(var i = 0;i < user.length; i++){
      (function(i) {
        var query ="SELECT account FROM empdata WHERE eid = ?";
        connection.query(query,[user[i]], function(err, empdata){
          exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+path[0].hd_path+'.img /vm_data/images/backing/'+path[0].hd_path+'_'+empdata[0].account+'.img', function (error,stdout, stderr) {
            var query ="INSERT INTO back_img VALUES('',?,?,0,NOW(),0)";
            connection.query(query,[user[i],oid], function(err){
              if(i == user.length-1){
                connection.end();
                callback(err);
              }
            });
          });
        });
      })(i);
    };
  });
};

var randomport = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var selectport = function(callback) {
  var port = randomport(59000, 59999);
  loop();
  function loop(){
    exec('sudo iptables-save | grep '+port , function (error, stdout, stderr) {
      if(stdout){
        port = randomport(59000, 59999);
        loop();
      } else {
        callback(port);
      }
    });
  }
};
