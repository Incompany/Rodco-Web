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
	$(target).val('');
	app.trigger('addProducto',{id: id,cantidad: cantidad});
}

//Exectues onChange of Input type text in Search Productos
function onChangeDescuento(event){
	target = event.currentTarget;
	id=$(target).attr('data-id');
	descuento = $(target).val();
	$(target).val('');
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
			});
		
		this.get('#doLogin/',function(){	
			hideAllDivs();
			
			//init
			$('#loading').show();
			this.trigger('handleLogin');
		});
		
		this.get('#pedido_new/',function(){		 
			hideAllDivs();
			
			//init
			//('#clientesList').html('');
			$('#txt_searchCliente').val('');
			$('#selectCliente').show();
		});
		
		this.get('#pedido_selectCliente/:id',function(){	
			hideAllDivs();
			//init
			$('#txt_searchCliente').val('');
			currentClienteId = this.params['id'];
			this.redirect('#pedido_selectProducto/');
		});
			
		this.get('#pedido_selectProducto/',function(){	
				var context = this;
				hideAllDivs();
				//init
				$('#txt_searchProducto').val('');
				$('.contentFooter').hide();
				$('#doPedido').show();
				
				var cliente = map_clientes[currentClienteId];
				$('#doPedido .title').html(cliente.Name);
								
		});
 		
		this.get('#pedido_save/',function(){	
			var context = this;
			hideAllDivs();

			for(var index in map_selected_productos) {
					item = map_selected_productos[index];
					producto = map_productos[index];
					var cliente = map_clientes[currentClienteId];

					pid = index.split(',')[0];
					cid=currentClienteId.split(',')[0];

					oportunidad=new Object();
					oportunidad.cliente__c = cid;
					oportunidad.producto__c= pid;
					oportunidad.cantidad__c=item.Cantidad ;
					oportunidad.precio__c = item.Precio;
					oportunidad.descuento__c = item.Descuento;
					oportunidad.cliente = cliente.Name; 
					oportunidad.producto = producto.Name; 
					oportunidad.fecha =  new Date();
					oportunidad.type ='Oportunidad__c';
					oportunidades.push(oportunidad);
			}

			//opp_j=this.json(oportunidades);
			store.set('oportunidades', oportunidades);
			context.redirect('#pedido_show/');
		});

		this.get('#pedido_delete/:index',function(){	
			delete oportunidades[this.params['index']];
			store.set('oportunidades', oportunidades);
			this.redirect('#pedido_show/');
		});

			this.get('#pedido_show/',function(){	
				$('#ajaxLoader').hide();
				var context = this;
				hideAllDivs();
				$('#listPedido').show();
				$('#pedidosList').html('');	
				$.each(oportunidades, function(i, item) {
						context.partial('/templates/oportunidadItem.html.erb', {item: item,index: i}, function(html) {
							$('#pedidosList').append(html);
						});
		    });
			});
	
			this.get('#pedido_send/',function(){	
				$('#ajaxLoader').show();
				var query = 'username=' + username + '&password=' + password + '&token='+token + '&oportunidades='+this.json(oportunidades);
				var context = this;
					$.ajax({
						url: "/saveOpportunities",
						type:"POST",
						data: query ,
						context: document.body,
						success: function(data){
							context.trigger('hangleSaveOportunidades',{all: data});
						},
						error: function(re,text,error) {
							context.trigger('handleSaveOportunidadesError',{request: re , text: text , error: error}); 
						}
					});
			});
	
				///////////////////////////////
				///////// EVENTS
				//////////////////////////////////

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
		});

		this.bind('handleLoginError',function(e,data){
			var context = this;
			var re = data['request'];
			if(re.status==500){
				$('#txt_username').val(username);
				$('#txt_password').val(password);
				$('#txt_token').val(token);
				alert('Error haciendo login');
				//context.redirect('#login/');
			}
			else if(re.status==404){
				alert('Trabajando Off-Line');
				if(store.get('authKey')==null){
					alert('No encontramos una session anterior, para hacer Login debe estar conectado a Internet.');
				}
				else{
					//context.trigger('loadLocalData');	
				}
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
			opp = store.get('oportunidades'); 		 
			oportunidades = new Array();
			if(opp!=null){
				$.each(opp, function(i, item) {
					if(item!=null && item != undefined){
						oportunidades.push(item);
					}
				});
			}
			
			$.each(clientes, function(i, item) {
				map_clientes[item.Id]=item;	
			});
			
			$.each(productos, function(i, item) {
				map_productos[item.Id]=item;	
			});
			
			context.redirect('#pedido_show/');
		});



		////////////////////////
		////////// DATA SAVING EVENTS
		
 		this.bind('handleSaveOportunidadesError',function(e,data){
			var context = this;
			var re = data['request'];
			if(re.status='404'){
				alert('No se puedo conectar a internet para enviar los pedidos. Favor revise su conexion.');
			}
			else{
		 		alert('Error del Tipo ' + re.status + ' :: ' + re.statusText + '. Favor reportelo a su administrador.');
			}
			context.redirect('#pedido_show/');
		});

			//TODO IMPROVE THIS WAY TO HANDLE N AND N+1 RESULTS
				this.bind('hangleSaveOportunidades', function(e, data) {
					var context =this;
					var temp = data['all'];
				 	o = this.json(temp);
					results = o.createResponse.result;
					if(results.success=="true"){
						delete oportunidades[0];
					}
					else if(results.success=="false"){
						alert('Resporte este error al Administrador: ' + context.json(results));
					}
					else{	
						$.each(results, function(i, item) {
							if(item.success=="true"){
								delete oportunidades[i];
							}
							else{
									alert('Resporte este error al Administrador: ' + context.json(item));
							}
						});
					}
				
					store.set('oportunidades', oportunidades);
					
					context.redirect('#pedido_show/');
				});

		////////////////////////
		////////// SEARCH EVENTS

		this.bind('doShowClienteSearchResult', function(e, data) {
			var context = this;
			tempclientes = data['results']
			$('#clientesList').html(' ');
			$.each(tempclientes, function(i, item) {
					context.partial('/templates/clienteItem.html.erb', {item: item}, function(html) {
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
				
				$('#txt_username').val(store.get('username'));
				$('#txt_password').val(store.get('password'));
				$('#txt_token').val(store.get('token'));
				
			context.redirect('#login/');
		 
		});
		
	});
 
	app.run('#/');

});
