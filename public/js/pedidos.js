var app;
var store;
var cart;
//holds clientes in arrat
var clientes=[];

//holds clientes in map
var map_clientes=[];

//holds productos in array
var productos=[];

//holds productos in map
var map_productos=[];

//productos to be saved in pedido
var map_selected_productos=[];

//oportunidades
var oportunidades = new Array();

//placeholder for selected cliente
var currentClienteId='';
var username='';
var password='';
var token='';

//Used in routs to hide all step divs 
function hideAllDivs(){
	$('#loading').hide();
	$('#login').hide();
	$('#listPedido').hide();
	$('#selectCliente').hide();
	$('#doPedido').hide();
	$('#txt_searchCliente,#txt_searchProducto').val='';
}

//Exectues onChange of Input type text in Search Productos
function selectProducto(event){
	target = event.currentTarget;
	id=$(target).attr('data-id');
	cantidad = $(target).val();
	app.trigger('addProducto',{id: id,cantidad: cantidad});
}

//Exectues onChange of Input type text in Search Productos
function onChangeDescuento(event){
	target = event.currentTarget;
	id=$(target).attr('data-id');
	descuento = $(target).val();
	app.trigger('addDescuento',{id: id,descuento: descuento});
}
 

//Executes onchange of txt_searchcliente
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
	
	
	//executes onChange of txtSearchProducto
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
				
				//init
				$('#login').show();
				$('#btn_login').click(function(){
					context.trigger('handleLogin');
				});
			});
		
		this.get('#loading/',function(){	
			hideAllDivs();
			
			//init
			$('#loading').show();
		});
		
		this.get('#selectCliente',function(){		 
			hideAllDivs();
			
			//init
			$('#txt_searchCliente').val('');
			$('#selectCliente').show();
		});
		
		this.get('#chooseCliente/:id',function(){	
			hideAllDivs();
			
			//init
			currentClienteId = this.params['id'];
			this.redirect('#doPedido/');
		});
		
 

			this.get('#doPedido/',function(){	
				var context = this;
				hideAllDivs();
			
				//init
				$('#txt_searchProducto').val('');
				$('.contentFooter').hide();
				$('#doPedido').show();
				
				var cliente = map_clientes[currentClienteId];
				$('#doPedido .title').html(cliente.Name);
				
				$('#btnSave').click(function(){
					context.trigger('savePedido');
				});
				
				$('#btnRestart').click(function(){
					context.redirect('#selectCliente/');
				});
				
		});
	
			this.get('#showPedidos/',function(){	
				var context = this;
				hideAllDivs();
				$('#listPedido').show();
				$('#pedidosList').html('');	
				$.each(oportunidades, function(i, item) {
					
						context.partial('/templates/pedidoItem.html.erb', {item: item}, function(html) {
							$('#pedidosList').append(html);
						});
		    });
			});
	
				///////////////////////////////
				///////// EVENTS
				//////////////////////////////////

				////////////////////////
				////////// PEDIDO  EVENTS
				this.bind('savePedido', function(e, data) {

					var context = this;
					hideAllDivs();

					for(var index in map_selected_productos) {

							item = map_selected_productos[index];

							producto = map_productos[index];

							var cliente = map_clientes[currentClienteId];

							oportunidad=[];
							oportunidad['cliente__c'] = currentClienteId;
							oportunidad['producto__c']= index[0];
							oportunidad['cantidad__c']=item.Cantidad ;
							oportunidad['precio__c'] = item.Precio;
							oportunidad['descuento__c'] = item.Descuento;
							oportunidad['cliente'] = cliente.Name; 
							oportunidad['producto'] = producto.Name; 

							oportunidades.push(this.json(oportunidad));
							
					}
					
					store.set('oportunidades', oportunidades);	
					context.redirect('#showPedidos/');
					
				});

			////////////////////////
			////////// PRODUCT  EVENTS
			
			
				this.bind('addDescuento', function(e, data) {
					var context = this;
					id = data['id'];
					descuento = data['descuento'];
					map_selected_productos[id].Descuento = descuento; 
					context.trigger('refreshTotal');
				});
			
			//adds a product to list, or if "0" removes the producto
			//Fires from SearchTemplate and from ItemListTemplate
			this.bind('addProducto', function(e, data) {
				var context = this;
				id = data['id'];
				cantidad = data['cantidad'];

					pObj = map_selected_productos[id];
					if(pObj==null){
						otherP = map_productos[id];
						map_selected_productos[id]= {Id:id,Cantidad: cantidad, Name: otherP.Name, Precio: otherP.PrecioMinimo__c,Descuento: otherP.DescuentoMinimo__c,Impuesto: otherP.Impuesto__c }; 
					}
					if(pObj!=null && cantidad==0){
						delete map_selected_productos[id]
					}
					else{
						map_selected_productos[id].Cantidad = cantidad; 
					}
					
					context.trigger('refreshTotal');
			});

			//Refreshes Producto Views, RERENDER
			this.bind('refreshShowProductos', function(e, data) {
				var context = this;
					$('#selectedProductosList').html(' ');
					
					tempArray=[];
					
					for(var index in map_selected_productos) {
						tempArray.push(map_selected_productos[index]);
					}
					
					
					$.each(tempArray, function(i, item) {
							context.partial('/templates/productoItemList.html.erb', {item: item}, function(html) {
								$('#selectedProductosList').append(html);
							});
					});
					
					
			});

			//Calculates Total for Selected Items
				this.bind('refreshTotal', function(e, data) {
					var context = this;
					 var total =0;
						$('.contentFooter').show();

						for(var index in map_selected_productos) {
							
							item = map_selected_productos[index];
							
							producto = map_productos[index];
							
							//if(item.Cantidad > producto.InventarioActual__c){ 
								//item.Cantidad = producto.InventarioActual__c; 
							//}
							subtotal = item.Cantidad * item.Precio;
							descuento = subtotal *  item.Descuento / 100;
							impuesto = (subtotal - descuento) * item.Impuesto / 100;
							total += subtotal -descuento + impuesto;
						}

						$('#totalPlaceHolder').html('Total: c/ ' + total);
						
						context.trigger('refreshShowProductos');
						
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
			
			if(oportunidades==null || oportunidades == undefined){
				oportunidades = new Array();
			}
			
			$.each(clientes, function(i, item) {
				
				map_clientes[item.Id]=item;	
				
			});
			
			$.each(productos, function(i, item) {
				
				map_productos[item.Id]=item;	
				
			});
			
			
			context.redirect('#showPedidos/');
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
					context.partial('/templates/productoSearch.html.erb', {item: item}, function(html) {
						
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
