
$(document).ready(function(){
	
	var rv = new ResetValidator();
	
	$('#set-password-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){;
			rv.hideAlert();
			if (rv.validatePassword($('#pass-tf').val()) == false){
				return false;
			} else if($('#pass-tf').val() != $('#repass-tf').val()){
                                rv.showAlert('第二次密碼輸入不一樣'); 
				return false;
			} else {
                        	return true;
                        }
		},
		success	: function(responseText, status, xhr, $form){
			rv.showSuccess("您的密碼修改成功");
			setTimeout(function(){ window.location.href = '/'; }, 2000);
		},
		error : function(){
			rv.showAlert("發生了一些錯誤,請稍候再嘗試");
		}
	});

	$('#set-password').modal('show');
	$('#set-password').on('shown', function(){ $('#pass-tf').focus(); })

});
