$(document).ready(function(){

	var app = $.sammy('#main', function() {
	this.use(Sammy.JSON);
	this.use(Sammy.Storage);    
	this.debug = true;
	
			 this.get('#/',function(){ this.trigger('test') });

			 this.bind('test',function(){ alert('ok'); });
			

		});

		app.run('#/');

	});