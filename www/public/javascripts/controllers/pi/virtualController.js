function deletevm(eid){
	VirtualController.prototype.deleteVm(eid);
}

function changecdrom(eid){
	 $.ajax({
                        url: '/pi/hd_changecdrom',
                        type: 'POST',
                        data: { oid: $('#oid').val(),eid: eid,cdrom: $('#cdrom'+eid).val()},
                        success: function(data){
                                window.location.reload();
                        },
                        error: function(jqXHR){
                                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                        }
                });

}

function VirtualController()
{
	var that = this;
// redirect to homepage when cancel button is clicked //
	$('#account-form-btn1').click(function(){ window.location.href = '/pi';});

// redirect to homepage on new account creation, add short delay so user can read alert window //
//	$('.modal-alert #ok').click(function(){window.location.href = 'original_add';});

	$('#deletevm').click(function(){ this.deleteVm(); });

 
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

VirtualController.prototype.deleteVm = function(id)
{
       	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-confirm .modal-header h4').text('刪除成員');
        $('.modal-confirm .modal-body p').html('您確定要刪除此成員嗎?');
 	$('.modal-confirm .cancel').html('取消');
        $('.modal-confirm .submit').html('刪除');
        $('.modal-confirm .submit').addClass('btn-danger');
        $('.modal-confirm').modal('show');
	$('.modal-confirm .submit').click(function(){ deleteVm(id); });
}

function deleteVm(eid)
{
alert('eid='+eid);
	var that = this;
        $.ajax({
        	url: "/pi",
        	type: "POST",
        	data: {oid : $('#oid').val(),},
	        success: function(data){
	          alert('已成功');
        	},
	        error: function(jqXHR){
	          console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
        	}
        });
}
