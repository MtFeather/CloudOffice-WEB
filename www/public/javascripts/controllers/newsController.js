function NewsController()
{
  var that = this;
  $('#news-form-btn1').click(function(){$('.modal-confirm').modal('show')});

  $('.modal-confirm .submit').click(function(){ that.deleteNews(); });

        this.deleteNews = function()
        {
                $('.modal-confirm').modal('hide');
                var that = this;
                $.ajax({
                        url: '/deletenews',
                        type: 'POST',
                        data: { id: $('#newsId').val()},
                        success: function(data){
                                that.showLockedAlert('文章已成功刪除');
                        },
                        error: function(jqXHR){
                                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                        }
                });
        }
// redirect to homepage on new account creation, add short delay so user can read alert window //
         $('.modal-alert #ok').click(function(){ setTimeout(function(){window.location.href = 'news';}, 300)});

  this.showLockedAlert = function(msg){
                $('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
                $('.modal-alert .modal-header h4').text('刪除成功');
                $('.modal-alert .modal-body p').html(msg);
                $('.modal-alert').modal('show');
                $('.modal-alert button').click(function(){window.location.href = 'news';})
                setTimeout(function(){window.location.href = 'news';}, 3000);
        }
}

NewsController.prototype.onUpdateSuccess = function()
{
        $('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-alert .modal-header h4').text('更新成功');
        $('.modal-alert .modal-body p').html('文章已更新');
        $('.modal-alert').modal('show');
        $('.modal-alert button').click(function(){window.location.href = 'news';});
}
                 
