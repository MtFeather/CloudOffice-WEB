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
//使用說明
exports.comment = function(req, res){
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    res.render( 'pi/comment', {
      title : '使用說明',
      user : req.session.user,
    });
  }
};

//派派的最新消息
exports.news = function(req, res){
   if (req.session.user == null){
    res.redirect('/pi');
  } else {
    IM.showNews(function(result){
       res.render('pi/news', {
        title : '最新資訊',
        user : req.session.user,
        items : result
      });
    });
  }
};

exports.newsall = function(req, res){
    IM.showNews(function(result){
       res.render('pi/newsall', {
        title : '最新資訊',
        user : req.session.user,
        items : result
      });
    });
}
exports.newsall_content = function(req, res){
IM.showNew(req.query.id, function(result){
       res.render('pi/newsall_content', {
        title : '最新資訊',
        user : req.session.user,
        udata: req.session.user,
        items : result
      });
    });
  }
exports.news_content = function(req, res){
   if (req.session.user == null){
    res.redirect('/pi');
  } else {
    IM.showNew(req.query.id, function(result){
       res.render('pi/news_content', {
        title : '最新資訊',
        user : req.session.user,
        udata: req.session.user,
        items : result
      });
    });
  }
};


exports.news_add_form = function(req, res){
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    res.render('pi/news_add', {
      title : '最新資訊',
      user : req.session.user,
    });
  }
};

exports.news_add_submit = function(req, res){
  IM.addNews({
    id     : req.session.user.id,
    subject : req.body['subject'],
    content : req.body['content']
    }, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};
exports.deletenews = function(req, res){
  console.log(req.body.id);
  IM.deleteNews(req.body.id, function(err, obj){
    if (!err){
      res.status(200).send('ok');
    } else {
      res.status(400).send('record not found');
    }
  });
}


exports.news_update_form = function(req, res){
 if (req.session.user == null){
    res.redirect('/pi');
  } else {
    IM.showNew(req.query.id, function(result){
       res.render('pi/news_update', {
        title : '修改消息',
        user : req.session.user,
        items : result
      });
    });
  }
};



exports.news_update_submit = function(req, res){
   if (req.session.user == null){
     res.redirect('/pi');
   } else {
     IM.updateNews({
       id      : req.query.id,
       subject : req.body['subject'],
       content : req.body['content']
  }, function(err, result){
         if (err){
           res.status(400).send('error-updating-news');
         } else {
           res.status(200).send('ok');
         }
    });
  }
}
//一登入直接打開VMSTATUS頁面
exports.spice = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    res.render( 'pi/spice', {
      title : 'spice',
      user  : req.session.user,
      serverip : serverip[0],
      port  : req.query.p
    });
  }
};

exports.vnc = function(req, res){
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    res.render('pi/vnc',{

    });
  }
};

exports.vnc_auto = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    res.render('pi/vnc_auto',{
      title : 'vnc_auto',
      user  : req.session.user,
      serverip : serverip[0],
      port  : req.query.p
    });
  }
};

exports.su_broadcast = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/pi');
  } else {
    VM.su_broadcast_port(req.session.user.id, function(port,emp){
      res.render('pi/su_broadcast',{
        title : '管理員廣播系統',
        user  : req.session.user,
        serverip : serverip[0],
        port  : port,
        emp   : emp
      });
    });
  }
};


exports.broadcast_change = function(req, res){
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    VM.broadcast_change(req.body.eid, req.body.port, function(){
      res.status(200).send('ok');
    });
  }
};

exports.broadcast = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    VM.broadcast_port(req.session.user.id, function(port){
      res.render('pi/broadcast',{
        title : '廣播畫面',
        user  : req.session.user,
        serverip : serverip[0],
        port  : port
      });
    });
  }
};

exports.broadcast_on = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/pi');
  } else {
    VM.broadcast_on(req.session.user.id, function(){
    });
  }
};

exports.broadcast_off = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/pi');
  } else {
    VM.broadcast_off(req.session.user.id, function(){
    });
  }
};

exports.vmstatus_form = function(req, res){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/pi');
  } else {
    VM.checkVMstatus(req.session.user.id, ip,  function(hd_status, back_status){
      if(hd_status == 0 && back_status == 0){
        VM.checkImage(req.session.user.id, function(original, backing){
          VM.checkCdrom(function(files){
            res.render( 'pi/vmstatus', {
              title    : '開啟/關閉虛擬機',
              user     : req.session.user,
              original : original,
              backing  : backing,
              cdrom    : files,
              vmstatus : 0
            });
          });
        });
      } else {
        VM.checkIp(req.session.user.id, ip, function(){
          VM.vmStatus(req.session.user.id, function(vmname, port, eid, broadcast){
            VM.checkCdrom(function(files){
              VM.usingCdrom(req.session.user.id, function(use){
                res.render( 'pi/vmstatus', {
                  title    : '開啟/關閉虛擬機',
                  user     : req.session.user,
                  vmname   : vmname,
                  serverip : serverip[0],
                  port     : port,
                  cdrom    : files,
                  uscdrom  : use,
                  ori_eid  : eid,
                  broadcast: broadcast,
                  vmstatus : 1
                });
              });
            });
          });
        });
      }
    });
  }
};
exports.vmstatus_submit = function(req, res){
  var path  = req.body['path'];
  var boot  = req.body['boot'];
  var cdrom = req.body['cdrom'];
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  VM.openVm(req.session.user.id, req.body['path'], req.body['boot'], req.body['cdrom'], ip, function(stat){
    res.redirect('/pi/vmstatus');
  });
};

