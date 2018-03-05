
$(document).ready(function(){
	
	var av = new PiAccountValidator();
	var sc = new PiSignupController();
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return av.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();
			}
		}
	});
	$('#user-tf').focus();
	
// customize the account signup form //
	
	$('#account-form h2').text('註冊');
	$('#account-form #sub1').text('請填寫您的個人資料:');
	$('#account-form #sub2').text('請輸入您的帳號密碼:');
	$('#account-form-btn1').html('取消');
	$('#account-form-btn2').html('送出');
	$('#account-form-btn2').addClass('btn-primary');
	
// setup the alert that displays when an account is successfully created //

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('註冊成功');
	$('.modal-alert .modal-body p').html('您的帳戶已成功創建,請聯絡管理員進行審查');

});
