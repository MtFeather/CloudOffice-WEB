//註冊頁面
var AM = require('../models/account-manager');
var EM = require('../models/email-dispatcher');
var IM = require('../models/info-manager');
var UM = require('../models/userupdate-manager');
var DM = require('../models/department-manager');
var VM = require('../models/virtual-manager');
var sys = require('sys');
var exec = require('child_process').exec;
var crypto = require('crypto');
var mysql = require('mysql');
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
};
exports.main = function(req, res){
  if (req.session.user == null){
    res.redirect('/');
  } else {
    IM.showNews_limit(function(result){
    res.render( 'main', {
      title : '歡迎來到研討會系統',
      user : req.session.user,
      items : result
    });
   });
  }
};
exports.login_form = function(req, res){
// check if the user'is credentials are saved in a cookies > 檢查用戶的憑證有無保存在cookies中 //
  if (req.session.user != null){
     res.redirect('main');
  } else if (req.cookies.account == undefined || req.cookies.passwd == undefined){
    AM.checkLogin(function(login){
      res.render('index', { 
        title: '歡迎來到雲端辦公室系統',
        login: login
      });
    });
  } else {
// attempt automatic login > 嘗試自動登入 //
    AM.checkLogin(function(login){
      AM.autoLogin(req.cookies.account, req.cookies.passwd, function(result){
        if (result != null){
          if (login == 'no' && result[0].level > 1) {
            res.clearCookie('account');
            res.clearCookie('passwd');
            res.render('index', {
              title: '歡迎來到雲端辦公室系統',
              login: login
            });
          } else {
            req.session.user = {id:result[0].eid, account:result[0].account, name:result[0].name, sex:result[0].sex, email:result[0].email, level:result[0].level};
            res.redirect('main');
          }
        } else {
          res.render('index', { 
            title: '歡迎來到雲端辦公室系統',
            login: login
          });
        }
      });
    });
  }
};

exports.login_submit = function(req, res){
  AM.checkLogin(function(login){
    AM.manualLogin(req.body['account'], req.body['passwd'], function(err, result){
      if (!result){
        res.status(400).send(err);
      } else if (result == 'not-verify') {
        res.status(200).send('not-verify');
      } else if (login == 'no' && result[0].level > 1) {
        res.status(200).send('close-login');
      } else {
        req.session.user = {id:result[0].eid, account:result[0].account, name:result[0].name, sex:result[0].sex, email:result[0].email, level:result[0].level};
        if (req.body['remember-me'] == 'true'){
         res.cookie('account', result[0].account, { maxAge: 1296000000 });
         res.cookie('passwd', result[0].password, { maxAge: 1296000000 });
        }
        res.status(200).send('ok');
      }  
    });
  });
};

exports.logout = function(req, res){
  res.clearCookie('account');
  res.clearCookie('passwd');
  req.session.destroy();
  res.redirect('/');
};

exports.signup_form = function(req, res){
  AM.checkRegister(function(register){
    res.render('signup', {
      title   : '註冊',
      register: register
    });
  });
};

exports.signup_submit = function(req, res){
  AM.addNewAccount({
    account : req.body['account'],
    passwd  : req.body['passwd'],
    name    : req.body['name'],
    sex     : req.body['sex'],
    email   : req.body['email']
  }, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.lost_password = function(req, res){
// look up the user's account via their email > 透過他們的信箱查找用戶//
  AM.getAccountByEmail(req.body['email'], function(result){
    if (result){
      EM.dispatchResetPasswordLink(result, function(e, m){
// this callback takes a moment to return > 需要一段間回報//
// TODO add an ajax loader to give user feedback > 添加ajax的加載回饋給使用者//
        if (!e){
          res.status(200).send('ok');
        } else {
          for (k in e) console.log('ERROR : ', k, e[k]);
          res.status(400).send('unable to dispatch password reset');
        }
      });
    } else {
      res.status(400).send('email-not-found');
    }
  });
}
exports.reset_password_form = function(req, res){
  var email = req.query["e"];
  var passwd = req.query["p"];
  AM.validateResetLink(email, passwd, function(e){
    if (e != 'ok'){
      res.redirect('/');
    } else {
//保存用戶的郵件在session，發送到客戶端//
      req.session.reset = { email:email, passwd:passwd };
      res.render('reset', { title : '重設密碼' });
    }
  });
}

exports.reset_password_submit = function(req, res){
  var npasswd = req.body['passwd'];
// 從session中獲取用戶的電子郵件，以查找他們的帳戶和密碼重置//
  var email = req.session.reset.email;
//檢索存儲的電子郵件後，立即銷毀session//
  req.session.destroy();
  AM.updatePassword(email, npasswd, function(err, result){
    if (result){
      res.status(200).send('ok');
    } else {
      res.status(400).send('unable to update password');
    }
  });
}

exports.deleteaccount = function(req, res){
  AM.deleteAccount(req.body.id, function(err, obj){
    if (!err){
      res.clearCookie('account');
      res.clearCookie('passwd');
      req.session.destroy(function(e){ res.status(200).send('ok'); });
    } else {
      res.status(400).send('record not found');
    }
  });
}

exports.signup = function(req, res){
  if (req.session.user == null || req.session.user.level != 0){
     res.redirect('/');
  } else {
    res.render( 'register', {
      title : '新增帳號',
      user : req.session.user
    });
  }
};
/***
exports.signup_submit = function(req, res){
  AM.addNewAccount({
    name    : req.body['name'],
    mail   : req.body['email'],
    user    : req.body['user'],
    pass    : req.body['pass'],
    country : req.body['country']
  }, function(e){
    if (e){
      res.status(400).send(e);
    }else{
      res.status(200).send('ok');
    }
  });
  var account = req.body['account'],
      passwd= req.body['passwd'],
      name = req.body['name'],
      sex= req.body['sex'],
      email= req.body['email'],
      md5 = crypto.createHash('md5');
  passwd = md5.update(passwd).digest('hex');
  var connection = mysql.createConnection(db_option);
  var query ="INSERT INTO empdata VALUES('',?,?,?,2,?,?,NOW(),'')";
  connection.query(query,[account,passwd,name,sex,email], function(err){
    if(err) throw err;
     res.redirect('/');
  });
};
***/
