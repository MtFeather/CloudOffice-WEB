
$(document).ready(function(){

	var lv = new LoginValidator();
	var lc = new LoginController();

// main login form //

	$('#login').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (lv.validateForm() == false){
				return false;
			} 	else{
			// append 'remember-me' option to formData to write local cookie //
				formData.push({name:'remember-me', value:$('.button-rememember-me-glyph').hasClass('glyphicon-ok')});
				return true;
			}
		},
		success	: function(data, status, xhr, $form){
			if (data == 'ok') 
                        	window.location.href = '/main';
			else if (data == 'not-verify') 
				lv.showLoginError('帳號審核中', '帳號審核中，請聯絡管理員開通');
			else if (data == 'close-login') 
				lv.showLoginError('登入錯誤', '系統維修中，目前不開放一般登入');
		},
		error : function(e){
			lv.showLoginError('登入失敗', '請檢查您的帳號或密碼');
		}
	}); 
	$('#user-tf').focus();
	
// login retrieval form via email //
	
	var ev = new EmailValidator();
	
	$('#get-credentials-form').ajaxForm({
		url: '/lost-password',
		beforeSubmit : function(formData, jqForm, options){
			if (ev.validateEmail($('#email-tf').val())){
				ev.hideEmailAlert();
				return true;
			}	else{
				ev.showEmailAlert("<b>錯誤!</b> 請輸入正確的信箱");
				return false;
			}
		},
		success	: function(responseText, status, xhr, $form){
			$('#cancel').html('OK');
			$('#retrieve-password-submit').hide();
			ev.showEmailSuccess("請前往您的信箱取回密碼");
		},
		error : function(e){
			if (e.responseText == 'email-not-found'){
				ev.showEmailAlert("查無此信箱. 您確定輸入了正確信箱嗎？");
			}	else{
				$('#cancel').html('OK');
				$('#retrieve-password-submit').hide();
				ev.showEmailAlert("抱歉! 發生了一些錯誤,請稍候再嘗試");
			}
		}
	});
	
});
