function deletevm(eid){
	this.confirmVm('刪除學生','您確定要刪除此學生嗎?','刪除');
	$('.modal-confirm .submit').click(function(){ delvm(eid); });
}

function reduction(eid){
	this.confirmVm('還原','您確定要還原此硬碟？','還原');	
	$('.modal-confirm .submit').click(function(){ redvm(eid); });
}

function changecdrom(eid){
	 $.ajax({
                        url: '/hd_changecdrom',
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

function dep_changecdrom(oid, eid){
         $.ajax({
                        url: '/department_changecdrom',
                        type: 'POST',
                        data: { eid: eid,cdrom: $('#cdrom'+oid).val()},
                        success: function(data){
                                window.location.reload();
                        },
                        error: function(jqXHR){
                                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                        }
                });

}

function closedep(eid){
 	$.ajax({
            url: '/dep_close',
            type: 'POST',
            data: { eid: eid },
            success: function(data){
                     window.location.reload();
            },
            error: function(jqXHR){
                     console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
            }
	}); 
}

function allset(oid){
	if($('#btn'+oid).val()=='start'){
		this.confirmVm('全部開機','您確定要開啟此課程所有硬碟嗎？','確定');
	        $('.modal-confirm .submit').click(function(){ startvm(oid); });
	} else if($('#btn'+oid).val()=='close'){
		this.confirmVm('全部關機','您確定要關閉此課程所有硬碟嗎？','確定');
                $('.modal-confirm .submit').click(function(){ closevm(oid); });
	}
}

function delori(oid){
        this.confirmVm('刪除','您確定要刪除此課程？','刪除');
        $('.modal-confirm .submit').click(function(){ deleteori(oid); });
}

function sync(oid){
        this.confirmVm('同步','您確定要同步此課程？','同步');
        $('.modal-confirm .submit').click(function(){ syncori(oid); });
}


function VirtualController()
{
	var that = this;
// redirect to homepage when cancel button is clicked //
	$('#account-form-btn1').click(function(){ window.location.href = '/';});

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

this.confirmVm = function(x, e, c)
{
       	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
        $('.modal-confirm .modal-header h4').text(x);
        $('.modal-confirm .modal-body p').html(e);
 	$('.modal-confirm .cancel').html('取消');
        $('.modal-confirm .submit').html(c);
        $('.modal-confirm .submit').addClass('btn-danger');
        $('.modal-confirm').modal('show');
}

this.successdel = function()
{
        $('.modal-alert .modal-header h4').text('刪除成功');
        $('.modal-alert .modal-body p').html('學生已刪除成功');
        $('.modal-alert #ok').click(function(){window.location.reload();});
	$('.modal-alert').modal('show');
}

this.successred = function()
{
        $('.modal-alert .modal-header h4').text('還原成功');
        $('.modal-alert .modal-body p').html('此學生已還原成功');
        $('.modal-alert #ok').click(function(){window.location.reload();});
	$('.modal-alert').modal('show');
}

function delvm(eid)
{
        $.ajax({
        	url: "/hd_deletevm",
        	type: "POST",
        	data: {oid : $('#oid').val(),eid : eid},
	        success: function(data){
		  $('.modal-confirm').modal('hide');
	          successdel();
		  setTimeout(function(){ window.location.reload(); }, 2000);
        	},
	        error: function(jqXHR){
	          console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
        	}
        });
}
function redvm(eid)
{
        $.ajax({
        	url: "/hd_reductionvm",
        	type: "POST",
        	data: {oid : $('#oid').val(),eid : eid},
	        success: function(data){
		  $('.modal-confirm').modal('hide');
	          successred();
		  setTimeout(function(){ window.location.reload(); }, 2000);
        	},
	        error: function(jqXHR){
	          console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
        	}
        });
}
function startvm(oid)
{
        $.ajax({
                url: "/department_start",
                type: "POST",
                data: {oid : oid},
                success: function(responseText, status, xhr, $form){
                	if (status == 'success') {
                  		$('.modal-confirm').modal('hide');
                 		 window.location.reload();
			}
                },
                error: function(jqXHR){
                  console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                }
        });
}

function closevm(oid)
{
        $.ajax({
                url: "/department_close",
                type: "POST",
                data: {oid : oid},
                success: function(responseText, status, xhr, $form){
                        if (status == 'success') {
                                $('.modal-confirm').modal('hide');
                                 window.location.reload();
                        }
                },
                error: function(jqXHR){
                  console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                }
        });
}

function deleteori(oid)
{
	$.ajax({
                url: "/department_delete",
                type: "POST",
                data: {oid : oid},
                success: function(responseText, status, xhr, $form){
 	                $('.modal-confirm').modal('hide');
       		        successdelori();
       	       		setTimeout(function(){ window.location.reload(); }, 2000);
                },
                error: function(jqXHR){
                  console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                }
        });
}

function changeip(eid)
{
	$.ajax({
                url: "/change_ip",
                type: "POST",
                data: {eid : eid},
                success: function(responseText, status, xhr, $form){
                        window.location.reload();
                },
                error: function(jqXHR){
                  console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                }
        });
}

this.successdelori = function()
{
        $('.modal-alert .modal-header h4').text('刪除成功');
        $('.modal-alert .modal-body p').html('課程已刪除成功');
        $('.modal-alert #ok').click(function(){window.location.reload();});
        $('.modal-alert').modal('show');
}

function syncori(oid)
{
        $('.modal-confirm').modal('hide');
        $.ajax({
                url: "/department_sync",
                type: "POST",
                data: {oid : oid},
                success: function(responseText, status, xhr, $form){
                        successsyncori();
                },
                error: function(jqXHR){
                  console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
                }
        });
}

this.successsyncori = function()
{
        $('.modal-alert .modal-header h4').text('正在同步');
        $('.modal-alert .modal-body p').html('正在同步硬碟，請至<a href="department_show">課程資訊</a>查看');
        $('.modal-alert #ok').click(function(){window.location.reload();});
        $('.modal-alert').modal('show');
}
