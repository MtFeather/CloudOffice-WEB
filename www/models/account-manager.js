var moment = require('moment');
var crypto = require('crypto');
var mysql = require('mysql');
var uuId = require('node-uuid');
var randomMac = require('random-mac');
var exec = require('child_process').exec;
var async = require('async');

/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
    dateStrings:true
};

exports.showusers = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,password,name,sex,email,level FROM empdata";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
};

exports.checkLogin = function(callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT option FROM system_control WHERE project = 'login'";
  connection.query(query, function(err, login){
    connection.end();
    callback(login[0].option);
  });
}

exports.autoLogin = function(account, passwd, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,password,name,sex,email,level FROM empdata WHERE account = ?";
  connection.query(query,[account], function(err, result){
    if (result[0].password == passwd) {
      var query ="UPDATE empdata SET last_time = NOW()  WHERE account = ?";
      connection.query(query,[account], function(err){
        if (err) throw err;
        connection.end();
        callback(result);
      });
    } else {
      connection.end();
      callback(null);
    }
  });
}

exports.manualLogin = function(account, passwd, callback)
{
  sha1 = crypto.createHash('sha1');
  passwd = sha1.update(passwd).digest('hex'); 
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,password,name,sex,email,level,verify FROM empdata WHERE account = ?";
  connection.query(query,[account], function(err, result){
    if (result[0] == undefined ){
      connection.end();
      callback('user-not-found');
    } else {  
      if (passwd == result[0].password) {
        if (result[0].verify == "0") {
          connection.end();
          callback(null, 'not-verify');
        } else {
          var query ="UPDATE empdata SET last_time = NOW()  WHERE account = ?";
          connection.query(query,[account], function(err){
            if (err) throw err;
            console.log('user:'+account+' is login');
            connection.end();
            callback(null, result);
          });
        }
      } else {
        connection.end();
        callback('invalid-password');
      }
    }
  });
}

exports.checkRegister = function(callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT option FROM system_control WHERE project = 'register'";
  connection.query(query, function(err, register){
    connection.end();
    callback(register[0].option);
  });
}
/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
  sha1 = crypto.createHash('sha1');
  newData.passwd = sha1.update(newData.passwd).digest('hex');
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account FROM empdata WHERE account = ?";
  connection.query(query,[newData.account], function(err, result){
    if(result[0] != undefined){
      connection.end();
      callback('username-taken');
    } else {
      var query ="SELECT email FROM empdata WHERE email = ?";
      connection.query(query,[newData.email], function(err, result){
        if(result[0] != undefined){
          connection.end();
          callback('email-taken');
        } else {
          var query ="INSERT INTO empdata (account, password, name, level, sex, email, join_time, verify) VALUES(?,?,?,2,?,?,NOW(),'0')";
          connection.query(query,[newData.account,newData.passwd,newData.name,newData.sex,newData.email], function(err, result){
            connection.end();
            callback(err);
          });
        }
      });
    }
  });
}

exports.verifyAccount = function(callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT eid,account,name,sex,email,join_time FROM empdata WHERE verify = 0";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
}

exports.updateAccount = function(newData, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT email FROM empdata WHERE email = ? AND eid != ?";
  connection.query(query,[newData.email,newData.id], function(err, result){
    if(result[0] != undefined){
      connection.end();
      callback('email-taken');
    } else {
      var query ="SELECT eid,account,name,email,sex,level FROM empdata WHERE eid = ?";
      connection.query(query,[newData.id], function(err, result){
        result[0].name = newData.name;
        result[0].email = newData.email;
        result[0].sex = newData.sex;
        if (newData.passwd == ''){
          var query ="UPDATE empdata SET name = ? , email = ? , sex = ?  WHERE eid = ?";
          connection.query(query,[result[0].name,result[0].email,result[0].sex,newData.id], function(err){
            if (err) {
              connection.end();
              callback(err);
            } else {
              connection.end();
              callback(null, result);
            }
          });
        } else {
          sha1 = crypto.createHash('sha1');
          result[0].password = sha1.update(newData.passwd).digest('hex');
          var query ="UPDATE empdata SET password = ? , name = ? , email = ? , sex = ?  WHERE eid = ?";
          connection.query(query,[result[0].password,result[0].name,result[0].email,result[0].sex,newData.id], function(err){
            if (err) {
              connection.end();
              callback(err);
            } else {
              connection.end();
              callback(null, result);
            }
          });
        }
      });
    }
  });
}

