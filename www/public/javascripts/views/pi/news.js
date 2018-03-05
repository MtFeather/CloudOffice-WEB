$(document).ready(function(){
	
	var pnv = new PiNewsValidator();
	var pnc = new PiNewsController();
	
	$('#news-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return pnv.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success')$('.modal-alert').modal('show');
		},
		error : function(e){
		}
	});
	$('#news-form2').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                        return pnv.validateForm();
                },
                success : function(responseText, status, xhr, $form){
                        if (status == 'success')
			{
				pnc.onUpdateSuccess();
			}
                },
                error : function(e){
                }
        });
	$('#subject-tf').focus();
	
// customize the account signup form //
	
	$('#news-form-btn').html('送出');
	$('#news-form-btn').addClass('btn-primary');
	
	$('#news-form-btn1').html('刪除文章');
	$('#news-form-btn1').addClass('btn-danger');
	$('#news-form-btn2').html('更新');
// setup the alert that displays when an account is successfully created //

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('新增最新消息成功');
	$('.modal-alert .modal-body p').html('最新消息已建立完成');
   
        $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-confirm .modal-header h4').text('刪除文章');
        $('.modal-confirm .modal-body p').html('您確定要刪除文章嗎?');
        $('.modal-confirm .cancel').html('取消');
        $('.modal-confirm .submit').html('刪除');
        $('.modal-confirm .submit').addClass('btn-danger');

});
