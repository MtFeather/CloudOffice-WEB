//get home page
//功能是調用模板解析引擎，並傳入一個對象作為參數，這個對象只有一個屬性，即即 title: 'Express'。
//index.ejs：index.ejs是模板文件，即路由/ index.js中調用的模板
//layout.ejs模板文件不是孤立展示的，默認情況下所有的模板都繼承自layout.ejs，<%- body %>部分才是獨特的內容，其他部分是共有的，可以看作是頁面框架。
//使用模板引擎：res.render，並將其產生的頁面直接返回给客户端
var AM = require('../models/account-manager');
var IM = require('../models/info-manager');
var UM = require('../models/userupdate-manager');
var DM = require('../models/department-manager');
var VM = require('../models/virtual-manager');
var SC = require('../models/system-control');
var sys = require('sys');
var exec = require('child_process').exec;
var crypto = require('crypto');
var mysql = require('mysql');
var si = require('systeminformation');
var os = require('os');
var ifaces = os.networkInterfaces();
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
};
//首頁
exports.main = function(req, res){
  if (req.session.user == null){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    IM.showNews_limit(function(result){
    res.render( 'main', {
      title : '歡迎來到雲端辦公室系統',
      user : req.session.user,
      items : result
    });
   });
  }
};

/***********************一般使用者使用說明***********************/
exports.comment = function(req, res){
  if (req.session.user == null || req.session.user.level == 1){
    res.redirect('/');
  } else {
    res.render( 'comment', {
      title : '用戶使用說明',
      user : req.session.user,
    });
  }
};

/***********************主管使用說明***********************/
exports.comment_manager = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    res.render( 'comment_manager', {
      title : '使用說明',
      user : req.session.user,
    });
  }
};


/***********************軟體下載***********************/
exports.download = function(req, res){
  if (req.session.user == null){
    res.redirect('/');
  } else {
    res.render( 'download', {
      title : '軟體下載',
      user : req.session.user,
    });
  }
};

/***********************系統資訊***********************/
exports.system_control = function(req, res){
  if (req.session.user == null || req.session.user.level > 0){
    res.redirect('/');
  } else {
    SC.system_control(function(result){
      SC.department_control(function(department){
        res.render( 'system_control', {
          title     : '系統控制',
          user      : req.session.user,
          result    : result,
          department: department
        });
      });
    });
  }
};

exports.system_setting = function(req, res){
  SC.system_setting(
    req.body['login'],
    req.body['register'],
    req.body['ram'],
    req.body['disk'],
    req.body['time'],
    req.body['usb']
  ,function(){ 
    res.redirect('system_control');
  });
};

exports.department_control_submit = function(req, res){
  SC.department_control_submit(req.body.oid, function(){
    res.redirect('system_control');
  });
};

exports.system = function(req, res){
  if (req.session.user == null || req.session.user.level > 0){
    res.redirect('/');
  } else {
    si.cpu(function(cpu) {
      si.osInfo(function(os) {
        si.mem(function(mem) {
 	  hdd(function(original_used, original_size, backing_used, backing_size) {;
            res.render( 'system', {
              title         : '系統資訊',
              user          : req.session.user,
              cpu           : cpu,
              os            : os,
              mem           : mem,
              original_used : original_used,
	      original_size : original_size,
	      backing_used  : backing_used,
	      backing_size  : backing_size
            });
          });
        });
      });
    });
  }
};

exports.traffic_reports = function(req, res){
  if (req.session.user == null || req.session.user.level > 0){
    res.redirect('/');
  } else {
    res.render( 'traffic_reports', {
      title : '流量報表',
      user : req.session.user,
    });
  }
};

/***********************最新資訊***********************/
exports.news = function(req, res){
  if (req.session.user == null){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    IM.showNews(function(result){
       res.render('news', {
        title : '最新資訊',
        user : req.session.user,
        items : result
      });
    });
  }
};

exports.news_content = function(req, res){
 if (req.session.user == null){
    res.redirect('/');
  } else {
    IM.showNew(req.query.id, function(result){
      if(result=='err') res.redirect('error');
      res.render('news_content', {
        title : '最新資訊',
        user : req.session.user,
        udata: req.session.user,
        items : result
      });
    });
  }
};


