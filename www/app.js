var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var helmet = require('helmet');

var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var vm = require('./routes/vm');
var pi= require('./routes/pi_login');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'logo.icon')));
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
        secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4'})
);


/*****************小派派的介面*********************/
app.get('/pi/',pi.login_form);
app.post('/pi/', pi.login_submit);
app.get('/pi',pi.login_form);
app.post('/pi', pi.login_submit);
app.get('/pi/logout', pi.logout);
app.get('/pi/signup', pi.signup_form);
app.post('/pi/signup', pi.signup_submit);
app.get('/pi/register', pi.signup);
app.post('/pi/register',pi.signup_submit);
app.post('/pi/lost-password', pi.lost_password);
app.get('/pi/reset-password', pi.reset_password_form);
app.post('/pi/reset-password', pi.reset_password_submit);
app.get('/pi/vmstatus',pi.vmstatus_form);
app.post('/pi/vmstatus', pi.vmstatus_submit );
app.get('/pi/closevm',pi.closevm);
app.post('/pi/changecdrom', pi.changecdrom);
app.get('/pi/spice', pi.spice);
app.get('/pi/vnc_auto', pi.vnc_auto);
app.get('/pi/su_broadcast', pi.su_broadcast);
app.post('/pi/broadcast_change', pi.broadcast_change);
app.get('/pi/broadcast', pi.broadcast);
app.get('/pi/broadcast_on', pi.broadcast_on);
app.get('/pi/broadcast_off', pi.broadcast_off);
//最新消息
app.get('/pi/news_add', pi.news_add_form);
app.post('/pi/news_add', pi.news_add_submit);
app.get('/pi/news_update', pi.news_update_form);
app.post('/pi/news_update', pi.news_update_submit);
app.post('/pi/deletenews', pi.deletenews);
app.get('/pi/news', pi.news);
app.get('/pi/newsall', pi.newsall);
app.get('/pi/news_content', pi.news_content);
app.get('/pi/newsall_content', pi.newsall_content);
//會員資料
app.get('/pi/userprofile', pi.userprofile_form);
app.post('/pi/userprofile', pi.userprofile_submit);
//使用說明
app.get('/pi/comment', pi.comment);
/*******************登入系統***********************/
app.get('/main', routes.main);
app.get('/', login.login_form);
app.post('/', login.login_submit);
app.get('/logout', login.logout);
app.get('/signup', login.signup_form);
app.post('/signup', login.signup_submit);
app.post('/lost-password', login.lost_password);
app.get('/reset-password', login.reset_password_form);
app.post('/reset-password', login.reset_password_submit);
app.get('/register', login.signup);
app.post('/register',login.signup_submit);
app.get('/userprofile', routes.userprofile_form);
app.post('/userprofile', routes.userprofile_submit);
/*******************開啟/關閉***********************/
app.get('/vmstatus', vm.vmstatus_form );
app.post('/vmstatus', vm.vmstatus_submit );
app.post('/changecdrom', vm.changecdrom);
app.get('/closevm',vm.closevm);
app.post('/deleteaccount', login.deleteaccount);
app.get('/spice', vm.spice);
app.get('/vnc', vm.vnc);
app.get('/vnc_auto', vm.vnc_auto);
app.get('/su_broadcast', vm.su_broadcast);
app.post('/broadcast_change', vm.broadcast_change);
app.get('/broadcast', vm.broadcast);
app.get('/broadcast_on', vm.broadcast_on);
app.get('/broadcast_off', vm.broadcast_off);
app.get('/original_add', vm.ori_add_form);
app.post('/original_add', vm.ori_add_submit);
app.get('/original_copy', vm.ori_copy_form);
app.post('/original_copy', vm.ori_copy_submit);
/*******************最新消息************************/
app.get('/news_add', routes.news_add_form);
app.post('/news_add', routes.news_add_submit);
app.get('/news_update', routes.news_update_form);
app.post('/news_update', routes.news_update_submit);
app.post('/deletenews', routes.deletenews);
app.get('/news', routes.news);
app.get('/news_content', routes.news_content);
/*******************會員管理***********************/
app.get('/user', routes.user);
app.get('/user_update', routes.user_update_form);
app.post('/user_update', routes.user_update_submit);
app.get('/user_verify', routes.user_verify_form);
app.post('/successverify', routes.successverify);
app.post('/deleteverify', routes.deleteverify);
app.post('/deleteuser', routes.deleteuser);
/*******************會員快照***********************/
app.get('/department', vm.department_form);
app.post('/department', vm.department_submit);
app.post('/department_changecdrom', vm.department_changecdrom);
app.post('/dep_close', vm.dep_close);
app.post('/department_setting', vm.department_setting);
app.post('/department_start', vm.department_start);
app.post('/department_close', vm.department_close);
app.post('/department_delete', vm.department_delete);
app.post('/department_sync', vm.department_sync);
app.get('/department_show', vm.department_show);
app.post('/change_ip', vm.change_ip);
app.get('/hd_create', vm.hd_form);
app.get('/hd_update', vm.hd_update);
app.post('/hd_update', vm.hd_update_submit);
app.get('/hd_info', vm.hd_info);
app.get('/hd_show', vm.hd_show_form);
app.post('/hd_show', vm.hd_show_submit);
app.get('/hd_closevm', vm.hd_closevm);
app.post('/hd_changecdrom', vm.hd_changecdrom);
app.post('/hd_deletevm', vm.hd_deletevm);
app.post('/hd_reductionvm', vm.hd_reductionvm);
/*******************用戶使用說明***********************/
app.get('/comment', routes.comment);

/*******************主管使用說明***********************/
app.get('/comment_manager', routes.comment_manager);

/*******************下載軟體***********************/
app.get('/download', routes.download);

/*******************系統資訊***********************/
app.get('/system_control', routes.system_control);
app.post('/system_setting', routes.system_setting);
app.post('/department_control', routes.department_control_submit);
app.get('/system', routes.system);
app.get('/traffic_reports', routes.traffic_reports);
/**************************************************/
app.get('*', routes.error);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
/**
//聊天室---傳送檔案資料與錯誤回應
app.use(function send404(response) {
	  response.writeHead(404, {'Content-Type': 'text/plain'});
	  response.write('Error 404:resource not found.');
	  response.end();
	});
app.use(function sendFile(response, filePath, fileContents) {
	  response.writeHead(
	    200,
	    {"content-type":mime.lookup(path.basename(filePath))}
	  );
	  response.end(fileContents);
	});
//聊天室--提供靜態檔案
app.use(function serveStatic(response,cache,absPath) {
	  if (cache[absPath]) {
	    sendFile(response, absPath, cache[absPath]);
	  } else {
	    fs.exists(absPath, function(exists) {
	      if (exists) {
		fs.readFile(absPath, function(err,data) {
		  if (err) {
		    send404(response);
		  } else {
		    cache[absPath] = data;
		    sendFile(response, absPath, data);
		  }
		});
	      } else {
		send404(response);
	      }
	   });
	 }
	});
**/
module.exports = app;
