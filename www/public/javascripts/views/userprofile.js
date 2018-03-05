
$(document).ready(function(){

	var av = new AccountValidator();
	var uc = new UserprofileController();
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
			// push the disabled username field onto the form data array //
				formData.push({name:'user', value:$('#user-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') {
                          uc.onUpdateSuccess();
                        }
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
				av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
				av.showInvalidUserName();
			}
		}
	});
	$('#name-tf').focus();

// customize the account settings form //
	
	$('#account-form h2').text('帳戶設定');
	$('#sub1').text('修改您的帳戶內容');
	$('#user-tf').attr('disabled', 'disabled');
	$('#account-form-btn1').html('刪除帳號');
	$('#account-form-btn1').addClass('btn-danger');
	$('#account-form-btn2').html('更新');

// setup the confirm window that displays when the user chooses to delete their account //

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h4').text('刪除帳號');
	$('.modal-confirm .modal-body p').html('您確定要刪除您的帳號嗎?');
	$('.modal-confirm .cancel').html('取消');
	$('.modal-confirm .submit').html('刪除');
	$('.modal-confirm .submit').addClass('btn-danger');
});
