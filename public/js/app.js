var app;
var store;
var cart;
var clientes=[];
var map_clientes=[];
var productos=[];
var oportunidades=[];
var currentClienteId='';

function hideAllDivs(){
	$('#loading').hide();
	$('#selectCliente').hide();
	$('#doPedido').hide();
}

function doSearchClientes(){
	var currentVal = $('#txt_searchCliente').val();
	var results=[];
	var count = clientes.length -1;
	while(count > -1){
		var cliente = clientes[count];
		var res = cliente.Name.toLowerCase().search(currentVal.toLowerCase());
		if(res>0){
			results.push(cliente);
		}
		count--;
	}
		app.trigger('doShowClienteSearchResult',{results: results});
}
	
	$(document).ready(function(){
		app = $.sammy('body', function() {
		this.use(Sammy.JSON);
		this.use(Sammy.Storage); 
	 this.use(Sammy.Template, 'erb');   
		this.debug = true;
		this.bind('refresh',function(){	
		alert('ok');
		});
		
		this.get('#/',function(){	
			hideAllDivs();
				$('#loading').show();
		});
		
			this.get('#selectCliente',function(){		 
		hideAllDivs();
		$('#selectCliente').show();
		});
		
		this.get('#chooseCliente/:id',function(){	
			hideAllDivs();
			currentClienteId = this.params['id'];
			this.redirect('#doPedido/');
		});

			this.get('#doPedido/',function(){	
				hideAllDivs();
				$('#doPedido').show();
				var cliente = map_clientes[currentClienteId];
				$('#nombreDelCliente').html(cliente.Name);
			});
	

		this.bind('loadRemoteData',function(){  	
			var context = this;
				$.ajax({
					url: "/getdata",
					context: document.body,
					success: function(data){
						context.trigger('saveRemoteData',{all: data});
					},
					error: function() {context.trigger('loadLocalData'); 
					}
				});
		})

		this.bind('saveRemoteData', function(e, data) {
			var context =this;
			var temp = JSON.parse(data['all']);
			var count = temp.length -1;
			while (count>-1){
				var t = temp[count];
			
				if(t.type == 'Cliente__c'){
					clientes.push(t);
				}
				else{
					productos.push(t);
				}
				count--;
			
			}
			
			store.set('productos', productos);
			store.set('clientes', clientes);
			context.trigger('loadLocalData');	
		});

		this.bind('loadLocalData', function() {
			var context = this;
			clientes = store.get('clientes'); 
			productos = store.get('productos');
			oportunidades = store.get('oportunidades'); 
			
			$.each(clientes, function(i, item) {
				
				map_clientes[item.Id]=item;	
				
			});
			
			context.redirect('#selectCliente');
		});

		this.bind('doShowClienteSearchResult', function(e, data) {
			var context = this;
			clientes = data['results']
			$.each(clientes, function(i, item) {
					context.partial('/templates/cliente.html.erb', {item: item}, function(html) {
						$('#clientesList').html(html);
					});
	    });
		});
		
		this.bind('run', function() {
			var context = this;
			store = new Sammy.Store({name: 'rodco-facturacion', element: 'body', type: 'local'});
			cart = new Sammy.Store({name: 'rodco-cart', element: 'body', type: 'session'});
			hideAllDivs();
 
			context.trigger('loadRemoteData');
			context.redirect('#/');
		});
		
	});
 
	app.run('#/');

});
