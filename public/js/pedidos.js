var app;
var store;
var cart;
var clientes=[];
var map_clientes=[];
var productos=[];
var map_productos=[];
var map_selected_productos=[];
var oportunidades=[];
var currentClienteId='';
var username='';
var password='';
var token='';


function hideAllDivs(){
	$('#loading').hide();
	$('#login').hide();
	$('#selectCliente').hide();
	$('#doPedido').hide();
	$('#txt_searchCliente,#txt_searchProducto').val='';
}

function selectProducto(event){
	target = event.currentTarget;
	id=$(target).attr('data-id');
	cantidad = $(target).val();
	app.trigger('addProducto',{id: id,cantidad: cantidad});
}

function doSearchClientes(){
	var currentVal = $('#txt_searchCliente').val();
	var results=[];
	var count = clientes.length -1;
	while(count > -1){
		var cliente = clientes[count];
		var res = cliente.Name.toLowerCase().search(currentVal.toLowerCase());
		if(res>-1){
			results.push(cliente);
		}
		count--;
	}
		app.trigger('doShowClienteSearchResult',{results: results});
}
	
	function doSearchProductos(){
		var currentVal = $('#txt_searchProducto').val();
		var results=[];
		var count = productos.length -1;
		while(count > -1){
			var producto = productos[count];
			var res = producto.Name.toLowerCase().search(currentVal.toLowerCase());
			if(res>-1){
				results.push(producto);
			}
			count--;
		}
			app.trigger('doShowProductoSearchResult',{results: results});
	}
 
	
	$(document).ready(function(){
		app = $.sammy('body', function() {
		this.use(Sammy.JSON);
		this.use(Sammy.Storage); 
		this.use(Sammy.Template, 'erb');   
		this.debug = true;
	
		///////////////////////////////
		///////// ROUTES
		//////////////////////////////////
	
			this.get('#login/',function(){	
				hideAllDivs();
			var context = this;
				$('#login').show();
				$('#btn_login').click(function(){
					context.trigger('handleLogin');
				});
			});
		
		this.get('#loading/',function(){	
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
		
		this.get('#chooseProducto/:id',function(){	
			
		});

			this.get('#doPedido/',function(){	
				var context = this;
				hideAllDivs();
				$('#doPedido').show();
				var cliente = map_clientes[currentClienteId];
				$('#doPedido .title').html(cliente.Name);
				$('#btn_restart_pedido').click(function(){
						context.redirect('#selectCliente/');
				});
			});
	
	
	
				///////////////////////////////
				///////// EVENTS
				//////////////////////////////////


			////////////////////////
			////////// PRODUCT  EVENTS
			
			this.bind('addProducto', function(e, data) {
				var context = this;
				id = data['id'];
				cantidad = data['cantidad'];
					//checkCurrentProduct quantitu
					pObj = map_selected_productos[id];
					if(pObj==null){
						otherP = map_productos[id];
						//map_selected_productos[id]= {Id:id,Cantidad: cantidad, Name: otherP.Name, PrecioMinimo__c: otherP.PrecioMinimo__c }; 
					}
					else{
						map_selected_productos[id].Cantidad = cantidad; 
					}
					context.trigger('refreshShowProductos');
			});

			this.bind('refreshShowProductos', function(e, data) {
					$('#selectedProductosList').html(' ');
					$.each(map_selected_productos, function(i, item) {
							context.partial('/templates/productoShow.html.erb', {item: item}, function(html) {
								$('#selectedProductosList').append(html);
							});
					});
			});

		////////////////////////
		////////// LOGIN EVENTS
		
		this.bind('handleLogin',function(){
		var context = this;
			username = $('#txt_username').val();
			password = $('#txt_password').val();
			token = $('#txt_token').val();
			
			store.set('username',username);
			store.set('password',password);
			store.set('token',token);
			
			context.trigger('loadRemoteData');
			context.redirect('#loading/');
			
		});

		this.bind('handleLoginError',function(e,data){
			var context = this;
			var re = data['request'];
			if(re.status==500){
				$('#txt_username').val(username);
				$('#txt_password').val(password);
				$('#txt_token').val(token);
				alert('Error haciendo login');
				context.redirect('#login/');
			}
			else if(re.status==404){
				//alert('Trabajando Off-Line');
				context.trigger('loadLocalData');	
			}
		
		});

		////////////////////////
		////////// DATA LOADING EVENTS

		this.bind('loadRemoteData',function(){  	
			var query = 'username=' + username + '&password=' + password + '&token='+token;
			var context = this;
				$.ajax({
					url: "/getdata",
					type:"GET",
					data: query ,
					context: document.body,
					success: function(data){
						context.trigger('saveRemoteData',{all: data});
					},
					error: function(re,text,error) {
						context.trigger('handleLoginError',{request: re , text: text , error: error}); 
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
			
			$.each(productos, function(i, item) {
				
				map_productos[item.Id]=item;	
				
			});
			
			
			context.redirect('#selectCliente');
		});


		////////////////////////
		////////// SEARCH EVENTS

		this.bind('doShowClienteSearchResult', function(e, data) {
			var context = this;
			tempclientes = data['results']
			$('#clientesList').html(' ');
			$.each(tempclientes, function(i, item) {
					context.partial('/templates/cliente.html.erb', {item: item}, function(html) {
						$('#clientesList').append(html);
					});
	    });
		});
		
		this.bind('doShowProductoSearchResult', function(e, data) {
			var context = this;
			tempproductos = data['results']
				$('#productosList').html(' ');
			$.each(tempproductos, function(i, item) {
					context.partial('/templates/productoSelect.html.erb', {item: item}, function(html) {
						
						$('#productosList').append(html);
					});
	    });
		});
		
		////////////////////////
		////////// APP EVENTS
		
		this.bind('run', function() {
			var context = this;
			store = new Sammy.Store({name: 'rodco-facturacion', element: 'body', type: 'local'});
			cart = new Sammy.Store({name: 'rodco-cart', element: 'body', type: 'session'});
		
			if(store.get('username')==null){
				context.redirect('#login/');
			}
			else{
				username = store.get('username');
				password = store.get('password');
				token = store.get('token');
				context.trigger('loadRemoteData');
				context.redirect('#loading/');
			}
			 
		
		});
		
	});
 
	app.run('#/');

});
