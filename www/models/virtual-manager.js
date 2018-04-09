var fs = require('fs');
var exec = require('child_process').exec;
var crypto = require('crypto');
var uuId = require('node-uuid');
var randomMac = require('random-mac');
var mysql = require('mysql');
/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
};

exports.defaultVm = function(callback) {
  var ram,disk;
  var connection = mysql.createConnection(db_option);
  var query ="SELECT option FROM system_control WHERE project = 'max_ram'";
  connection.query(query, function(err, ram){
    var query ="SELECT option FROM system_control WHERE project = 'max_disk'";
    connection.query(query, function(err, disk){
      connection.end();
      callback(ram[0].option,disk[0].option);
    });
  });
}

exports.checkUser = function(callback) {
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,name,CASE level WHEN 0 THEN '管理員' WHEN 1 THEN '主管' ELSE '員工' END 'lv' FROM empdata WHERE level < 2 ORDER BY level";
  connection.query(query, function(err, result){ 
    connection.end();
    callback(result);
  });
};

exports.checkDepartment = function(callback) {
  var connection = mysql.createConnection(db_option);
  var query ="SELECT oid,hd_name FROM ori_xml";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
};

exports.checkImage = function(id, callback) {
  var connection = mysql.createConnection(db_option);
  var query ="SELECT oid,hd_name,hd_path,hd_status,disable FROM ori_xml WHERE eid = ? AND hd_status < 2 AND disable = 0";
  connection.query(query,[id], function(err, original){
    var query ="SELECT ori_xml.oid,hd_name,hd_path,hd_status,disable FROM back_img,ori_xml WHERE back_img.oid=ori_xml.oid AND back_img.eid = ? AND hd_status < 2 AND disable = 0";
    connection.query(query,[id], function(err, backing){
      connection.end();
      callback(original, backing);
    });
  });
};

exports.checkCdrom = function(callback) {
  fs.readdir("/vm_data/iso",function(err, files){
    callback(files);
  });
};

exports.checkIp = function(id, ip, callback) {
  var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_ip,user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[id], function(err, result){
    if(ip == result[0].user_ip){
      connection.end();
      callback();
    } else {
      exec('sudo iptables -D INPUT -p tcp -m tcp -s '+result[0].user_ip+'/32 --dport '+result[0].user_port+' -j ACCEPT', function (error,stdout, stderr) {
        exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+result[0].user_port+' -j ACCEPT', function (error,stdout, stderr) {
          var query ="UPDATE user_xml SET user_ip = ? WHERE eid = ?";
          connection.query(query,[ip,id], function(err){
            connection.end();
            callback();
          });
        });
      });
    }
  });
};

exports.usingCdrom = function(id, callback) {
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_cdrom FROM user_xml WHERE eid = ?";
  connection.query(query,[id], function(err, result){
    connection.end();
    callback(result[0].user_cdrom);
  });
};

exports.addNewOriginal = function(newData, callback) {
  validateImagepath(function(rows){
    var hdname = rows;
    var hdpath = rows;
    var connection = mysql.createConnection(db_option);
    var query ="INSERT INTO ori_xml VALUES('',?,?,?,?,?,?,?,'0','0',NOW(),0)";
    connection.query(query,[newData.hdname,hdpath,newData.owner,newData.hdsize,newData.cpu,newData.ram,newData.reduction], function(err, result){
        exec('sudo qemu-img create -f qcow2 -o cluster_size=2M,preallocation=metadata,lazy_refcounts=on /vm_data/images/original/'+hdpath+'.img '+newData.hdsize+'G', function (error, stdout, stderr) {
          if (error) {
            connection.end();
            callback('error');
          } else {
            exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+hdpath+'.img /vm_data/images/original/'+hdpath+'_1.img', function (error, stdout, stderr) {
              if(error){
                connection.end();
                callback('error');
              } else {
                connection.end();
                callback(err);
              } 
            });
          }
        });
    });
  });
};

