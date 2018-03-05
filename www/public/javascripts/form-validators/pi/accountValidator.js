
function PiAccountValidator()
{
// build array maps of the form inputs & control groups //

	this.formFields = [$('#name-tf'), $('#email-tf'), $('#user-tf'), $('#pass-tf'), $('#repass-tf')];
	this.controlGroups = [$('#name-cg'), $('#email-cg'), $('#user-cg'), $('#pass-cg'), $('#repass-cg')];
	
// bind the form-error modal window to this controller to display any errors //
	
	this.alert = $('.modal-form-errors');
	this.alert.modal({ show : false, keyboard : true, backdrop : true});
	
	this.validateName = function(s)
        {
                return s.length >= 3;
        }
	this.validatePassword = function(s)
	{
	// if user is logged in and hasn't changed their password, return ok
		if ($('#userId').val() && s===''){
			return true;
		}	else  {  
			return s.length >= 6;
		}
	}
	this.validateEmail = function(e)
	{
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(e);
	}
	this.showErrors = function(a)
	{
		$('.modal-form-errors .modal-body p').text('請檢查以下問題:');
		var ul = $('.modal-form-errors .modal-body ul');
			ul.empty();
		for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
		this.alert.modal('show');
	}

}

PiAccountValidator.prototype.showInvalidEmail = function()
{
	this.controlGroups[1].addClass('error');
	this.showErrors(['信箱已被使用']);
}

PiAccountValidator.prototype.showInvalidUserName = function()
{
	this.controlGroups[2].addClass('error');
	this.showErrors(['帳號已被使用']);
}

PiAccountValidator.prototype.validateForm = function()
{
	var e = [];
	for (var i=0; i < this.controlGroups.length; i++) this.controlGroups[i].removeClass('error');
        if (this.validateName(this.formFields[2].val()) == false) {
                this.controlGroups[0].addClass('error');
                e.push('請輸入帳號，不可小於2個字元');
        }
	if (this.formFields[0].val() == '') {
		this.controlGroups[1].addClass('error'); e.push('姓名不可空白');
	}
	if (this.validatePassword(this.formFields[3].val()) == false) {
		this.controlGroups[2].addClass('error');
		e.push('密碼需要6個以上');
	}
        if (this.formFields[4].val() !== this.formFields[3].val()) {
                this.controlGroups[3].addClass('error');
                e.push('第二次密碼輸入不一樣');
        }
	if (this.validateEmail(this.formFields[1].val()) == false) {
		this.controlGroups[4].addClass('error'); e.push('請輸入正確的信箱地址');
	}
	if (e.length) this.showErrors(e);
	return e.length === 0;
}

	
