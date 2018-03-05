var mysql = require('mysql');
var exec = require('child_process').exec;
var async = require('async');
var fs = require('fs');

/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
    dateStrings:true
};

exports.system_control = function(callback){
  var proj = {};
  var connection = mysql.createConnection(db_option);
  var query ="SELECT project,option FROM system_control";
  connection.query(query, function(err, result){
    async.forEach(result, function(obj, callback){
      switch(obj.project) {
        case "version":
          proj.version   = obj.option;
          break;
        case "login":
          proj.login     = obj.option;
          break;
        case "register":
          proj.register  = obj.option;
          break;
        case "max_ram":
          proj.max_ram   = obj.option;
          break;
        case "max_disk":
          proj.max_disk  = obj.option;
          break;
        case "idle_time":
          proj.idle_time = obj.option;
          break;
        case "usb":
          proj.usb       = obj.option;
          break;
      }
      callback();
    }, function(err) {
      if(err){
        connection.end();
        callback(err);
      } else {
        connection.end();
        callback(proj);
      }
    });
  });
};

exports.system_setting = function(login, register, ram, disk, time, usb, callback){
  var connection = mysql.createConnection(db_option);
  var query =`UPDATE system_control SET option = CASE project 
                WHEN 'login' THEN ? 
                WHEN 'register' THEN ? 
                WHEN 'max_ram' THEN ? 
                WHEN 'max_disk' THEN ? 
                WHEN 'idle_time' THEN ? 
                WHEN 'usb' THEN ? END WHERE project IN ('login','register','max_ram','max_disk','idle_time','usb')`;
  connection.query(query,[login, register, ram, disk, time, usb], function(err){
    if (time == "0"){
      exec('sudo bash -c "echo \'#*/5 * * * * root /srv/cloudoffice/script/idle_time.sh '+time+' &> /dev/null\' > /etc/cron.d/idle_time"');
      connection.end();
      callback();
    } else {
      exec('sudo bash -c "echo \'*/5 * * * * root /srv/cloudoffice/script/idle_time.sh '+time+' &> /dev/null\' > /etc/cron.d/idle_time"');
      connection.end();
      callback();
    }
  });
};

exports.department_control = function(callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT ori_xml.oid,hd_name,name,hd_status,disable,back_status FROM empdata,user_xml,ori_xml LEFT JOIN back_img ON back_status = 1 AND back_img.oid=ori_xml.oid WHERE ori_xml.eid = empdata.eid GROUP BY ori_xml.oid ORDER BY ori_xml.oid";
  connection.query(query, function(err,result){
    connection.end();
    callback(result);
  });
};

exports.department_control_submit = function(oid, callback){
  var connection = mysql.createConnection(db_option);
  if (!oid) {
    var query ="UPDATE ori_xml SET disable = 0";
    connection.query(query,[oid], function(err){
      connection.end();
      callback();
    });
  } else {
    var query ="UPDATE ori_xml SET disable = 1 WHERE oid IN (?)";
    connection.query(query,[oid], function(err){
      var query ="UPDATE ori_xml SET disable = 0 WHERE oid NOT IN (?)";
      connection.query(query,[oid], function(err){
        connection.end();
        callback();
      });
    });
  }
};