exports.updateUser = function(newData, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT email FROM empdata WHERE email = ? AND eid != ?";
  connection.query(query,[newData.email,newData.id], function(err, result){
    if(result[0] != undefined){
      connection.end();
      callback('email-taken');
    } else {
      var query ="SELECT eid,account,name,email,sex,level FROM empdata WHERE eid = ?";
      connection.query(query,[newData.id], function(err, result){
        result[0].name = newData.name;
        result[0].email = newData.email;
	result[0].level = newData.level;
        result[0].sex = newData.sex;
        if (newData.passwd == ''){
          var query ="UPDATE empdata SET name = ? , email = ? , sex = ? , level = ?  WHERE eid = ?";
          connection.query(query,[result[0].name,result[0].email,result[0].sex,result[0].level ,newData.id], function(err){
            if (err) {
              connection.end();
              callback(err);
            } else {
              connection.end();
              callback(null, result);
            }
          });
        } else {
          sha1 = crypto.createHash('sha1');
          result[0].password = sha1.update(newData.passwd).digest('hex');
          var query ="UPDATE empdata SET password = ? , name = ? , email = ? , level = ? , sex = ?  WHERE eid = ?";
          connection.query(query,[result[0].password,result[0].name,result[0].email,result[0].sex,result[0].level,newData.id], function(err){
            if (err) {
              connection.end();
              callback(err);
            } else {
              connection.end();
              callback(null, result);
            }
          });
        }
      });
    }
  });
}


exports.updatePassword = function(email, npasswd, callback)
{
  sha1 = crypto.createHash('sha1');
  npasswd = sha1.update(npasswd).digest('hex');
  var connection = mysql.createConnection(db_option);
  var query ="SELECT email FROM empdata WHERE email = ?";
  connection.query(query,[email], function(err, result){
    if (result[0] == undefined) {
      connection.end();
      callback(err, null);
    } else {
      var query ="UPDATE empdata SET password = ?  WHERE email = ?";
      connection.query(query,[npasswd, email], function(err, result){
        connection.end();
        callback(null, result);
      });
    } 
  });
}

exports.successVerify = function(eid, callback)
{
  var connection = mysql.createConnection(db_option);
  async.forEach(eid, function(id, callback){
    var query ="UPDATE empdata SET verify = 1  WHERE eid = ?";
    connection.query(query,[id], function(err){
      var query ="SELECT account FROM empdata WHERE eid = ?";
      connection.query(query,[id], function(err, result){
        validuuid(function(uuid){
          validmac(function(mac1){
            validmac(function(mac2){
              var query ="INSERT INTO user_xml VALUES (?,?,0,?,?,0,0,0,0)";
              connection.query(query,[id,uuid,mac1,mac2], function(err){
                exec('sudo qemu-img create -f qcow2 -o backing_file=/vm_data/usb/public.img,cluster_size=2M /vm_data/usb/'+result[0].account+'.img', function(){
                  callback();
                });
              });
            });
          });
        });
      });
    });
  }, function(err) {
    if(err){
      connection.end();
      callback(err);
    } else {
      connection.end();
      callback();
    }
  });
}

exports.deleteVerify = function(eid, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="DELETE FROM empdata WHERE eid = ?";
  async.forEach(eid, function(id, callback){
    connection.query(query,[id], function(err){
      callback();
    });
  }, function(err) {
    if(err){
      connection.end();
      callback(err);
    } else {
      connection.end();
      callback();
    }
  });
}
/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account FROM empdata WHERE eid = ?";
  connection.query(query,[id], function(err, account){
    exec('sudo rm -rf /vm_data/usb/'+account[0].account+'.img', function(err){
      exec('sudo rm -rf /vm_data/xml/original/vm_'+account[0].account+'.xml', function(){
        exec('sudo rm -rf /vm_data/xml/backing/vm_'+account[0].account+'.xml', function(){
          exec('sudo rm -rf /vm_data/images/backing/*_'+account[0].account+'.xml', function(){
            var query ="DELETE FROM user_xml where eid = ?";
            connection.query(query,[id], function(err, result){
              var query ="DELETE FROM empdata where eid = ?";
              connection.query(query,[id], function(err, result){
                connection.end();
                callback(null, result);
              });
            });
          });
        });
      });
    });
  });
}

exports.getAccountByEmail = function(email, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT account,password,name,email FROM empdata WHERE email = ?";
  connection.query(query,[email], function(err, result){
    if(result[0] != undefined){
      connection.end();
      callback(result);
    } else {
      connection.end();
      callback(err);
    }
  });
}

exports.validateResetLink = function(email, passwd, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="SELECT email,password FROM empdata WHERE email = ? AND password = ?";
  connection.query(query,[email,passwd], function(err, result){
      connection.end();
      callback(result[0] != undefined ? 'ok' : null);
  });
}


var validuuid = function(callback){
  var uuid = uuId.v4();
  var connection = mysql.createConnection(db_option);
  loop();
  function loop(){
    var query ="SELECT user_uuid FROM user_xml WHERE user_uuid = ?";
    connection.query(query,[uuid], function(err, result){
      if(result[0] != undefined){
        uuid = uuId.v4();
        loop();
      } else {
        connection.end();
        callback(uuid);
      }
    });
  }
};

var validmac = function(callback){
  var mac = randomMac();
  var connection = mysql.createConnection(db_option);
  loop();
  function loop(){
    var query ="SELECT user_mac1,user_mac2 FROM user_xml WHERE user_mac1 = ? OR user_mac2 = ?";
    connection.query(query,[mac,mac], function(err, result){
      console.log(result[0]);
      if(result[0] != undefined){
        mac = randomMac();
        loop();
      } else {
        connection.end();
        callback(mac);
      }
    });
  }
};

/***********************************************************************************/
exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