exports.copyOriginal = function(data, callback) {
  var connection = mysql.createConnection(db_option);
  var query ="SELECT hd_path,hd_size,hd_cpu,hd_ram FROM ori_xml WHERE oid = ?";
  connection.query(query,[data.dep], function(err, result){
    validateImagepath(function(path){
      var query ="INSERT INTO ori_xml VALUES('',?,?,?,?,?,?,?,'2','0',NOW(),'')";
      connection.query(query,[data.hdname,path,data.owner,result[0].hd_size,result[0].hd_cpu,result[0].hd_ram,data.reduction], function(err){
        exec('sudo rsync -a --bwlimit=204800 /vm_data/images/original/'+result[0].hd_path+'.img /vm_data/images/original/'+path+'.img', function (error, stdout, stderr) {
          if(error){
            connection.end();
            callback(error);
          } else {
            exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+path+'.img /vm_data/images/original/'+path+'_1.img', function (error, stdout, stderr) {
              if(error){
                connection.end();
                callback(error);
              } else {
                var query ="UPDATE ori_xml SET hd_status = 0 WHERE hd_path = ?";
                connection.query(query,[path], function(err){
                  connection.end();
                  callback(err);
                });
              }
            });
          }
        });
      });
    });
  });
};

exports.checkVMstatus = function(id, ip, callback){
  var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  var query ="SELECT empdata.account,user_xml.user_ip,user_xml.user_port FROM user_xml,empdata WHERE empdata.eid=user_xml.eid AND user_xml.eid = ?";
  connection.query(query,[id], function(err, result){
    exec('sudo virsh list | grep -w vm_'+result[0].account, function (error, stdout, stderr) {
      if(!stdout){
         var query ="UPDATE ori_xml SET hd_status = 0, last_date = 0 WHERE eid = ? AND hd_status = 1";
         connection.query(query,[id], function(err){
           var query ="UPDATE back_img SET back_status = 0, last_date = 0 WHERE eid = ? AND back_status = 1";
           connection.query(query,[id], function(err){
             exec('sudo iptables -D INPUT -p tcp -m tcp -s '+result[0].user_ip+'/32 --dport '+result[0].user_port+' -j ACCEPT', function (error,stdout, stderr) {
               exec('sudo iptables -D INPUT -p tcp -m tcp -s '+result[0].user_ip+'/32 --dport '+(result[0].user_port-1000)+' -j ACCEPT', function (error,stdout, stderr) {
                 exec('sudo iptables -D INPUT -p tcp -m tcp -s '+result[0].user_ip+'/32 --dport '+(result[0].user_port-2000)+' -j ACCEPT', function (error,stdout, stderr) {
                   exec('sudo iptables -D INPUT -p tcp -m tcp -s '+result[0].user_ip+'/32 --dport '+(result[0].user_port-3000)+' -j ACCEPT', function (error,stdout, stderr) {
                     exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(result[0].user_port-4000)+' -j ACCEPT', function (error,stdout, stderr) {
                       exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(result[0].user_port-1000), function (error, pid, stderr){
                         exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(result[0].user_port-2000), function (error, vncpid, stderr){
                           exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(result[0].user_port-4000), function (error, boardpid, stderr){
                             var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                             connection.query(query,[id], function(err){
                               connection.end();
                               callback(0,0);
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
      } else {
        var query ="SELECT hd_status FROM ori_xml WHERE eid = ? AND hd_status = 1";
        connection.query(query,[id], function(err, hd_status){
          var query ="SELECT back_status FROM back_img WHERE eid = ? AND back_status = 1";
           connection.query(query,[id], function(err, back_status){ 
            connection.end();
            callback(hd_status[0] == undefined ? 0 : hd_status[0].hd_status,back_status[0] == undefined ? 0 : back_status[0].back_status);
          });
        });
      }
    });
  });
};

exports.vmStatus = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT option FROM system_control WHERE project = 'usb'";
  connection.query(query, function(err, usb){
    var query ="SELECT hd_name,hd_status,eid FROM ori_xml WHERE eid = ? AND hd_status = 1";
    connection.query(query,[id], function(err, stat){
      if(stat[0] != undefined){
        stat[0].hd_name = '(原始碟)'+stat[0].hd_name;
        var query ="SELECT user_port,broadcast FROM user_xml WHERE eid = ?";
        connection.query(query,[id], function(err, port){
          connection.end();
          callback(stat[0].hd_name,port[0].user_port,stat[0].eid,port[0].broadcast,usb[0].option);
        });
      } else {
        var query ="SELECT hd_name,ori_xml.eid FROM ori_xml,back_img WHERE back_img.oid=ori_xml.oid AND back_img.eid = ? AND back_status = 1";
        connection.query(query,[id], function(err, stat){
          var query ="SELECT user_port,broadcast FROM user_xml WHERE eid = ?";
          connection.query(query,[id], function(err, port){
            connection.end();
            callback(stat[0].hd_name,port[0].user_port,stat[0].eid,port[0].broadcast,usb[0].option);
          });
        });
      }
    });
  });
};

exports.openVm = function(id, path, boot, cdrom, ip, callback) {
  var str = path.substring(0, 2);
  var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  if(str != 'vm'){
    var query ="SELECT option FROM system_control WHERE project = 'usb'";
    connection.query(query, function(err, usb){
      var query ="SELECT ori_xml.oid,empdata.eid,ori_xml.hd_path,ori_xml.hd_size,ori_xml.hd_cpu,ori_xml.hd_ram,empdata.account,user_xml.user_uuid,user_xml.user_mac1,ori_xml.restore FROM ori_xml,user_xml,empdata WHERE ori_xml.eid=empdata.eid AND user_xml.eid=empdata.eid AND empdata.eid = ? AND ori_xml.hd_path = ?";
      connection.query(query,[id,path], function(err, ori_data){ 
        selectport(function(port){
          fs.readFile('/vm_data/xml/public.xml', "utf-8", function(err, data){
            var newdata = data.replace('$name', 'vm_'+ori_data[0].account);
            newdata = newdata.replace('$uuid', ori_data[0].user_uuid);
            newdata = newdata.replace('$ram', ori_data[0].hd_ram*1048576);
            newdata = newdata.replace('$cpu', ori_data[0].hd_cpu);
            if(boot=='cdrom'){
              newdata = newdata.replace('$boot', "<boot dev='cdrom'/>\n<boot dev='hd'/>");
              newdata = newdata.replace('$cdrom', cdrom);
            } else {
              newdata = newdata.replace('$boot', "<boot dev='hd'/>\n<boot dev='cdrom'/>");
              newdata = newdata.replace('$cdrom', '');
              cdrom = 0;
            }
            newdata = newdata.replace('$path', 'original/'+ori_data[0].hd_path+'_1');
            newdata = newdata.replace('$mac', ori_data[0].user_mac1);
            newdata = newdata.replace('$port', port);
            newdata = newdata.replace('$vncport', port-3000);
            if(usb[0].option == 'yes') {
              newdata = newdata.replace('$usb',`
              <disk type=\'file\' device=\'disk\'>
                <driver name=\'qemu\' type=\'qcow2\' cache=\'writeback\'/>
                <source file=\'/vm_data/usb/`+ori_data[0].account+`.img\'/>
                <target dev=\'sda\' bus=\'ide\'/>
              </disk>`);
            } else {
              newdata = newdata.replace('$usb', '');
            }
            fs.writeFile('/vm_data/xml/original/vm_'+ori_data[0].account+'.xml', newdata,{'flags': 'w+'}, function(err){
              exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+port+' -j ACCEPT', function (error, stdout, stderr) {
                exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-1000)+' -j ACCEPT', function (error, stdout, stderr) {
                  exec('sudo iptables -AI INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-2000)+' -j ACCEPT', function (error, stdout, stderr) {
                    exec('sudo iptables -AI INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-3000)+' -j ACCEPT', function (error, stdout, stderr) {
                      if(ori_data[0].restore==1){
                        exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+ori_data[0].hd_path+'.img /vm_data/images/original/'+ori_data[0].hd_path+'_1.img', function (error,stdout, stderr) {
                          exec('sudo virsh create /vm_data/xml/original/vm_'+ori_data[0].account+'.xml',function (error, stdout, stderr){
                            exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                            exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                            var query ="UPDATE ori_xml SET hd_status = 1,last_date = 0 WHERE oid = ?";
                            connection.query(query,[ori_data[0].oid],function(err){
                              var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                              connection.query(query,[ori_data[0].oid, port, ip, cdrom, ori_data[0].eid],function(err){
                                connection.end();
                                callback();
                              });
                            });
                          });
                        });
                      } else {
                        exec('sudo virsh create /vm_data/xml/original/vm_'+ori_data[0].account+'.xml',function (error, stdout, stderr){
                          exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                          exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                          var query ="UPDATE ori_xml SET hd_status = 1,last_date = 0 WHERE oid = ?";
                          connection.query(query,[ori_data[0].oid],function(err){
                            var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                            connection.query(query,[ori_data[0].oid, port, ip, cdrom, ori_data[0].eid],function(err){
                              connection.end();
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
      });
    });
  } else {
    var path = path.substring(3);
    var query ="SELECT option FROM system_control WHERE project = 'usb'";
    connection.query(query, function(err, usb){
      var query ="SELECT oid,hd_path,hd_size,hd_cpu,hd_ram,restore FROM ori_xml WHERE hd_path = ?";
      connection.query(query,[path], function(err, ori_data){
        var query ="SELECT empdata.eid,account,user_uuid,user_mac1 FROM empdata,user_xml WHERE user_xml.eid=empdata.eid AND user_xml.eid = ?";
        connection.query(query,[id], function(err, user_data){
          selectport(function(port){
            fs.readFile('/vm_data/xml/public.xml', "utf-8", function(err, data){
              var newdata = data.replace('$name', 'vm_'+user_data[0].account);
              newdata = newdata.replace('$uuid', user_data[0].user_uuid);
              newdata = newdata.replace('$ram', ori_data[0].hd_ram*1048576);
              newdata = newdata.replace('$cpu', ori_data[0].hd_cpu);
              if(boot=='cdrom'){
                newdata = newdata.replace('$boot', "<boot dev='cdrom'/>\n<boot dev='hd'/>");
                newdata = newdata.replace('$cdrom', cdrom);
              } else {
                newdata = newdata.replace('$boot', "<boot dev='hd'/>\n<boot dev='cdrom'/>");
                newdata = newdata.replace('$cdrom', '');
                cdrom = 0;
              }
              newdata = newdata.replace('$path', 'backing/'+ori_data[0].hd_path+'_'+user_data[0].account);
              newdata = newdata.replace('$mac', user_data[0].user_mac1);
              newdata = newdata.replace('$port', port);
              newdata = newdata.replace('$vncport', port-3000);
              if(usb[0].option == 'yes') {
                newdata = newdata.replace('$usb',`
                <disk type=\'file\' device=\'disk\'>
                  <driver name=\'qemu\' type=\'qcow2\' cache=\'writeback\'/>
                  <source file=\'/vm_data/usb/`+user_data[0].account+`.img\'/>
                  <target dev=\'sda\' bus=\'ide\'/>
                </disk>`);
              } else {
                newdata = newdata.replace('$usb', '');
              }
              fs.writeFile('/vm_data/xml/backing/vm_'+user_data[0].account+'.xml', newdata,{'flags': 'w+'}, function(error, stdout, stderr){
                exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+port+' -j ACCEPT', function (error, stdout, stderr) {
                  exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-1000)+' -j ACCEPT', function (error, stdout, stderr) {
                    exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-2000)+' -j ACCEPT', function (error, stdout, stderr) {
                      exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(port-3000)+' -j ACCEPT', function (error, stdout, stderr) {
                        if(ori_data[0].restore==1){
                          exec('sudo qemu-img create -f qcow2 -b /vm_data/images/original/'+ori_data[0].hd_path+'.img /vm_data/images/backing/'+ori_data[0].hd_path+'_'+user_data[0].account+'.img', function (error,stdout, stderr) {
                            exec('sudo virsh create /vm_data/xml/backing/vm_'+user_data[0].account+'.xml', function (error, stdout, stderr){
                              exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                              exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                              var query ="UPDATE back_img SET back_status = 1,last_date = 0 WHERE oid = ? AND eid = ?";
                              connection.query(query,[ori_data[0].oid,id],function(err){
                                var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                                connection.query(query,[ori_data[0].oid, port, ip, cdrom, user_data[0].eid],function(err){
                                  connection.end();
                                  callback();
                                });
                              });
                            });
                          });
                        } else {
                          exec('sudo virsh create /vm_data/xml/backing/vm_'+user_data[0].account+'.xml', function (error, stdout, stderr){
                            exec('sudo /srv/cloudoffice/websockify/websockify.py '+(port-1000)+' localhost:'+port+' &');
                            exec('sudo websockify '+(port-2000)+' localhost:'+(port-3000)+' > /dev/null &');
                            var query ="UPDATE back_img SET back_status = 1,last_date = 0 WHERE oid = ? AND eid = ?";
                            connection.query(query,[ori_data[0].oid,id],function(err){
                              var query ="UPDATE user_xml SET oid = ?, user_port = ?, user_ip = ?, user_cdrom = ? WHERE eid = ?";
                              connection.query(query,[ori_data[0].oid, port, ip, cdrom, user_data[0].eid],function(err){
                                connection.end();
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
        });
      });   
    });
  }
};

exports.changeCdrom = function(id, cdrom, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT empdata.account FROM user_xml,empdata WHERE user_xml.eid=empdata.eid AND user_xml.eid = ?";
  connection.query(query,[id], function(err,result){
    if(cdrom == ''){
      connection.end();
      callback();
    } else if(cdrom == 0) {
      exec('sudo virsh attach-disk vm_'+result[0].account+' "" hdc --type cdrom',function (error, stdout, stderr){
        var query ="UPDATE user_xml SET user_cdrom = 0 WHERE eid = ?";
        connection.query(query,[id], function(err){
          connection.end();
          callback();
        });
      });
    } else {
      exec('sudo virsh attach-disk vm_'+result[0].account+' /vm_data/iso/'+cdrom+' hdc --type cdrom',function (error, stdout, stderr){
        var query ="UPDATE user_xml SET user_cdrom = ? WHERE eid = ?";
        connection.query(query,[cdrom,id], function(err){
          connection.end();
          callback();
        });
      });
    }
  });
};

exports.closeVm = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT hd_path FROM ori_xml WHERE hd_status = 1 AND eid = ?";
  connection.query(query,[id], function(err,result){
    if(result[0] != undefined){
      var query ="SELECT empdata.account,user_xml.user_port,user_xml.user_ip FROM empdata,user_xml WHERE user_xml.eid=empdata.eid AND user_xml.eid = ?";
      connection.query(query,[id], function(err,vm){
        exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+vm[0].user_port+' -j ACCEPT', function(){
          exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-1000)+' -j ACCEPT', function(){
            exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-2000)+' -j ACCEPT', function(){
              exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-3000)+' -j ACCEPT', function(){
                exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(vm[0].user_port-4000)+' -j ACCEPT', function(){
                  exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-1000), function (error, pid, stderr){
                    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-2000), function (error, vncpid, stderr){
                      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-4000), function (error, boardpid, stderr){
                        var query ="UPDATE ori_xml SET hd_status = 0, last_date = 0 WHERE eid = ? AND hd_status = 1";
                        connection.query(query,[id], function(err){
                          var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                          connection.query(query,[id], function(err){
                            exec('sudo virsh destroy vm_'+vm[0].account,function (error, stdout, stderr){
                              connection.end();
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
      });
    } else {
      var query ="SELECT empdata.account,user_xml.user_port,user_xml.user_ip,user_xml.oid FROM empdata,user_xml WHERE user_xml.eid=empdata.eid AND user_xml.eid = ?";
      connection.query(query,[id], function(err,vm){
        exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+vm[0].user_port+' -j ACCEPT',function (){
          exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-1000)+' -j ACCEPT',function (){
            exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-2000)+' -j ACCEPT',function (){
              exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-3000)+' -j ACCEPT',function (){
                exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(vm[0].user_port-4000)+' -j ACCEPT',function (){
                  exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-1000), function (error, pid, stderr){
                    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-2000), function (error, vncpid, stderr){
                      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(vm[0].user_port-4000), function (error, boardpid, stderr){
                        var query ="UPDATE back_img SET back_status = 0, last_date = 0 WHERE eid = ? AND oid = ?";
                        connection.query(query,[id,vm[0].oid], function(err){
                          var query ="UPDATE user_xml SET oid = 0,user_port = 0,user_ip = 0,user_cdrom = 0,broadcast = 0 WHERE eid = ?";
                          connection.query(query,[id], function(err){
                            exec('sudo virsh destroy vm_'+vm[0].account,function (error, stdout, stderr){
                              connection.end();
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
      });
    }
  });
};

exports.su_broadcast_port = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[id], function(err,result){
    var query ="SELECT back_img.eid,account,name,back_img.oid,back_img.back_status FROM empdata,user_xml,back_img WHERE empdata.eid=back_img.eid AND user_xml.oid=back_img.oid AND user_xml.eid = ? AND back_status = 1 AND back_img.eid != ?";
    connection.query(query,[id,id], function(err,users){
      connection.end();
      callback((result[0].user_port-4000),users);
    });
  });
};

exports.broadcast_change = function(eid, port, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[eid], function(err,result){
    exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+port, function (error, pid, stderr){
      exec('sudo websockify '+port+' localhost:'+(result[0].user_port-3000)+' > /dev/null &');
      connection.end();
      callback();
    });
  });
};

exports.broadcast_port = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_port FROM ori_xml,back_img,user_xml WHERE user_xml.eid=ori_xml.eid  AND back_img.oid=user_xml.oid AND back_img.oid=ori_xml.oid AND back_img.eid = ? AND back_status = 1";
  connection.query(query,[id], function(err,result){
    connection.end();
    callback(result[0] == undefined ? 0 : (result[0].user_port-4000));
  });
};

exports.broadcast_on = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[id], function(err,result){
    exec('sudo iptables -A INPUT -p tcp -m tcp --dport '+(result[0].user_port-4000)+' -j ACCEPT', function () {
      exec('sudo websockify '+(result[0].user_port-4000)+' localhost:'+(result[0].user_port-3000)+' > /dev/null &');
      var query ="UPDATE user_xml SET broadcast = 1 WHERE eid = ?";
      connection.query(query,[id], function(){
        connection.end();
        callback();
      });
    });
  });
};

exports.broadcast_off = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[id], function(err,result){
    exec('sudo iptables -D INPUT -p tcp -m tcp --dport '+(result[0].user_port-4000)+' -j ACCEPT',function (){
      exec('sudo sh /srv/cloudoffice/script/delwebsock.sh '+(result[0].user_port-4000), function (error, pid, stderr){
        var query ="UPDATE user_xml SET broadcast = 0 WHERE eid = ?";
        connection.query(query,[id], function(){
          connection.end();
          callback();
        });
      });
    });
  });
};

exports.change_ip = function(eid, ip, callback){
  var ip = ip.substring(7);
  var connection = mysql.createConnection(db_option);
  var query ="SELECT user_ip,user_port FROM user_xml WHERE eid = ?";
  connection.query(query,[eid], function(err,vm){
    exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+vm[0].user_port+' -j ACCEPT', function(){
      exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-1000)+' -j ACCEPT', function(){
        exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-2000)+' -j ACCEPT', function(){
          exec('sudo iptables -D INPUT -p tcp -m tcp -s '+vm[0].user_ip+'/32 --dport '+(vm[0].user_port-3000)+' -j ACCEPT', function(){
            exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+vm[0].user_port+' -j ACCEPT', function(){
              exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(vm[0].user_port-1000)+' -j ACCEPT', function(){
                 exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(vm[0].user_port-2000)+' -j ACCEPT', function(){
                   exec('sudo iptables -A INPUT -p tcp -m tcp -s '+ip+'/32 --dport '+(vm[0].user_port-3000)+' -j ACCEPT', function(){
                     var query ="UPDATE user_xml SET user_ip = ? WHERE eid = ?";
                     connection.query(query,[ip,eid], function(err){
                       connection.end();
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
};

/*image name random*/
var randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
}

var randomport = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var validateImagepath = function(callback) {
  hdpath = randomValueBase64(12);
  loop();
  function loop(){
    var connection = mysql.createConnection(db_option);
    var query ="SELECT hd_path FROM ori_xml WHERE hd_path = ?";
    connection.query(query,[hdpath], function(err, result){
      if(result[0] != undefined){
        hdpath = randomValueBase64(12);
        loop();
      } else {
        connection.end();
        callback(hdpath);
      }
    });
  }
};

var selectport = function(callback) {
  var port = randomport(59000, 59999);
  loop();
  function loop(){
    exec('sudo iptables-save | grep '+port , function (error, stdout, stderr) {
      console.log(stdout);
      if(stdout){
        port = randomport(59000, 59999);
        loop();
      } else {
        callback(port);
      }
    });
  }
};
