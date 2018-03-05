function UseraddController()
{
// bind event listeners to button clicks //
        var that = this;

// confirm account deletion //
        $('#account-form-btn1').click(function(){$('.modal-confirm').modal('show')});

// handle account deletion //
        $('.modal-confirm .submit').click(function(){ that.deleteAccount(); });

        this.deleteAccount = function()
        {
                $('.modal-confirm').modal('hide');
                var that = this;
                $.ajax({
                        url: '/deleteuser',
                        type: 'POST',
                        data: { id: $('#userId').val()},
                        success: function(data){
                                that.showLockedAlert('帳戶已成功刪除');
                        },
                        error: function(jqXHR){
                                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                        }
                });
        }
    
        this.showLockedAlert = function(msg){
                $('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
                $('.modal-alert .modal-header h4').text('刪除成功');
                $('.modal-alert .modal-body p').html(msg);
                $('.modal-alert').modal('show');
                $('.modal-alert button').click(function(){window.location.href = 'user';})
                setTimeout(function(){window.location.href = 'user';}, 3000);
        }
}

UseraddController.prototype.onUpdateSuccess = function()
{
        $('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-alert .modal-header h4').text('更新成功');
        $('.modal-alert .modal-body p').html('您的帳戶資訊已更新');
        $('.modal-alert').modal('show');
        $('.modal-alert button').click(function(){window.location.href = 'user_update?id='+$('#userId').val()});
}