exports.news_add_form = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    res.render('news_add', {
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
  IM.deleteNews(req.body.id, function(err, obj){
    if (!err){
      res.status(200).send('ok');
    } else {
      res.status(400).send('record not found');
    }
  });
}


exports.news_update_form = function(req, res){
 if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    IM.showNew(req.query.id, function(result){
       if(result=='err') res.redirect('error');
       res.render('news_update', {
        title : '修改消息',
        user : req.session.user,
        items : result
      });
    });
  }
};



exports.news_update_submit = function(req, res){
   if (req.session.user == null){
     res.redirect('/');
   } else {
     IM.updateNews({
       id      : req.query.id,
       subject : req.body['subject'],
       content : req.body['content']
  }, function(err,result){
         if (err){
           res.status(400).send(err);
         } else {
	   res.status(200).send('ok');
         }
    });
  }
}

/***********************會員帳號管理***********************/
exports.user = function(req, res){
  if (req.session.user == null || req.session.user.level > 0){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    UM.showUsers(function(result){
    res.render('user', {
      title : '使用者管理',
      user : req.session.user,
      items : result
    });
   });
  }
};
exports.user_update_form = function(req, res){
 if (req.session.user == null || req.session.user.level > 0){
    res.redirect('/');
  } else {
    UM.showuser(req.query.id, function(result){
       if(result=='err'){
         res.redirect('error');
       } else {
         res.render('user_update', {
           title : '修改員工資料',
           user : req.session.user,
           items : result
         });
       }
    });
  }
};

exports.user_update_submit = function(req, res){
   if (req.session.user == null){
     res.redirect('/');
   } else {
     AM.updateUser({
       id      : req.body['id'],
       name    : req.body['name'],
       passwd  : req.body['passwd'],
       email   : req.body['email'],
       sex     : req.body['sex'],
       level   : req.body['level']
     }, function(err, result){
         if (err){
           res.status(400).send('email-taken');
         } else {
           res.status(200).send('ok');
         }
      });
   }
}

exports.user_verify_form = function(req, res){
   if (req.session.user == null || req.session.user.level > 0){
     res.redirect('/');
   } else {
     AM.verifyAccount(function(result){
       res.render('user_verify', {
         title  : '使用者審核',
         user   : req.session.user,
         items : result
       });
     });
   }
}

exports.successverify = function(req, res){
  var eid = req.body['eid'];
  AM.successVerify(eid, function(err){
    if(!err) {
      res.status(200).send('ok');
    } else {
      res.status(400).send('err');
    }
  });
}

exports.deleteverify = function(req, res){
  var eid = req.body['eid'];
  AM.deleteVerify(eid, function(err){
    if(!err) {
      res.status(200).send('ok'); 
    } else {
      res.status(400).send('err');
    }
  }); 
}

exports.deleteuser = function(req, res){
  AM.deleteAccount(req.body.id, function(err, obj){
    if (!err){
      res.status(200).send('ok');
    } else {
      res.status(400).send('record not found');
    }
  });
}

/***********************個人帳號設定***********************/
exports.userprofile_form = function(req, res){
  if (req.session.user == null){
// if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    res.render('userprofile', {
      title : '帳號設定',
      user : req.session.user,
      udata : req.session.user
    });
  }
};

exports.userprofile_submit = function(req, res){
   if (req.session.user == null){
     res.redirect('/');
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
};

exports.error = function(req, res){
  res.render('404', {
      title : 'Page Not Found',
      user : req.session.user,
    });
};

var hdd = function(callback) {
  si.fsSize(function(hd) {
    for (var i in hd) {
      if (hd[i].mount == '/vm_data/images/original') {
        var original_used = hd[i].used;
        var original_size = hd[i].size;
      } else if (hd[i].mount == '/vm_data/images/backing') {
        var backing_used = hd[i].used;
        var backing_size = hd[i].size;
      }
    }
    callback(original_used, original_size, backing_used, backing_size);
  });
}
