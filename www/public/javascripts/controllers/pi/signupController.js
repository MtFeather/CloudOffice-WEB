
function PiSignupController()
{
// redirect to homepage when cancel button is clicked //
	$('#account-form-btn1').click(function(){ window.location.href = '/pi';});

// redirect to homepage on new account creation, add short delay so user can read alert window //
	$('.modal-alert #ok').click(function(){window.location.href = '/pi';});
}
