var crypto = require('crypto');
var mysql = require('mysql');
/*ESTABLISH DATABASE CONNECTION*/
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    dateStrings:true,
    database: 'nodejs',
};


exports.showNews = function(callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT news.nid,news.subject,empdata.name,news.post_date,news.content from news,empdata where news.eid = empdata.eid ORDER BY nid DESC";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
};

exports.showNew = function(id, callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT news.nid,news.subject,empdata.name,empdata.account,news.edit_date,news.post_date,news.content FROM news,empdata WHERE news.eid = empdata.eid AND news.nid = ?";
  connection.query(query,[id], function(err, result){
    if(result.length==0) {
      connection.end();
      callback('err');
    } else {
      connection.end();
      callback(result);
    }
  });
};

exports.showNews_limit = function(callback){
  var connection = mysql.createConnection(db_option);
  var query ="SELECT news.nid,news.subject,news.content,empdata.name,news.post_date from news,empdata where news.eid = empdata.eid ORDER BY nid DESC LIMIT 3";
  connection.query(query, function(err, result){
    connection.end();
    callback(result);
  });
};

exports.addNews = function(newData, callback){
  var connection = mysql.createConnection(db_option);
  var query ="INSERT INTO news VALUES('',?,?,?,NOW(),NOW())";
  connection.query(query,[newData.id,newData.subject,newData.content], function(err){
    connection.end();
    callback(err);
  });
};


exports.updateNews = function(newData, callback)
{
      var connection = mysql.createConnection(db_option);
      var query ="SELECT nid,subject,content,edit_date FROM news WHERE nid = ?";
      connection.query(query,[newData.id], function(err, result){
        result[0].subject = newData.subject;
        result[0].content = newData.content;
        result[0].edit_date = newData.edit_date;
      var query ="UPDATE news SET subject = ? , content = ? , edit_date =NOW() WHERE nid = ?";
      connection.query(query,[result[0].subject,result[0].content,newData.id], function(err, result){
        if (err) callback(err);
        connection.end();
        callback(null, result);
      });
  })
};

exports.deleteNews = function(id, callback)
{
  var connection = mysql.createConnection(db_option);
  var query ="DELETE FROM news where nid = ?";
  connection.query(query,[id], function(err, result){
    connection.end();
    callback(null, result);
  });
}

