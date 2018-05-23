
function VirtualValidator()
{
	this.formFields = [$('#name-tf'), $('#email-tf'), $('#user-tf'), $('#pass-tf'), $('#repass-tf')];
	this.controlGroups = [$('#hdname-tf'), $('#hdsize'), $('#cpu'), $('#ram'), $('#reduction')];
        this.copycontrolGroups = [$('#hdname-tf'), $('#dep-tf'), $('#reduction')];
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
	this.showError = function(a, b)
        {
                $('.modal-form-errors .modal-header h4').text(a);
                $('.modal-form-errors .modal-body p').html(b);
				$('.modal-form-errors .modal-body ul').html(' ');
                this.alert.modal('show');
        }
	this.showErrors = function(a)
	{
		$('.modal-form-errors .modal-body p').text('請檢查以下問題:');
		var ul = $('.modal-form-errors .modal-body ul');
			ul.empty();
		for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
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
       this.deletevm('刪除員工', '您確定要刪除此員工嗎?','刪除');
}

VirtualValidator.prototype.showInvalidImage = function()
{
       this.showErrors('抱歉', '發生了一些錯誤,請稍候再嘗試'); 
}

VirtualValidator.prototype.showImageNull = function()
{
       this.showError('錯誤', '請選擇一項部門硬碟。');
}

VirtualValidator.prototype.showUserNull = function()
{
       this.showError('錯誤', '請選擇要加入的員工。');
}
VirtualValidator.prototype.validateForm = function()
{
	var e = [];
	for (var i=0; i < this.controlGroups.length; i++) this.controlGroups[i].removeClass('error');
    if ($('#hdname-tf').val() == '') {
        this.controlGroups[0].addClass('error');
        e.push('請輸入部門電腦名稱');
    }
	if ($('#hdsize').val() == '') {
		this.controlGroups[1].addClass('error'); 
		e.push('請選擇硬碟容量');
	}
	if ($('#cpu').val() == '') {
		this.controlGroups[2].addClass('error');
		e.push('請選擇CPU數量');
	}
    if ($('#ram').val() == '') {
        this.controlGroups[3].addClass('error');
        e.push('請選擇記憶體量');
    }
	if ($('#reduction').val() == '') {
		this.controlGroups[4].addClass('error'); 
		e.push('請選擇是否要還原卡功能');
	}
	if (e.length) this.showErrors(e);
	return e.length === 0;
}
VirtualValidator.prototype.validateForm1 = function()
{
        if ($('#hdname-tf1').val() == ''){
                this.showError('錯誤', '請輸入部門電腦名稱。');
                return false;
        }       else{
                return true;
        }
}

VirtualValidator.prototype.copyvalidateForm = function()
{
	var e = [];
        for (var i=0; i < this.copycontrolGroups.length; i++) this.copycontrolGroups[i].removeClass('error');
	if ($('#hdname-tf').val() == '') {
        	this.copycontrolGroups[0].addClass('error');
        	e.push('請輸入部門電腦名稱');
	}
        if ($('#dep-tf').val() == '') {
                this.copycontrolGroups[1].addClass('error');
                e.push('請選擇要複製的部門');
        }
	if ($('#reduction').val() == '') {
                this.controlGroups[2].addClass('error');
                e.push('請選擇是否要還原卡功能');
        }
        if (e.length) this.showErrors(e);
        return e.length === 0;
}
