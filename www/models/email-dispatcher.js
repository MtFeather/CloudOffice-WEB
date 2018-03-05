var EM = {};
var exec = require('child_process').exec;
module.exports = EM;
EM.server = require("emailjs/email").server.connect(
{
	host 	    : process.env.EMAIL_HOST || 'smtp.gmail.com',
	user 	    : process.env.EMAIL_USER || 'cloudoffice922@gmail.com',
	password    : process.env.EMAIL_PASS || 'cloudoffice#nodejs',
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
    exec("ip route get 168.95.1.1 |awk '{print $7; exit}'", function (error,link, stderr) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Cloud Office <cloudoffice922@gmail.com>',
		to           : account[0].email,
		subject      : '雲端辦公室系統',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account, link)
	}, callback );
    });
}

EM.composeEmail = function(o, link)
{
	var link = 'http://'+link+':3000/reset-password?e='+o[0].email+'&p='+o[0].password;
//伺服器database可供修改
	var html = "<html><body>";
		html += o[0].name+"您好:<br><br>";
		html += "你的帳號是<b>"+o[0].account+"</b><br>";
		html += "已要求為您帳戶的密碼重置。點擊下面的鏈接，設置新密碼：</b><br><br>";
		html += "<a href='"+link+"'>點擊這裡變更您的密碼</a><br><br>";
		html += "如果你不希望重置密碼，請忽略此郵件<br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.dispatchPiResetPasswordLink = function(account, callback)
{
    exec("ip route get 168.95.1.1 |awk '{print $7; exit}'", function (error,link, stderr) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Cloud Office <cloudoffice922@gmail.com>',
		to           : account[0].email,
		subject      : '雲端辦公室系統',
		text         : 'something went wrong... :(',
		attachment   : EM.composePiEmail(account, link)
	}, callback );
    });
}
EM.composePiEmail = function(o, link)
{
	var link = 'http://'+link+'/pi/reset-password?e='+o[0].email+'&p='+o[0].password;
//伺服器database可供修改
	var html = "<html><body>";
		html += o[0].name+"您好:<br><br>";
		html += "你的帳號是<b>"+o[0].account+"</b><br>";
		html += "已要求為您帳戶的密碼重置。點擊下面的鏈接，設置新密碼：</b><br><br>";
		html += "<a href='"+link+"'>點擊這裡變更您的密碼</a><br><br>";
		html += "如果你不希望重置密碼，請忽略此郵件<br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

