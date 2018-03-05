function NewsValidator()
{
// build array maps of the form inputs & control groups //

        this.formFields = [$('#subject-tf'), $('#content-tf')];
        this.controlGroups = [$('#subject-cg'), $('#content-cg')];

// bind the form-error modal window to this controller to display any errors //


        this.alert = $('.modal-form-errors');
        this.alert.modal({ show : false, keyboard : true, backdrop : true});

        this.showErrors = function(a)
        {
                $('.modal-form-errors .modal-body p').text('請檢查以下問題:');
                var ul = $('.modal-form-errors .modal-body ul');
                        ul.empty();
                for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
                this.alert.modal('show');
        }
}

NewsValidator.prototype.validateForm = function()
{
        var e = [];
        for (var i=0; i < this.controlGroups.length; i++) this.controlGroups[i].removeClass('error');
        if (this.formFields[0].val() == '') {
                this.controlGroups[0].addClass('error');
                e.push('請輸入主旨');
        }
        if (this.formFields[1].val() == '') {
                this.controlGroups[1].addClass('error');
                e.push('請輸入內容');
        }
        if (e.length) this.showErrors(e);
        return e.length === 0;
}
