//VM頁面
var VM = require('../models/virtual-manager');
var DM = require('../models/department-manager');
var fs = require('fs');
var exec = require('child_process').exec;
var mysql = require('mysql');
var db_option = {
    host: 'localhost',
    user: 'nodejs',
    password: 'cloudoffice#nodejs',
    database: 'nodejs',
};

exports.ori_add_form = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
//if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面//
    res.redirect('/');
  } else {
    VM.defaultVm(function(ram,disk){
      VM.checkUser(function(result){
        res.render( 'original_add', {
          title : '環境建置',
          user  : req.session.user,
          items : result,
          ram   : ram,
          disk  : disk
        });
      });
    });
  }
};

exports.ori_add_submit = function(req, res){
  VM.addNewOriginal({
    hdname    : req.body['hdname'],
    hdsize    : req.body['hdsize'],
    cpu       : req.body['cpu'],
    ram       : req.body['ram'],
    owner     : req.body['owner'],
    reduction : req.body['reduction']
  },function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.ori_copy_form = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    VM.checkUser(function(result){
      VM.checkDepartment(function(dep){
        res.render( 'original_copy', {
          title : '環境複製',
          user  : req.session.user,
          items : result,
          dep   : dep
        });
      });
    });
  }
};

exports.ori_copy_submit = function(req, res){
  VM.copyOriginal({
    hdname    : req.body['hdname'],
    dep       : req.body['dep'],
    owner     : req.body['owner'],
    reduction : req.body['reduction']
  },function(err){
    if (err){
      res.status(400).send(err);
    }
  });
};

