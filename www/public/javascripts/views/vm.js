function change(a){
  if (a == 'cdrom') {
     this.$("#panel").slideDown("fast");
  } else {
     this.$("#panel").slideUp("fast");
  };
};

function cdromchange(a, b){
  if (a == 'cdrom') {
     this.$("#panel"+b).fadeIn("fast");
  } else {
     this.$("#panel"+b).fadeOut("fast");
  };
};

function userall(){
 var checkItem = document.getElementsByName('who[]');
 for (var j=0;j<checkItem.length;j++){
  checkItem[j].checked=true;
 }
};

function delalluser(){
 var checkItem = document.getElementsByName("who[]");
 for (var j=0;j<checkItem.length;j++){
  checkItem[j].checked=false;
 }
};

function set(oid,hd_name,cpu,ram,eid,restore,limit_ram){
  $('#oid').val(oid);
  $('#hdname-h2').html(hd_name);
  $('#hdname-tf').val(hd_name);
  $('#cpu').val(cpu);
  $('#ram').empty();
  var j = [1,2,4,8];
  for (var i=0; i<j.length; i++){
    if (j[i] <= limit_ram || ram > limit_ram) {
      $("#ram").append($("<option></option>").attr("value", j[i]).text(j[i]+" GB"));
    }
  }
  $('#ram option[value='+ram+']').attr('selected','selected');
  $('#owner').val(eid);
  $('#user').text(eid);
  if(restore==1){
    document.getElementById("reduction1").checked = true;
  } else {
    document.getElementById("reduction0").checked = true;
  }
};
function start(oid){
  $('#btn'+oid).text('全部開機');
  $('#btn'+oid).val('start');
};
function stop(oid){
  $('#btn'+oid).text('全部關機');
  $('#btn'+oid).val('close');
};
$(document).ready(function(){
        $('[data-tooltip="tooltip"]').tooltip();
	var vv = new VirtualValidator();
	var vc = new VirtualController();
	$("#Graphics-submit").click(function(){
		$('#vm-form').ajaxForm({
			beforeSubmit : function(formData, jqForm, options){
				if (vv.validateForm() == false){
					return false;
				}
            },
			success	: function(responseText, status, xhr, $form){
				if (status == 'success') {
                    vv.showAlert('建立成功', '原始碟已建立完成', 'original_add');
					setTimeout(function(){ window.location.href = 'original_add'; }, 2000);
				}
			},
			error : function(e){
				if (e.responseText == 'error'){
					vv.showInvalidImage();
				}
			}
		});
	});
	$("#Tradition-submit").click(function(){
        $('#vm1-form').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                  if (vv.validateForm1() == false){
                    return false;
                  }
                },
                success : function(responseText, status, xhr, $form){
                        if (status == 'success') {
                                vv.showAlert('建立成功', '原始碟已建立完成', 'original_add');
                                setTimeout(function(){ window.location.href = 'original_add'; }, 2000);
                        }
                },
                error : function(e){
                        if (e.responseText == 'error'){
                            vv.showInvalidImage();
                        }
                }
        });
	});
	$('#hdname-tf').focus();
	
// customize the account signup form //
	
	$('#account-form-btn2').html('送出');
	$('#account-form-btn2').addClass('btn-primary');
	
//************************copy-form***********************//
	$('#copy-form').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                  if (vv.copyvalidateForm() == false){
                    return false;
                  } else {
                    vv.showAlert('正在建立', '正在複製硬碟，請至<a href="department_show">環境資訊</a>查看', 'original_copy');
                  }
                },
                //success : function(responseText, status, xhr, $form){
                //        if (status == 'success') {
                //                vv.showAlert('正在建立', '正在複製硬碟，請至<a href="department_show">環境資訊</a>查看', 'original_copy');
                //        }
                //},
                error : function(e){
                        if (e.responseText == 'error'){
                            vv.showInvalidImage();
                        }
                }
        });

//************************vmstatus***********************//

	$("#changecdrom").click(function(){
          $("#btn-close").slideUp("fast");
          $("#btn-cdrom").slideDown("slow");
	});
    	$("#closevm").click(function(){
          $("#btn-cdrom").slideUp("fast");
          $("#btn-close").slideDown("slow");
    	});

	$('#vmstatus-form').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                  if ($('#path').val() == ''){
                     vv.showImageNull();
                     return false;
                  }
                },
                success : function(responseText, status, xhr, $form){
                        if (status == 'success') {
                                 window.location.href = 'vmstatus';
                        }
                },
                error : function(e){
                        if (e.responseText == 'error'){
                            vv.showInvalidImage();
                        }
                }
        });

/***********************hd_update*************************/
	$('#hd_update-form').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                  if ($('input:checkbox:checked').length == 0){
                     vv.showUserNull();
                     return false;
                  }
                },
                success : function(responseText, status, xhr, $form){
                        if (status == 'success') {
                                 vv.showAlert('建置成功', '成員成功加入部門', 'hd_update?id='+$('#id').val()+'&oid=0');
                                setTimeout(function(){ window.location.href = 'hd_update?id='+$('#id').val()+'&oid=0'; }, 2000);
                        }
                },
                error : function(e){
                        if (e.responseText == 'error'){
                            vv.showInvalidImage();
                        }
                }
        });
	

/***********************department*************************/
	$('#department-form').ajaxForm({
                beforeSubmit : function(formData, jqForm, options){
                  if (vv.validateForm() == false){
                    return false;
                  }
                },
                success : function(responseText, status, xhr, $form){
                        if (status == 'success') {
				$('#myModal').modal('hide');
                                 vv.showAlert('修改成功', '環境設定成功', 'department');
                        }
                },
                error : function(e){
                        if (e.responseText == 'error'){
                        }
                }
        });
 $("#broadcast_On").click(function(){
            $("#broadcast_panel").slideDown();
        $.ajax({
          url: '/broadcast_on',
          type: 'GET',
          success:function (){
          }
        });
    });
    $("#broadcast_Off").click(function(){
            $("#broadcast_panel").slideUp();
        $.ajax({
          url: '/broadcast_off',
          type: 'GET',
          success:function (){
          }
        });
    });

    $(".btn-group > .btn").click(function(){
      $(".btn-group > .btn").removeClass("active");
      $(this).addClass("active");
    });
});
