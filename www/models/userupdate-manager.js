var moment = require('moment');
var crypto = require('crypto');
var mysql = require('mysql');
var uuId = require('node-uuid');
var randomMac = require('random-mac');
/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
};

exports.showUsers = function(callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,password,name,sex,email,CASE level WHEN 0 THEN '管理員' WHEN 1 THEN '主管' ELSE '員工' END 'lv' FROM empdata WHERE verify = 1 ORDER BY level";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
};

exports.showuser = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,password,name,sex,email,level FROM empdata WHERE eid = ?";
  connection.query(query,[id], function(err, result){
    if(result.length==0){
      connection.end();
      callback('err');
    } else {
      connection.end();
      callback(result);
    }
  });
};
