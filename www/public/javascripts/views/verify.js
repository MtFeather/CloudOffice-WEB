$(document).ready(function(){
    $('#select-all').click(function(event) {
      if(this.checked) {
        $('input[name="eid"]').each(function() {
          this.checked = true;
        });
      } else {
        $('input[name="eid"]').each(function() {
          this.checked = false;
        });
      }
    });

    $("#deleteverify").click(function(){
        if ($('input[name="eid"]:checkbox:checked').length == 0) {
          Error('錯誤','請選擇要刪除的成員');
        } else {
          var val = [];
	  $('input[name="eid"]:checkbox:checked').each(function(i){
            val[i] = $(this).val();
          });
          Confirm('刪除','您確定要刪除選取的成員嗎?','刪除','btn-danger');
          $('.modal-confirm .submit').click(function(){ delverify(val); });
        }
    });

    $("#successverify").click(function(){
        if ($('input[name="eid"]:checkbox:checked').length == 0) {
          Error('錯誤','請選擇要啟動的成員');
        } else {
          var val = [];
          $('input[name="eid"]:checkbox:checked').each(function(i){
            val[i] = $(this).val();
          });
          Confirm('啟動','您確定要啟動選取的成員嗎?','啟動','btn-success');
          $('.modal-confirm .submit').click(function(){ sucverify(val); });
        }
    });
});

function sucverify(id){
    $.ajax({
        url: '/successverify',
        type: 'POST',
        data: { eid: id },
        success: function(data){
            $('.modal-confirm').modal('hide');
            Alert('啟動成功','已將選取成員啟動');
        },
        error: function(jqXHR){
            $('.modal-confirm').modal('hide');
            Error('抱歉','發生未知的錯誤');
        }
    });
}

function delverify(id){
    $.ajax({
        url: '/deleteverify',
        type: 'POST',
        data: { eid: id },
        success: function(data){
            $('.modal-confirm').modal('hide');
            Alert('刪除成功','已將選取成員刪除');
        },
        error: function(jqXHR){
            $('.modal-confirm').modal('hide');
            Error('抱歉','發生未知的錯誤');
        }
    });
}

this.Error = function(h, p)
{
        $('.modal-form-errors').modal({ show : false, keyboard : true, backdrop : true});
        $('.modal-form-errors .modal-header h4').text(h);
        $('.modal-form-errors .modal-body p').html(p);
        $('.modal-form-errors .modal-body ul').html(' ');
        $('.modal-form-errors').modal('show');
}

this.Alert = function(h, p)
{
        $('.modal-alert .modal-header h4').text(h);
        $('.modal-alert .modal-body p').html(p);
        $('.modal-alert #ok').click(function(){window.location.reload();});
        $('.modal-alert').modal('show');
}

this.Confirm = function(h, p, s, c)
{
       	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-confirm .modal-header h4').text(h);
        $('.modal-confirm .modal-body p').html(p);
 	$('.modal-confirm .cancel').html('取消');
        $('.modal-confirm .submit').html(s);
        $('.modal-confirm .submit').addClass(c);
        $('.modal-confirm').modal('show');
}