exports.vmstatus_form = function(req, res){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/');
  } else {
    VM.checkVMstatus(req.session.user.id, ip,  function(hd_status, back_status){
      if(hd_status == 0 && back_status == 0){
        VM.checkImage(req.session.user.id, function(original, backing){
          VM.checkCdrom(function(files){
            res.render( 'vmstatus', {
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
                res.render( 'vmstatus', {
                  title    : '開啟/關閉虛擬機',
                  user     : req.session.user,
                  vmname   : vmname,
                  port     : port,
                  cdrom    : files,
                  uscdrom  : use,
                  ori_eid  : eid,
                  broadcast: broadcast,
                  vmstatus : 1,
		  serverip : serverip[0]
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
    res.redirect('vmstatus');
  });
};

exports.changecdrom = function(req,res){
  var cdrom = req.body['cdrom'];
  VM.changeCdrom(req.session.user.id, cdrom, function(){
    res.redirect('vmstatus');
  });
};

exports.closevm = function(req,res){
  VM.closeVm(req.session.user.id, function(){
    res.redirect('vmstatus');
  });
};

/***********************部門管理***********************/
exports.department_form = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null || req.session.user.level == 2){
//if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面
    res.redirect('/');
  } else {
    DM.dep_vmstatus(function(){
      DM.departments_maneger(req.session.user.level, req.session.user.id, function(result){
        VM.defaultVm(function(ram,disk){
          VM.checkUser(function(user){
            VM.checkCdrom(function(files){
              res.render('department', {
                title : '環境管理',
                user  : req.session.user,
                items : result,
                cdrom : files,
                alluser  : user,
                serverip : serverip[0],
                ram   : ram,
                disk  : disk
              });
            });
          });
        });
      });
    });
  }
};

exports.department_submit = function(req, res){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  VM.openVm(req.body.eid, req.body.path, req.body.boot, req.body.cdrom, ip, function(stat){
    res.redirect('department');
  });
}

exports.department_changecdrom = function(req, res){
  var eid   = req.body.eid;
  var cdrom = req.body.cdrom;
  VM.changeCdrom(eid, cdrom, function(){
     res.status(200).send('ok');
  });
};

exports.dep_close = function(req, res){
  VM.closeVm(req.body.eid, function(){
    res.status(200).send('ok');
  });
}

exports.department_setting = function(req, res){
  DM.departments_setting(req.body.oid,req.body.hdname,req.body.cpu,req.body.ram,req.body.owner,req.body.reduction, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    } 
  });
};

exports.department_start = function(req, res){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  DM.departments_start(req.body.oid, ip, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.department_close = function(req, res){
  DM.departments_close(req.body.oid, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.department_delete = function(req, res){
  DM.departments_delete(req.body.oid, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
}

exports.department_sync = function(req, res){
  DM.departments_sync(req.body.oid);
  res.status(200).send('ok');
}

exports.department_show = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
//if user is not logged-in redirect back to login page > 如果用戶沒有登入,就返回登入頁面
    res.redirect('/');
  } else {
    DM.departments_info(req.session.user.level, req.session.user.id, function(result){
        res.render('department_show', {
        title : '環境資訊',
        user : req.session.user,
        items : result
        });
    });
  }
};

exports.change_ip = function(req, res){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  VM.change_ip(req.body.eid, ip, function(){
    res.status(200).send('ok'); 
  });
}

exports.hd_form = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    DM.hd_form(req.session.user.level, req.session.user.id, function(result){
      res.render('hd_create', {
        title : '員工環境建置',
        user : req.session.user,
        items : result
      });
   });
  }
};

exports.hd_info = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    DM.hd_info(req.session.user.level, req.session.user.id, function(result){
    res.render('hd_info', {
      title : '員工環境管理',
      user : req.session.user,
      items : result
    });
   });
  }
};

exports.hd_show_form = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    DM.hd_vmstatus(req.query.id, function(){
      DM.hd_show(req.query.id, function(hd_name,eid,result){
        VM.checkCdrom(function(files){
          if(hd_name=='err'){
            res.redirect('error');
          } else {
            if (req.session.user.level == 1 && eid != req.session.user.id){
              res.redirect('/');
            } else {
              res.render('hd_show', {
                title : hd_name,
                user : req.session.user,
                cdrom : files,
                items : result,
                serverip : serverip[0]
              });
            }
          }
        });
      });
    });
  }
};

exports.hd_show_submit = function(req, res){
  var path  = req.body['path'];
  var boot  = req.body['boot'];
  var cdrom = req.body['cdrom'];
  var oid   = req.body.oid;
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  VM.openVm(req.body.eid, req.body['path'], req.body['boot'], req.body['cdrom'], ip, function(stat){
    res.redirect('hd_show?id='+oid);
  });
};

exports.hd_closevm = function(req,res){
  VM.closeVm(req.query.eid, function(){
    res.redirect('hd_show?id='+req.query.oid);
  });
};

exports.hd_changecdrom = function(req,res){
  var eid   = req.body.eid;
  var cdrom = req.body.cdrom;
  var oid = req.body.oid;
  VM.changeCdrom(eid, cdrom, function(){
     res.status(200).send('ok');
  });
};

exports.hd_deletevm = function(req,res){
  DM.hd_deletevm(req.body.oid,req.body.eid, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.hd_reductionvm = function(req,res){
  DM.hd_reductionvm(req.body.oid,req.body.eid, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }
  });
};

exports.hd_update = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    DM.hd_update(req.query.id,req.query.oid, function(result,hd_name,user_name,member){
      if(result=='err') {
        res.redirect('error');
      } else {
        if(req.session.user.level == 1 && result[0].eid != req.session.user.id){
          res.redirect('/');
        } else {
          res.render('hd_update', {
            title : '員工環境建置',
            user : req.session.user,
            items : result,
            hd_name : hd_name,
            user_name : user_name,
            oid : req.query.id,
            nowoid : req.query.oid,
            member : member
          });
        }
      }
    });
  }
};

exports.hd_update_submit = function(req,res){
  DM.createBacking(req.body['id'],req.body.who, function(err){
    if (err){
      res.status(400).send(err);
    } else {
      res.status(200).send('ok');
    }    
  }); 
};

exports.spice = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/');
  } else {
    res.render( 'spice', {
      title    : 'spice',
      user     : req.session.user,
      serverip : serverip[0],
      port     : req.query.p
    });
  }
};

exports.vnc = function(req, res){
  if (req.session.user == null){
    res.redirect('/');
  } else {
    res.render('vnc',{

    });
  }
};

exports.vnc_auto = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null){
    res.redirect('/');
  } else {
    res.render('vnc_auto',{
      title    : 'vnc_auto',
      user     : req.session.user,
      serverip : serverip[0],
      port     : req.query.p
    });
  }
};

exports.su_broadcast = function(req, res){
  var serveriphost = req.headers.host;
  var serverip = serveriphost.split(":");
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    VM.su_broadcast_port(req.session.user.id, function(port,emp){
      res.render('su_broadcast',{
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
    res.redirect('/');
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
    res.redirect('/');
  } else {
    VM.broadcast_port(req.session.user.id, function(port){
      res.render('broadcast',{
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
    res.redirect('/');
  } else {
    VM.broadcast_on(req.session.user.id, function(){
    });    
  }
};

exports.broadcast_off = function(req, res){
  if (req.session.user == null || req.session.user.level == 2){
    res.redirect('/');
  } else {
    VM.broadcast_off(req.session.user.id, function(){
    });
  }
};