exports.changecdrom = function(req,res){
  var cdrom = req.body['cdrom'];
  VM.changeCdrom(req.session.user.id, cdrom, function(){
    res.redirect('/pi/vmstatus');
  });
};

exports.closevm = function(req,res){
  VM.closeVm(req.session.user.id, function(){
    res.redirect('/pi/vmstatus');
  });
};

//派派的登入頁面
exports.login_form = function(req, res){
  IM.showNews_limit(function(result){
    if (req.session.user != null){
       res.redirect('pi/vmstatus');
    } else if (req.cookies.account == undefined || req.cookies.passwd == undefined){
      AM.checkLogin(function(login){
        res.render('pi/', {
          title: '歡迎來到雲端教室系統',
          items: result,
          login: login
        });
      });
    } else {
      AM.checkLogin(function(login){
        AM.autoLogin(req.cookies.account, req.cookies.passwd, function(result){
          if (result != null){
            if (login == 'no' && result[0].level > 1) {
              res.clearCookie('account');
              res.clearCookie('passwd');
              res.render('pi/', {
                title: '歡迎來到雲端教室系統',
                items: result,
                login: login
              });
            } else {
              req.session.user = {id:result[0].eid, account:result[0].account, name:result[0].name, sex:result[0].sex, email:result[0].email, level:result[0].level};
              res.redirect('pi/vmstatus');
            }
          } else {
            res.render('pi/', {
              title: '歡迎來到雲端教室系統',
              items : result,
              login: login
            });
          }
        });
      });
    }
  })
};

exports.login_submit = function(req, res){
  AM.checkLogin(function(login){
    AM.manualLogin(req.body['account'], req.body['passwd'], function(err, result){
      if (!result){
        res.status(400).send(err);
      } else if (result == 'not verify') {
        res.status(200).send('not verify');
      } else if (login == 'no' && result[0].level > 1) {
        res.status(200).send('close-login');
      } else {
        req.session.user = {id:result[0].eid, account:result[0].account, name:result[0].name, sex:result[0].sex, email:result[0].email, level:result[0].level};
        if (req.body['remember-me'] == 'true'){
         res.cookie('account', result[0].account, { maxAge: 900000 });
         res.cookie('passwd', result[0].password, { maxAge: 900000 });
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
  res.redirect('/pi');
};

exports.signup_form = function(req, res){
  AM.checkRegister(function(register){
    res.render('pi/signup', {
      title: '註冊',
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

exports.signup = function(req, res){
  if (req.session.user == null){
     res.redirect('/pi');
  } else {
    res.render( 'pi/register', {
      title : '新增帳號',
      user : req.session.user
    });
  }
};
exports.lost_password = function(req, res){
// look up the user's account via their email > 透過他們的信箱查找用戶//
  AM.getAccountByEmail(req.body['email'], function(result){
    if (result){
      EM.dispatchPiResetPasswordLink(result, function(e, m){
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
      res.redirect('/pi');
    } else {
//保存用戶的郵件在session，發送到客戶端//
      req.session.reset = { email:email, passwd:passwd };
      res.render('pi/reset', { title : '重設密碼' });
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
/**使用者資訊**/
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

exports.userinfo = function(req, res){
  res.render( 'pi/userinfo', {
    title : '會員資料'
  });
};

exports.userprofile_form = function(req, res){
  if (req.session.user == null){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/pi');
  } else {
    res.render('pi/userprofile', {
      title : '帳號設定',
      user : req.session.user,
      udata : req.session.user
    });
  }
};

exports.userprofile_submit = function(req, res){
   if (req.session.user == null){
     res.redirect('/pi');
   } else {
     AM.updateAccount({
       id      : req.session.user.id,
       name    : req.body['name'],
       email   : req.body['email'],
       passwd  : req.body['passwd'],
       sex     : req.body['sex']
     }, function(err, result){
         if (err){
           res.status(400).send('email-taken');
         } else {
     console.log(result[0].eid,result[0].account,result[0].name,result[0].sex,result[0].email,result[0].level);
           req.session.user = {id:result[0].eid, account:result[0].account, name:result[0].name, sex:result[0].sex, email:result[0].email, level:result[0].level};
// update the user's login cookies if they exists > 更新用戶的cookies//
           if (req.cookies.account != undefined && req.cookies.passwd!= undefined){
             res.cookie('account', result[0].account, { maxAge: 900000 });
             res.cookie('passwd', result[0].password, { maxAge: 900000 });
           }
           res.status(200).send('ok');
         }
      });
   }
}

