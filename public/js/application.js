

 
function loadFacebook(){
	
	 //FB.init({ apiKey: '6c5b74defb24efdead3232f0db0b3c3d' });
	
	//FB.api('/165218380197907/feed', function(response) {
	 // alert(response.name);
	//});
	

}

$(document).ready(function(){
	loadFacebook();
  $(":text").labelify();
	$(":password").labelify();
  $("textarea").labelify();


});

 
