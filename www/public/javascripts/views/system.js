$(document).ready(function(){
  $('#select-all').click(function(event) {
    if(this.checked) {
      $('input[name="oid[]"]').each(function() {
        this.checked = true;
      });
    } else {
      $('input[name="oid[]"]').each(function() {
        this.checked = false;
      });
    }
  });

  $('#form-submit').click(function(){ 
    $('.modal-confirm .submit').click(function(){ $('#system-form').submit(); });
    Confirm('確認','確定要修改嗎?','確定','btn-danger');
  });

  $('#department-submit').click(function(){ 
    $('.modal-confirm .submit').click(function(){ $('#department-form').submit(); });
    Confirm('確認','確定要更新嗎?','確定','btn-danger');
  });
});

function Confirm(h, p, s, c)
{
        $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-confirm .modal-header h4').text(h);
        $('.modal-confirm .modal-body p').html(p);
        $('.modal-confirm .cancel').html('取消');
        $('.modal-confirm .submit').html(s);
        $('.modal-confirm .submit').addClass(c);
        $('.modal-confirm').modal('show');
}

