
function VirtualValidator()
{
// bind a simple alert window to this controller to display any errors //
	this.Alert = $('.modal-alert');
	
	this.showAlert = function(t, m, s)
	{
		$('.modal-alert .modal-header h4').text(t);
		$('.modal-alert .modal-body p').html(m);
                $('.modal-alert #ok').click(function(){window.location.href = s;});
		this.Alert.modal('show');
	}
         
        this.alert = $('.modal-form-errors');
        this.alert.modal({ show : false, keyboard : true, backdrop : true});
	this.showErrors = function(a, b)
        {
                $('.modal-form-errors .modal-header h4').text(a);
                $('.modal-form-errors .modal-body p').html(b);
                this.alert.modal('show');
        }

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        this.deletevm = function(x, c, e)
	{
        	$('.modal-confirm .modal-header h4').text(x);
	        $('.modal-confirm .modal-body p').html(c);
	        $('.modal-confirm .cancel').html('取消');
	        $('.modal-confirm .submit').html(e);
	        $('.modal-confirm .submit').addClass('btn-danger');
		$('.modal-confirm').modal('show');
	}
}

VirtualValidator.prototype.deleteVm = function()
{
       this.deletevm('刪除學生', '您確定要刪除此學生嗎?','刪除');
}

VirtualValidator.prototype.showInvalidImage = function()
{
       this.showErrors('抱歉', '發生了一些錯誤,請稍候再嘗試'); 
}

VirtualValidator.prototype.showImageNull = function()
{
       this.showErrors('錯誤', '請選擇一項課程硬碟。');
}

VirtualValidator.prototype.showUserNull = function()
{
       this.showErrors('錯誤', '請選擇要加入的學生。');
}
VirtualValidator.prototype.validateForm = function()
{
	if ($('#hdname-tf').val() == ''){
		this.showErrors('錯誤', '請輸入課程電腦名稱。');
		return false;
	}	else{
		return true;
	}
}
